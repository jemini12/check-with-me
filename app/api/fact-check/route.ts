import { NextRequest, NextResponse } from 'next/server';
import { checkFacts } from '../../lib/fact-checker';
import { validateFactCheckInput } from '../../lib/validation';
import { logger } from '../../lib/logger';
import { isAppError, ValidationError, getErrorMessage } from '../../lib/errors';
import { ERROR_MESSAGES } from '../../lib/config';
import { logFactCheck, getFromHistory, generateSessionId, hashIp } from '../../lib/history';

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
 * Validates input, performs fact-checking, and returns results
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  let text = '';

  // Get client info for logging
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');
  const sessionId = generateSessionId(ip, userAgent);
  const ipHash = hashIp(ip);

  try {
    logger.info('Received fact-check request');

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

      return NextResponse.json(cachedResult);
    }

    // Perform fact-checking with web search
    const response = await checkFacts(text);

    const responseTimeMs = Date.now() - startTime;

    logger.info('Fact-check request completed successfully', {
      textLength: text.length,
      factChecksFound: response.fact_checks.length,
      hasFailures: response.has_failures,
      failedClaims: response.claim_results?.filter(r => r.status === 'failed').length || 0,
      responseTimeMs,
    });

    // Log to history
    await logFactCheck({
      originalText: text,
      result: response,
      responseTimeMs,
      sessionId,
      ipHash: ipHash || undefined,
      userAgent: userAgent || undefined,
    });

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
