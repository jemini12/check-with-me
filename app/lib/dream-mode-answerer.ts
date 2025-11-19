/**
 * Dream Mode - Creative imagination answering without fact-checking
 * No web search, pure AI creativity and imagination
 */

import OpenAI from 'openai';
import { FactCheck, FactCheckResponse, ProgressEvent } from './types';
import { OPENAI_CONFIG } from './config';
import { logger } from './logger';
import { createDreamModePrompt } from './prompts';
import { safeJsonParse } from './validation';
import { ProcessingError } from './errors';

/**
 * Answer question using pure imagination (Dream Mode)
 * @param openai - OpenAI client
 * @param question - User's question or prompt
 * @param modelName - Model to use
 * @param languageInstruction - Language for response
 * @param onProgress - Progress callback
 * @returns Creative, imaginative answer
 */
export async function answerInDreamMode(
  openai: OpenAI,
  question: string,
  modelName: string,
  languageInstruction: string,
  onProgress?: (event: ProgressEvent) => void
): Promise<FactCheckResponse> {

  const processStart = Date.now();

  logger.info('Dream Mode activated', { question });

  // Step 1: Generate creative answer
  onProgress?.({
    type: 'screening',
    message: 'Dreaming up an answer...',
    data: { isDreamMode: true }
  });

  const params = {
    model: modelName,
    reasoning: { effort: 'medium' as const },
    max_output_tokens: OPENAI_CONFIG.MAX_OUTPUT_TOKENS,
  };

  const dreamResponse = await openai.responses.create({
    ...params,
    instructions: createDreamModePrompt(languageInstruction),
    input: `Question: ${question}`,
  });

  const dreamContent = dreamResponse.output_text;

  if (!dreamContent) {
    throw new ProcessingError('No dream response received');
  }

  logger.debug('Dream answer generated', {
    answerLength: dreamContent.length,
  });

  const parsedDream = safeJsonParse<{ answer: string; style: string }>(
    dreamContent.trim()
  );

  if (!parsedDream || !parsedDream.answer) {
    throw new ProcessingError('Failed to parse dream response', {
      content: dreamContent.substring(0, 200),
    });
  }

  const answer = parsedDream.answer;

  // Create a dream mode fact check (purple theme)
  const dreamFactCheck: FactCheck = {
    claim: answer,
    start: 0,
    end: answer.length,
    is_accurate: true,
    confidence: 1.0,
    reason: parsedDream.style || 'Creative storytelling',
    correction: null,
    sources: [],
    is_question: false,
    is_dream_mode: true, // This triggers purple styling
  };

  logger.info('Dream Mode answer complete', {
    answerLength: answer.length,
    elapsedMs: Date.now() - processStart,
  });

  const result: FactCheckResponse = {
    original_text: question,
    fact_checks: [dreamFactCheck],
    has_failures: false,
  };

  onProgress?.({
    type: 'complete',
    message: 'Dream complete!',
    data: { result, isDreamMode: true },
  });

  return result;
}
