import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getOpenAIApiKey, getOpenAIModel } from '../../lib/env';
import { OPENAI_CONFIG } from '../../lib/config';
import { logger } from '../../lib/logger';
import { getErrorMessage } from '../../lib/errors';
import { createClaimGenerationPrompt } from '../../lib/prompts';
import { getLanguageInstruction } from '../../lib/language-detect';

/**
 * POST endpoint for generating interesting claims/questions
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestTimer = logger.startTimer('POST /api/generate-claim');
  const startTime = Date.now();
  let statusCode = 200;

  // Generate request ID for tracing
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  logger.setRequestId(requestId);

  try {
    logger.requestStart('POST', '/api/generate-claim', { requestId });

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      statusCode = 400;
      logger.warn('Invalid JSON in request body', { error: getErrorMessage(error) });
      logger.clearRequestId();
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      statusCode = 400;
      logger.warn('Request body must be a JSON object');
      logger.clearRequestId();
      return NextResponse.json(
        { error: 'Request body must be a JSON object' },
        { status: 400 }
      );
    }

    const requestBody = body as Record<string, unknown>;
    const dreamMode = requestBody.dreamMode === true;
    const language = typeof requestBody.language === 'string' ? requestBody.language : 'en';

    logger.info('Generating claim', { dreamMode, language });

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey: getOpenAIApiKey() });
    const modelName = getOpenAIModel(OPENAI_CONFIG.DEFAULT_MODEL);

    // Get language instruction
    const languageInstruction = getLanguageInstruction(language);

    // Generate claim using OpenAI
    const prompt = createClaimGenerationPrompt(dreamMode, languageInstruction);

    logger.debug('Calling OpenAI for claim generation', {
      model: modelName,
      effort: OPENAI_CONFIG.CLAIM_GENERATION_EFFORT,
      maxTokens: OPENAI_CONFIG.CLAIM_GENERATION_MAX_TOKENS,
    });

    const apiStart = Date.now();
    const response = await openai.responses.create({
      model: modelName,
      reasoning: { effort: OPENAI_CONFIG.CLAIM_GENERATION_EFFORT },
      max_output_tokens: OPENAI_CONFIG.CLAIM_GENERATION_MAX_TOKENS,
      instructions: prompt,
      input: 'Generate an interesting claim or question.',
    });
    const apiDuration = Date.now() - apiStart;

    logger.apiCall('OpenAI', 'claim-generation', apiDuration, {
      model: modelName,
      effort: OPENAI_CONFIG.CLAIM_GENERATION_EFFORT,
      usage: response.usage,
      responseId: response.id,
    });

    const content = response.output_text;
    if (!content) {
      logger.error('No content in OpenAI response', undefined, {
        responseId: response.id,
        status: response.status,
      });
      throw new Error('No content generated');
    }

    logger.debug('OpenAI response received', {
      hasOutputText: !!response.output_text,
      outputLength: response.output_text?.length,
      responseId: response.id,
    });

    // Parse JSON response
    let parsed: { claim: string };
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      logger.error('Failed to parse claim generation response as JSON', error, {
        contentLength: content.length,
        contentPreview: content.substring(0, 100),
      });
      throw new Error('Invalid response format from AI');
    }

    if (!parsed.claim || typeof parsed.claim !== 'string') {
      logger.error('Invalid claim format in response', undefined, { parsed });
      throw new Error('Invalid claim format');
    }

    const responseTimeMs = Date.now() - startTime;

    logger.info('Claim generated successfully', {
      claimLength: parsed.claim.length,
      dreamMode,
      language,
    });

    requestTimer.end({
      dreamMode,
      language,
      claimLength: parsed.claim.length,
    });

    logger.requestEnd('POST', '/api/generate-claim', 200, responseTimeMs, {
      dreamMode,
      language,
    });

    logger.clearRequestId();

    return NextResponse.json({ claim: parsed.claim });
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    statusCode = 500;

    logger.error('Claim generation failed', error);

    requestTimer.end({ failed: true, statusCode });

    logger.requestEnd('POST', '/api/generate-claim', statusCode, responseTimeMs, {
      error: true,
      errorMessage: getErrorMessage(error),
    });

    logger.clearRequestId();

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
