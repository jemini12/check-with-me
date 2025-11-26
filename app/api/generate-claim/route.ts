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
  try {
    logger.info('Received claim generation request');

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be a JSON object' },
        { status: 400 }
      );
    }

    const requestBody = body as Record<string, unknown>;
    const dreamMode = requestBody.dreamMode === true;
    const language = typeof requestBody.language === 'string' ? requestBody.language : 'en';

    logger.debug('Generating claim', { dreamMode, language });

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey: getOpenAIApiKey() });
    const modelName = getOpenAIModel(OPENAI_CONFIG.DEFAULT_MODEL);

    // Get language instruction
    const languageInstruction = getLanguageInstruction(language);

    // Generate claim using OpenAI
    const prompt = createClaimGenerationPrompt(dreamMode, languageInstruction);

    const response = await openai.responses.create({
      model: modelName,
      reasoning: { effort: OPENAI_CONFIG.CLAIM_GENERATION_EFFORT },
      max_output_tokens: OPENAI_CONFIG.CLAIM_GENERATION_MAX_TOKENS,
      instructions: prompt,
      input: 'Generate an interesting claim or question.',
    });

    logger.debug('OpenAI response received', {
      hasOutputText: !!response.output_text,
      outputLength: response.output_text?.length,
      responseKeys: Object.keys(response)
    });

    const content = response.output_text;
    if (!content) {
      logger.error('No content in response', { response: JSON.stringify(response) });
      throw new Error('No content generated');
    }

    // Parse JSON response
    let parsed: { claim: string };
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      logger.error('Failed to parse claim generation response', { content });
      throw new Error('Invalid response format from AI');
    }

    if (!parsed.claim || typeof parsed.claim !== 'string') {
      throw new Error('Invalid claim format');
    }

    logger.info('Claim generated successfully', { length: parsed.claim.length });

    return NextResponse.json({ claim: parsed.claim });
  } catch (error) {
    logger.error('Claim generation failed', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
