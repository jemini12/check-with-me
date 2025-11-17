import { NextRequest, NextResponse } from 'next/server';
import { checkFacts } from '../../lib/fact-checker';
import { validateFactCheckInput } from '../../lib/validation';
import { logger } from '../../lib/logger';
import { isAppError, ValidationError, getErrorMessage } from '../../lib/errors';
import { ERROR_MESSAGES } from '../../lib/config';
import { logFactCheck, getFromHistory, generateSessionId, hashIp } from '../../lib/history';
import { ProgressEvent } from '../../lib/types';

/**
 * Creates an error response with appropriate status code
 */
function createErrorResponse(error: unknown): NextResponse {
  if (isAppError(error)) {
    logger.warn('API request failed with known error', { error: error.message, code: error.code });
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  logger.error('API request failed with unexpected error', error);
  return NextResponse.json(
    { error: ERROR_MESSAGES.PROCESSING_FAILED, code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}

/**
 * Parses and validates the request body
 * @throws {ValidationError} If the request body is invalid
 */
async function parseAndValidateRequest(request: NextRequest): Promise<string> {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body', {
      error: getErrorMessage(error),
    });
  }

  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be a JSON object');
  }

  const requestBody = body as Record<string, unknown>;

  if (!('text' in requestBody)) {
    throw new ValidationError(ERROR_MESSAGES.INVALID_TEXT);
  }

  return validateFactCheckInput(requestBody.text);
}

/**
 * POST endpoint for fact-checking text
 * Supports both streaming (SSE) and standard JSON responses
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  let text = '';

  // Get client info for logging
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');
  const sessionId = generateSessionId(ip, userAgent);
  const ipHash = hashIp(ip);

  // Check if client accepts streaming
  const acceptHeader = request.headers.get('accept') || '';
  const wantsStream = acceptHeader.includes('text/event-stream');

  try {
    logger.info('Received fact-check request', { wantsStream });

    // Parse and validate request
    text = await parseAndValidateRequest(request);

    logger.debug('Request validated', { textLength: text.length });

    // Check cache from history first
    const cachedResult = await getFromHistory(text);
    if (cachedResult) {
      const responseTimeMs = Date.now() - startTime;
      logger.info('Returning cached result from history', { responseTimeMs });

      // Still log the cache hit
      await logFactCheck({
        originalText: text,
        result: cachedResult,
        responseTimeMs,
        sessionId,
        ipHash: ipHash || undefined,
        userAgent: userAgent || undefined,
      });

      // For streaming requests, send cached result as complete event
      if (wantsStream) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            // Send complete event with cached result
            const event: ProgressEvent = {
              type: 'complete',
              message: 'Loaded from cache',
              data: { result: cachedResult },
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            controller.close();
          },
        });

        return new NextResponse(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      }

      return NextResponse.json(cachedResult);
    }

    // Handle streaming response
    if (wantsStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Perform fact-checking with progress callback
            const response = await checkFacts(text, (event: ProgressEvent) => {
              // Send progress event
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            });

            const responseTimeMs = Date.now() - startTime;

            // Don't cache if claims were found but all were below confidence threshold
            const shouldCache = !(
              response.claim_results &&
              response.claim_results.length > 0 &&
              response.fact_checks.length === 0
            );

            if (shouldCache) {
              // Log to history
              await logFactCheck({
                originalText: text,
                result: response,
                responseTimeMs,
                sessionId,
                ipHash: ipHash || undefined,
                userAgent: userAgent || undefined,
              });
            } else {
              logger.info('Skipping cache - all results below confidence threshold', {
                claimCount: response.claim_results?.length || 0,
              });
            }

            logger.info('Streaming fact-check completed', { responseTimeMs });
          } catch (error) {
            // Send error event
            const errorEvent: ProgressEvent = {
              type: 'error',
              message: getErrorMessage(error),
              data: {
                error: {
                  message: getErrorMessage(error),
                  code: isAppError(error) ? error.code : 'UNKNOWN_ERROR',
                },
              },
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));

            // Log error
            const responseTimeMs = Date.now() - startTime;
            await logFactCheck({
              originalText: text,
              result: { original_text: text, fact_checks: [] },
              responseTimeMs,
              sessionId,
              ipHash: ipHash || undefined,
              userAgent: userAgent || undefined,
              isError: true,
              errorMessage: getErrorMessage(error),
            });
          } finally {
            controller.close();
          }
        },
      });

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Standard JSON response
    const response = await checkFacts(text);

    const responseTimeMs = Date.now() - startTime;

    logger.info('Fact-check request completed successfully', {
      textLength: text.length,
      factChecksFound: response.fact_checks.length,
      hasFailures: response.has_failures,
      failedClaims: response.claim_results?.filter(r => r.status === 'failed').length || 0,
      responseTimeMs,
    });

    // Don't cache if claims were found but all were below confidence threshold
    const shouldCache = !(
      response.claim_results &&
      response.claim_results.length > 0 &&
      response.fact_checks.length === 0
    );

    if (shouldCache) {
      // Log to history
      await logFactCheck({
        originalText: text,
        result: response,
        responseTimeMs,
        sessionId,
        ipHash: ipHash || undefined,
        userAgent: userAgent || undefined,
      });
    } else {
      logger.info('Skipping cache - all results below confidence threshold', {
        claimCount: response.claim_results?.length || 0,
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;

    // Log error to history if we have the text
    if (text) {
      await logFactCheck({
        originalText: text,
        result: { original_text: text, fact_checks: [] },
        responseTimeMs,
        sessionId,
        ipHash: ipHash || undefined,
        userAgent: userAgent || undefined,
        isError: true,
        errorMessage: getErrorMessage(error),
      });
    }

    return createErrorResponse(error);
  }
}
