import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { checkFacts } from '../../lib/fact-checker';
import { FactCheckResponse } from '../../lib/types';
import { validateFactCheckInput } from '../../lib/validation';
import { logger } from '../../lib/logger';
import { isAppError, ValidationError, getErrorMessage } from '../../lib/errors';
import { ERROR_MESSAGES, OPENAI_CONFIG } from '../../lib/config';
import { SANTA_DETECTION_PROMPT, SANTA_SENTIMENT_PROMPT, SANTA_QA_PROMPT, createSantaQAInput } from '../../lib/prompts';
import { getOpenAIApiKey, getOpenAIModel } from '../../lib/env';
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
 * Uses LLM to detect if this is a Santa-related question (any language)
 */
async function isSantaQuery(text: string): Promise<boolean> {
  try {
    const modelName = getOpenAIModel(OPENAI_CONFIG.DEFAULT_MODEL);
    logger.info('Checking if text is Santa-related', { text, model: modelName });

    const openai = new OpenAI({
      apiKey: getOpenAIApiKey(),
    });

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'user', content: `${SANTA_DETECTION_PROMPT}\n\nText: "${text}"\n\nAnswer:` }
      ],
      max_completion_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    const result = content?.trim().toUpperCase();

    logger.info('Santa detection result', {
      text,
      model: modelName,
      rawContent: content,
      result,
      isSanta: result?.includes('YES') || false,
      finishReason: response.choices[0]?.finish_reason,
      usage: response.usage
    });

    // Check if result contains YES (more flexible matching)
    return result?.includes('YES') || false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('Santa detection failed, proceeding with normal fact-checking', { error: errorMessage });
    return false;
  }
}

/**
 * Analyzes if Santa text is negative statement, positive statement, or question
 */
interface SantaSentiment {
  type: 'negative_statement' | 'positive_statement' | 'question';
  sentiment: 'negative' | 'positive' | 'neutral';
}

async function analyzeSantaText(text: string): Promise<SantaSentiment> {
  try {
    const modelName = getOpenAIModel(OPENAI_CONFIG.DEFAULT_MODEL);
    logger.info('Analyzing Santa text sentiment', { text, model: modelName });

    const openai = new OpenAI({
      apiKey: getOpenAIApiKey(),
    });

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'user', content: `${SANTA_SENTIMENT_PROMPT}\n\nText: "${text}"\n\nJSON:` }
      ],
      max_completion_tokens: 1000, // High limit for reasoning models to ensure JSON output
    });

    const content = response.choices[0]?.message?.content?.trim();
    logger.info('Santa sentiment analysis result', {
      text,
      rawContent: content,
      usage: response.usage,
      finishReason: response.choices[0]?.finish_reason,
    });

    // Try to parse JSON
    if (content) {
      try {
        const parsed = JSON.parse(content) as SantaSentiment;
        logger.info('Parsed sentiment', { parsed });
        return parsed;
      } catch (e) {
        logger.warn('Failed to parse sentiment JSON, using default', { content });
      }
    }

    // Default to question if parsing fails
    return { type: 'question', sentiment: 'neutral' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('Santa sentiment analysis failed, defaulting to question', { error: errorMessage });
    return { type: 'question', sentiment: 'neutral' };
  }
}

/**
 * Generates kid-friendly Santa answer using AI (responds in same language as question)
 */
