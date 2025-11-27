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
  const processTimer = logger.startTimer('Question answering and verification');

  logger.info('Handling question mode', { questionLength: question.length });

  // Step 1: Generate answer
  onProgress?.({ type: 'screening', message: 'Generating answer to question...' });

  const answerTimer = logger.startTimer('Generate answer');
  const params = createOpenAIParams(modelName, OPENAI_CONFIG.SCREENING_EFFORT);

  logger.debug('Generating answer via OpenAI', {
    model: modelName,
    effort: OPENAI_CONFIG.SCREENING_EFFORT,
  });

  const apiStart = Date.now();
  const answerResponse = await openai.responses.create({
    ...params,
    instructions: createAnswerGenerationPrompt(languageInstruction),
    input: `Question: ${question}`,
  });
  const apiDuration = Date.now() - apiStart;

  logger.apiCall('OpenAI', 'answer-generation', apiDuration, {
    model: modelName,
    effort: OPENAI_CONFIG.SCREENING_EFFORT,
    usage: answerResponse.usage,
  });

  const answerContent = answerResponse.output_text;

  if (!answerContent) {
    logger.error('No answer response received from OpenAI', undefined, {
      responseId: answerResponse.id,
      status: answerResponse.status,
    });
    throw new ProcessingError(ERROR_MESSAGES.NO_SCREENING_RESPONSE);
  }

  logger.debug('Answer response received', {
    outputLength: answerContent.length,
    responseId: answerResponse.id,
  });

  const parsedAnswer = safeJsonParse<{ answer: string }>(answerContent.trim());

  if (!parsedAnswer || !parsedAnswer.answer) {
    logger.error('Failed to parse answer response', undefined, {
      contentLength: answerContent.length,
      contentPreview: answerContent.substring(0, 200),
    });
    throw new ProcessingError('Failed to parse answer response', {
      content: answerContent.substring(0, 200),
    });
  }

  const answer = parsedAnswer.answer;

  answerTimer.end({ answerLength: answer.length });

  logger.info('Answer generated successfully', { answerLength: answer.length });

  onProgress?.({
    type: 'claims_identified',
    message: 'Answer generated',
    data: { claims: [answer] },
  });

  // Step 2: Search web for verification
  onProgress?.({ type: 'searching', message: 'Searching for evidence...' });

  const searchTimer = logger.startTimer('Search for question evidence');
  let searchResults: Source[] = [];

  try {
    logger.info('Searching web for question verification', {
      searchingBoth: true,
    });

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

    searchTimer.end({
      questionResults: questionResults.length,
      answerResults: answerResults.length,
      totalResults: searchResults.length,
      deduplicatedResults: questionResults.length + answerResults.length - searchResults.length,
    });

    logger.info('Web search completed for question', {
      resultCount: searchResults.length,
    });
  } catch (error) {
    searchTimer.end({ failed: true });
    logger.warn('Search failed for question, continuing with empty results', { error });
  }

  // Step 3: Verify the answer
  onProgress?.({ type: 'verifying', message: 'Verifying answer...', data: { isQuestion: true } });

  const verifyTimer = logger.startTimer('Verify answer');

  if (searchResults.length === 0) {
    logger.warn('No search results available for answer verification');

    verifyTimer.end({ skipped: true, reason: 'no_search_results' });
    processTimer.end({ answer: 'unverified', confidence: 0.5 });

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

    logger.info('Question answered with limited verification', {
      confidence: 0.5,
      reason: 'no_search_results',
    });

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

  logger.debug('Verifying answer with web evidence', {
    model: modelName,
    effort: OPENAI_CONFIG.VERIFICATION_EFFORT,
    searchResultCount: searchResults.length,
  });

  const verifyApiStart = Date.now();
  const verificationResponse = await openai.responses.create({
    ...verificationParams,
    instructions: createAnswerVerificationPrompt(webContext, languageInstruction),
    input: `Question: ${question}\nProposed Answer: ${answer}`,
  });
  const verifyApiDuration = Date.now() - verifyApiStart;

  logger.apiCall('OpenAI', 'answer-verification', verifyApiDuration, {
    model: modelName,
    effort: OPENAI_CONFIG.VERIFICATION_EFFORT,
    usage: verificationResponse.usage,
    responseId: verificationResponse.id,
  });

  const verificationContent = verificationResponse.output_text;

  if (!verificationContent) {
    logger.error('No verification response received from OpenAI', undefined, {
      responseId: verificationResponse.id,
      status: verificationResponse.status,
    });
    throw new ProcessingError('No verification response received');
  }

  logger.debug('Verification response received', {
    outputLength: verificationContent.length,
    responseId: verificationResponse.id,
  });

  const parsedVerification = safeJsonParse<{
    is_accurate: boolean;
    confidence: number;
    reason: string;
    correction: string | null;
  }>(verificationContent.trim());

  if (!parsedVerification) {
    logger.error('Failed to parse verification response', undefined, {
      contentLength: verificationContent.length,
      contentPreview: verificationContent.substring(0, 200),
    });
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

  verifyTimer.end({
    isAccurate: factCheck.is_accurate,
    confidence: factCheck.confidence,
  });

  processTimer.end({
    answerLength: answer.length,
    isAccurate: factCheck.is_accurate,
    confidence: factCheck.confidence,
    searchResults: searchResults.length,
  });

  logger.info('Question handling completed successfully', {
    isAccurate: factCheck.is_accurate,
    confidence: factCheck.confidence,
    searchResults: searchResults.length,
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
