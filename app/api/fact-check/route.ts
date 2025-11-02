import { NextRequest, NextResponse } from 'next/server';
import { checkFacts } from '../../lib/fact-checker';
import { FactCheckResponse } from '../../lib/types';
import { validateFactCheckInput } from '../../lib/validation';
import { logger } from '../../lib/logger';
import { isAppError, ValidationError, getErrorMessage } from '../../lib/errors';
import { ERROR_MESSAGES } from '../../lib/config';

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
  try {
    logger.info('Received fact-check request');

    // Parse and validate request
    const text = await parseAndValidateRequest(request);

    logger.debug('Request validated', { textLength: text.length });

    // Perform fact-checking
    const factChecks = await checkFacts(text);

    // Build response
    const response: FactCheckResponse = {
      original_text: text,
      fact_checks: factChecks,
    };

    logger.info('Fact-check request completed successfully', {
      textLength: text.length,
      factChecksFound: factChecks.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    return createErrorResponse(error);
  }
}