async function generateSantaAnswer(text: string, sentiment: SantaSentiment): Promise<string> {
  try {
    logger.info('Generating Santa answer', { text, sentiment });

    const openai = new OpenAI({
      apiKey: getOpenAIApiKey(),
    });

    // Build context-aware prompt with variety
    let contextPrompt = SANTA_QA_PROMPT;

    if (sentiment.type === 'negative_statement') {
      // Vary the correction approach for creativity
      const corrections = [
        'The user incorrectly said Santa doesn\'t exist. Gently correct them with a sprinkle of Christmas magic and reassure them that Santa is wonderfully real.',
        'The user doubts Santa\'s existence. Share a magical detail that proves Santa is real - maybe mention the North Pole, reindeer tracks, or Christmas morning miracles.',
        'The user thinks Santa isn\'t real. Warmly and creatively reassure them that Santa absolutely exists, adding enchanting details that bring the magic to life.',
      ];
      contextPrompt += '\n\nCONTEXT: ' + corrections[Math.floor(Math.random() * corrections.length)];
    } else if (sentiment.type === 'positive_statement') {
      // Vary the affirmation style
      const affirmations = [
        'The user correctly believes Santa is real. Affirm their belief warmly with extra magical details.',
        'The user knows Santa exists! Celebrate their belief with an enchanting detail about Santa\'s world.',
        'The user is right about Santa! Add a sprinkle of Christmas magic to your affirmation.',
      ];
      contextPrompt += '\n\nCONTEXT: ' + affirmations[Math.floor(Math.random() * affirmations.length)];
    } else {
      // Vary the question response approach
      const approaches = [
        'The user is asking a question about Santa. Answer with magical details and wonder.',
        'The user wants to know more about Santa. Share an enchanting answer filled with Christmas spirit.',
        'The user is curious about Santa. Provide a creative, magical answer that brings joy.',
      ];
      contextPrompt += '\n\nCONTEXT: ' + approaches[Math.floor(Math.random() * approaches.length)];
    }

    const response = await openai.chat.completions.create({
      model: getOpenAIModel(OPENAI_CONFIG.DEFAULT_MODEL),
      messages: [
        { role: 'system', content: contextPrompt },
        { role: 'user', content: createSantaQAInput(text) }
      ],
      max_completion_tokens: 2000, // High limit for reasoning models (gpt-5-nano uses ~500 reasoning + answer)
      // Note: gpt-5 only supports default temperature (1.0)
    });

    const answer = response.choices[0]?.message?.content?.trim() || "Santa really exists! 🎅";
    logger.info('Santa answer generated', {
      answer,
      sentiment,
      usage: response.usage,
      finishReason: response.choices[0]?.finish_reason,
      isFallback: !response.choices[0]?.message?.content,
    });

    return answer;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('Santa Q&A generation failed, using fallback', { error: errorMessage });
    return "Santa really exists! 🎅";
  }
}

/**
 * Creates the Santa Claus easter egg response with AI-generated kid-friendly answer
 */
async function createSantaResponse(text: string): Promise<FactCheckResponse> {
  // Analyze sentiment to determine if it's negative statement, positive statement, or question
  const sentiment = await analyzeSantaText(text);
  logger.info('Creating Santa response with sentiment', { sentiment });

  // Generate context-aware answer
  const answer = await generateSantaAnswer(text, sentiment);

  // Determine accuracy based on sentiment type
  let is_accurate: boolean;
  let correction: string | null;

  if (sentiment.type === 'negative_statement') {
    // User claims Santa doesn't exist → FALSE
    is_accurate = false;
    // Note: correction set to null because the 'reason' field already contains
    // the full kid-friendly correction in the user's language
    correction = null;
    logger.info('Marking as inaccurate (negative statement about Santa)', { text });
  } else {
    // Positive statements or questions → TRUE
    is_accurate = true;
    correction = null;
    logger.info('Marking as accurate (positive statement or question)', { text, type: sentiment.type });
  }

  return {
    original_text: text,
    fact_checks: [
      {
        claim: text,
        is_accurate,
        confidence: 1.0,
        reason: answer,
        correction,
        start: 0,
        end: text.length,
        sources: []
      }
    ]
  };
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

    // Easter egg: Use LLM to detect Santa queries (any language, kid-friendly AI response, skips web search)
    logger.info('Starting Santa detection check...');
    const isSanta = await isSantaQuery(text);
    logger.info('Santa detection check complete', { isSanta });

    if (isSanta) {
      logger.info('🎅 Santa easter egg triggered - generating kid-friendly answer in same language, no web search');
      const santaResponse = await createSantaResponse(text);
      logger.info('Santa response created successfully');

      const responseTimeMs = Date.now() - startTime;

      // Log santa response
      await logFactCheck({
        originalText: text,
        result: santaResponse,
        responseTimeMs,
        sessionId,
        ipHash: ipHash || undefined,
        userAgent: userAgent || undefined,
      });

      return NextResponse.json(santaResponse);
    }

    logger.info('Not a Santa query, proceeding with normal fact-checking');

    // Perform fact-checking with web search
    const factChecks = await checkFacts(text);

    // Build response
    const response: FactCheckResponse = {
      original_text: text,
      fact_checks: factChecks,
    };

    const responseTimeMs = Date.now() - startTime;

    logger.info('Fact-check request completed successfully', {
      textLength: text.length,
      factChecksFound: factChecks.length,
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
