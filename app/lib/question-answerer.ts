import OpenAI from 'openai';
import { FactCheck, Source, FactCheckResponse, ProgressEvent } from './types';
import { searchWeb } from './web-search';
import { OPENAI_CONFIG, ERROR_MESSAGES } from './config';
import { logger } from './logger';
import { createAnswerGenerationPrompt, createAnswerVerificationPrompt } from './prompts';
import { safeJsonParse } from './validation';
import { ProcessingError } from './errors';

const getElapsedMs = (startTime: number) => Date.now() - startTime;

/**
 * Creates OpenAI API parameters for responses
 */
const createOpenAIParams = (modelName: string, effort: 'low' | 'medium' | 'high') => ({
  model: modelName,
  reasoning: { effort },
  max_output_tokens: OPENAI_CONFIG.MAX_OUTPUT_TOKENS,
});

/**
 * Formats search results into a readable context string
 */
const formatSearchResults = (results: Source[]): string =>
  results
    .map((source, idx) => `[${idx + 1}] ${source.title}\nURL: ${source.url}\n${source.snippet || ''}\n`)
    .join('\n');

/**
 * Answers a question by generating an answer and verifying it with sources
 * @param openai - OpenAI client instance
 * @param question - The question to answer
 * @param modelName - The model to use
 * @param languageInstruction - Language instruction for responses
 * @param onProgress - Progress callback
 * @returns FactCheckResponse with the answer marked as a question
 */
export async function answerAndVerifyQuestion(
  openai: OpenAI,
  question: string,
  modelName: string,
  languageInstruction: string,
  onProgress?: (event: ProgressEvent) => void
): Promise<FactCheckResponse> {
  const processStart = Date.now();

  logger.info('Handling question', { question });

  // Step 1: Generate answer
  onProgress?.({ type: 'screening', message: 'Generating answer to question...' });

  const answerStart = Date.now();
  const params = createOpenAIParams(modelName, OPENAI_CONFIG.SCREENING_EFFORT);

  const answerResponse = await openai.responses.create({
    ...params,
    instructions: createAnswerGenerationPrompt(languageInstruction),
    input: `Question: ${question}`,
  });

  const answerContent = answerResponse.output_text;

  if (!answerContent) {
    throw new ProcessingError(ERROR_MESSAGES.NO_SCREENING_RESPONSE);
  }

  logger.debug('Answer generated', {
    elapsedMs: getElapsedMs(answerStart),
    answerLength: answerContent.length,
  });

  const parsedAnswer = safeJsonParse<{ answer: string }>(answerContent.trim());

  if (!parsedAnswer || !parsedAnswer.answer) {
    throw new ProcessingError('Failed to parse answer response', {
      content: answerContent.substring(0, 200),
    });
  }

  const answer = parsedAnswer.answer;

  logger.info('Answer generated', { answer, elapsedMs: getElapsedMs(answerStart) });

  onProgress?.({
    type: 'claims_identified',
    message: 'Answer generated',
    data: { claims: [answer] },
  });

  // Step 2: Search web for verification
  onProgress?.({ type: 'searching', message: 'Searching for evidence...' });

  const searchStart = Date.now();
  let searchResults: Source[] = [];

  try {
    // Search using both the question and answer for better results
    const [questionResults, answerResults] = await Promise.all([
      searchWeb(question).catch(() => []),
      searchWeb(answer).catch(() => []),
    ]);

    // Merge and deduplicate results
    const urlSet = new Set<string>();
    for (const result of [...questionResults, ...answerResults]) {
      if (!urlSet.has(result.url)) {
        urlSet.add(result.url);
        searchResults.push(result);
      }
    }

    logger.debug('Web search completed', {
      resultCount: searchResults.length,
      elapsedMs: getElapsedMs(searchStart),
    });
  } catch (error) {
    logger.warn('Search failed, continuing with empty results', { error });
  }

  // Step 3: Verify the answer
  onProgress?.({ type: 'verifying', message: 'Verifying answer...', data: { isQuestion: true } });

  const verifyStart = Date.now();

  if (searchResults.length === 0) {
    logger.warn('No search results available for verification');

    // Return answer as unverified (low confidence)
    const factCheck: FactCheck = {
      claim: answer,
      start: 0,
      end: answer.length,
      is_accurate: true,
      confidence: 0.5,
      reason: 'Generated answer but could not find sufficient sources to verify.',
      correction: null,
      sources: [],
      is_question: true,
    };

    onProgress?.({
      type: 'complete',
      message: 'Answer generated with limited verification',
      data: {
        result: {
          original_text: question,
          fact_checks: [factCheck],
          has_failures: false,
        },
      },
    });

    return {
      original_text: question,
      fact_checks: [factCheck],
      has_failures: false,
    };
  }

  const webContext = formatSearchResults(searchResults);
  const verificationParams = createOpenAIParams(modelName, OPENAI_CONFIG.VERIFICATION_EFFORT);

  const verificationResponse = await openai.responses.create({
    ...verificationParams,
    instructions: createAnswerVerificationPrompt(webContext, languageInstruction),
    input: `Question: ${question}\nProposed Answer: ${answer}`,
  });

  const verificationContent = verificationResponse.output_text;

  if (!verificationContent) {
    throw new ProcessingError('No verification response received');
  }

  logger.debug('Verification response received', {
    outputLength: verificationContent.length,
    elapsedMs: getElapsedMs(verifyStart),
  });

  const parsedVerification = safeJsonParse<{
    is_accurate: boolean;
    confidence: number;
    reason: string;
    correction: string | null;
  }>(verificationContent.trim());

  if (!parsedVerification) {
    throw new ProcessingError('Failed to parse verification response', {
      content: verificationContent.substring(0, 200),
    });
  }

  const factCheck: FactCheck = {
    claim: answer,
    start: 0,
    end: answer.length,
    is_accurate: parsedVerification.is_accurate,
    confidence: parsedVerification.confidence,
    reason: parsedVerification.reason,
    correction: parsedVerification.correction,
    sources: searchResults,
    is_question: true,
  };

  logger.info('Question handling complete', {
    answer,
    isAccurate: factCheck.is_accurate,
    confidence: factCheck.confidence,
    elapsedMs: getElapsedMs(processStart),
  });

  const result: FactCheckResponse = {
    original_text: question,
    fact_checks: [factCheck],
    has_failures: false,
  };

  onProgress?.({
    type: 'complete',
    message: 'Answer verified!',
    data: { result },
  });

  return result;
}
