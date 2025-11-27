import OpenAI from 'openai';
import { FactCheck, Source, ClaimVerificationResult, FactCheckResponse, ProgressEvent } from './types';
import { searchWeb } from './web-search';
import { OPENAI_CONFIG, ERROR_MESSAGES, CONFIDENCE_THRESHOLDS } from './config';
import { getOpenAIApiKey, getOpenAIModel } from './env';
import { logger } from './logger';
import {
  createInitialScreeningPrompt,
  createVerificationPrompt,
  createScreeningInput,
  createVerificationInput,
} from './prompts';
import {
  validateClaimsToVerify,
  safeJsonParse,
  ClaimToVerify,
} from './validation';
import { ProcessingError, toAppError, isAppError } from './errors';
import { detectLanguage, getLanguageInstruction } from './language-detect';
import { generateSearchQueries } from './translation';
import { answerAndVerifyQuestion } from './question-answerer';

const getElapsedMs = (startTime: number) => Date.now() - startTime;


/**
 * Creates an OpenAI client instance with validated configuration
 */
function createOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: getOpenAIApiKey(),
  });
}

/**
 * Creates OpenAI API parameters for responses
 * Pure function returning consistent configuration
 */
const createOpenAIParams = (modelName: string, effort: 'low' | 'medium' | 'high') => ({
  model: modelName,
  reasoning: { effort },
  max_output_tokens: OPENAI_CONFIG.MAX_OUTPUT_TOKENS,
});

/**
 * Formats search results into a readable context string
 * Pure function with no side effects
 */
const formatSearchResults = (results: Source[]): string =>
  results
    .map((source, idx) => `[${idx + 1}] ${source.title}\nURL: ${source.url}\n${source.snippet || ''}\n`)
    .join('\n');

/**
 * Calculates the position of a claim in the original text
 * Pure function that handles missing claims gracefully
 */
const calculateClaimPosition = (text: string, claim: string): { start: number; end: number } => {
  const claimIndex = text.indexOf(claim);
  return claimIndex >= 0
    ? { start: claimIndex, end: claimIndex + claim.length }
    : { start: 0, end: claim.length };
};

/**
 * Performs initial screening to identify claims that need verification
 */
async function performInitialScreening(
  openai: OpenAI,
  text: string,
  modelName: string,
  languageInstruction: string,
  onProgress?: (event: ProgressEvent) => void
): Promise<ClaimToVerify[]> {
  const timer = logger.startTimer('Initial screening');
  logger.info('Step 1: Identifying claims that need verification', { textLength: text.length });

  const params = createOpenAIParams(modelName, OPENAI_CONFIG.SCREENING_EFFORT);
  const screeningInput = createScreeningInput(text);

  logger.debug('Screening input prepared', {
    inputLength: screeningInput.length,
    model: modelName,
    effort: OPENAI_CONFIG.SCREENING_EFFORT,
  });

  const apiStart = Date.now();
  const screeningResponse = await openai.responses.create({
    ...params,
    instructions: createInitialScreeningPrompt(languageInstruction),
    input: screeningInput,
  });
  const apiDuration = Date.now() - apiStart;

  logger.apiCall('OpenAI', 'screening', apiDuration, {
    model: modelName,
    effort: OPENAI_CONFIG.SCREENING_EFFORT,
    usage: screeningResponse.usage,
  });

  const screeningContent = screeningResponse.output_text;

  // Send partial AI response (first 50 chars)
  if (screeningContent && onProgress) {
    const partial = screeningContent.trim().slice(0, 50);
    onProgress({
      type: 'screening',
      data: {
        partialAIResponse: partial.length < screeningContent.length ? `${partial}...` : partial,
      },
    });
  }

  if (!screeningContent) {
    logger.error('No screening response received from OpenAI', undefined, {
      model: modelName,
      responseId: screeningResponse.id,
      status: screeningResponse.status,
    });
    throw new ProcessingError(ERROR_MESSAGES.NO_SCREENING_RESPONSE);
  }

  logger.debug('Screening response received', {
    outputLength: screeningContent.length,
    responseId: screeningResponse.id,
  });

  const parsedClaims = safeJsonParse<unknown[]>(screeningContent.trim());

  if (!parsedClaims) {
    logger.error('Failed to parse screening response as JSON', undefined, {
      contentPreview: screeningContent.substring(0, 200),
      contentLength: screeningContent.length,
    });
    throw new ProcessingError('Failed to parse screening response as JSON', {
      content: screeningContent.substring(0, 200),
    });
  }

  const validatedClaims = validateClaimsToVerify(parsedClaims);

  if (validatedClaims.length === 0) {
    timer.end({ claimsFound: 0 });
    logger.info('No claims identified for verification');
    return [];
  }

  timer.end({
    claimsFound: validatedClaims.length,
    claimLengths: validatedClaims.map(c => c.claim.length),
  });

  logger.info('Claims identified for verification', {
    count: validatedClaims.length,
  });

  return validatedClaims;
}

/**
 * Searches the web for all claims in parallel
 * Uses LLM to generate optimized English search queries for better results
 * Returns array of search results corresponding to each claim
 */
async function searchForClaims(
  openai: OpenAI,
  claims: ClaimToVerify[],
  modelName: string,
  onProgress?: (event: ProgressEvent) => void
): Promise<Source[][]> {
  const timer = logger.startTimer('Web search for all claims');
  logger.info('Step 2: Searching web for verification', { claimCount: claims.length });

  const searchPromises = claims.map(async ({ claim }, index) => {
    const claimTimer = logger.startTimer(`Search claim ${index + 1}`);

    try {
      logger.debug('Generating optimized search queries', {
        claimIndex: index + 1,
        claimLength: claim.length,
      });

      // Generate optimized English queries using LLM
      const searchQueries = await generateSearchQueries(openai, claim, modelName);

      logger.debug('Search queries generated', {
        claimIndex: index + 1,
        queryCount: searchQueries.length,
        queries: searchQueries,
      });

      // Search with each query in parallel
      const searchStart = Date.now();
      const searchResults = await Promise.all(
        searchQueries.map(query => searchWeb(query).catch(() => []))
      );
      const searchDuration = Date.now() - searchStart;

      // Merge results, deduplicate by URL
      const urlSet = new Set<string>();
      const mergedResults: Source[] = [];

      for (const results of searchResults) {
        for (const result of results) {
          if (!urlSet.has(result.url)) {
            urlSet.add(result.url);
            mergedResults.push(result);
          }
        }
      }

      // Send search results preview (truncate titles to 50 chars)
      if (mergedResults.length > 0 && onProgress) {
        onProgress({
          type: 'searching',
          data: {
            searchResults: mergedResults.slice(0, 3).map(r =>
              r.title.length > 50 ? `${r.title.slice(0, 47)}...` : r.title
            ),
          },
        });
      }

      claimTimer.end({
        claimIndex: index + 1,
        queriesUsed: searchQueries.length,
        totalResults: mergedResults.length,
        searchDurationMs: searchDuration,
      });

      logger.info('Search completed for claim', {
        claimIndex: index + 1,
        queriesUsed: searchQueries.length,
        resultsFound: mergedResults.length,
      });

      return mergedResults;
    } catch (error) {
      logger.warn('Search failed for claim, continuing with empty results', {
        claimIndex: index + 1,
        error,
      });
      claimTimer.end({ claimIndex: index + 1, failed: true });
      return [];
    }
  });

  const allSearchResults = await Promise.all(searchPromises);

  const totalResults = allSearchResults.reduce((sum, results) => sum + results.length, 0);
  timer.end({
    totalClaims: claims.length,
    totalResults,
    avgResultsPerClaim: (totalResults / claims.length).toFixed(1),
  });

  logger.info('Web search completed for all claims', {
    totalResults,
    claimsSearched: claims.length,
  });

  return allSearchResults;
}

/**
 * Verifies a single claim using OpenAI and search results
 * Returns ClaimVerificationResult with error handling
 */
async function verifyClaim(
  openai: OpenAI,
  claim: ClaimToVerify,
  searchResults: Source[],
  modelName: string,
  originalText: string,
  claimIndex: number,
  totalClaims: number,
  languageInstruction: string
): Promise<ClaimVerificationResult> {
  const timer = logger.startTimer(`Verify claim ${claimIndex + 1}/${totalClaims}`);

  logger.info('Processing claim verification', {
    claimIndex: claimIndex + 1,
    totalClaims,
    searchResultCount: searchResults.length,
  });

  try {
    if (searchResults.length === 0) {
      logger.warn('No search results available for claim', {
        claimIndex: claimIndex + 1,
      });
      timer.end({ failed: true, reason: 'no_search_results' });
      return {
        claim: claim.claim,
        status: 'failed',
        error: {
          message: 'No search results found',
          code: 'SEARCH_ERROR',
          retryable: true,
        },
      };
    }

    const webContext = formatSearchResults(searchResults);
    const params = createOpenAIParams(modelName, OPENAI_CONFIG.VERIFICATION_EFFORT);
    const verificationInput = createVerificationInput(claim.claim);

    logger.debug('Calling OpenAI verification API', {
      claimIndex: claimIndex + 1,
      model: params.model,
      reasoningEffort: OPENAI_CONFIG.VERIFICATION_EFFORT,
      maxOutputTokens: params.max_output_tokens,
      searchResultCount: searchResults.length,
      webContextLength: webContext.length,
    });

    const apiStart = Date.now();
    const verificationResponse = await openai.responses.create({
      ...params,
      instructions: createVerificationPrompt(webContext, languageInstruction),
      input: verificationInput,
    });
    const apiDuration = Date.now() - apiStart;

    logger.apiCall('OpenAI', 'verification', apiDuration, {
      claimIndex: claimIndex + 1,
      model: modelName,
      effort: OPENAI_CONFIG.VERIFICATION_EFFORT,
      usage: verificationResponse.usage,
      responseId: verificationResponse.id,
    });

    const verificationContent = verificationResponse.output_text;

    if (!verificationContent) {
      logger.error('No verification response received from OpenAI', undefined, {
        claimIndex: claimIndex + 1,
        responseId: verificationResponse.id,
        status: verificationResponse.status,
        model: verificationResponse.model,
        usage: verificationResponse.usage,
      });
      timer.end({ failed: true, reason: 'empty_response' });
      return {
        claim: claim.claim,
        status: 'failed',
        error: {
          message: 'Empty response from verification API',
          code: 'API_ERROR',
          retryable: true,
        },
      };
    }

    logger.debug('Verification response received', {
      claimIndex: claimIndex + 1,
      outputLength: verificationContent.length,
      responseId: verificationResponse.id,
    });

    const parsedVerification = safeJsonParse<Array<Omit<FactCheck, 'start' | 'end' | 'sources'>>>(
      verificationContent.trim()
    );

    if (!parsedVerification || !Array.isArray(parsedVerification)) {
      logger.error('Failed to parse verification response as JSON', undefined, {
        claimIndex: claimIndex + 1,
        contentLength: verificationContent.length,
        contentPreview: verificationContent.substring(0, 200),
      });
      timer.end({ failed: true, reason: 'parse_error' });
      return {
        claim: claim.claim,
        status: 'failed',
        error: {
          message: 'Failed to parse verification response',
          code: 'PROCESSING_ERROR',
          retryable: true,
        },
      };
    }

    logger.debug('Successfully parsed verification JSON', {
      claimIndex: claimIndex + 1,
      issuesFound: parsedVerification.length,
    });

    // Map verification results to FactCheck objects with position information
    const factChecks = parsedVerification.map((check) => {
      const position = calculateClaimPosition(originalText, check.claim);
      return {
        ...check,
        ...position,
        sources: searchResults,
      };
    });

    timer.end({
      claimIndex: claimIndex + 1,
      issuesFound: factChecks.length,
      success: true,
    });

    logger.info('Verification complete for claim', {
      claimIndex: claimIndex + 1,
      issuesFound: factChecks.length,
    });

    return {
      claim: claim.claim,
      status: 'success',
      factChecks,
    };
  } catch (error) {
    // Determine error type and retryability
    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = 'Failed to verify claim';
    let retryable = true;

    if (isAppError(error)) {
      errorCode = error.code;
      errorMessage = error.message;
      retryable = error.code !== 'VALIDATION_ERROR';
    } else if (error instanceof Error) {
      errorMessage = error.message;

      // Check for specific error patterns
      if (error.message.includes('timeout')) {
        errorCode = 'TIMEOUT_ERROR';
      } else if (error.message.includes('rate limit')) {
        errorCode = 'API_ERROR';
        retryable = false;
      }
    }

    logger.error('Error verifying claim', error, {
      claimIndex: claimIndex + 1,
      errorCode,
      retryable,
    });

    timer.end({ failed: true, errorCode });

    return {
      claim: claim.claim,
      status: 'failed',
      error: {
        message: errorMessage,
        code: errorCode,
        retryable,
      },
    };
  }
}

/**
 * Main verification function that orchestrates the entire process
 * Routes questions to question answering, and claims to claim verification
 * @param text - The text to verify (question or claims)
 * @param onProgress - Optional callback for progress events
 * @returns FactCheckResponse with results and error information
 * @throws {AppError} If the verification process fails
 */
export async function verifyInput(
  text: string,
  onProgress?: (event: ProgressEvent) => void
): Promise<FactCheckResponse> {
  const processTimer = logger.startTimer('Complete fact-check process');

  try {
    const openai = createOpenAIClient();
    const modelName = getOpenAIModel(OPENAI_CONFIG.DEFAULT_MODEL);

    // Detect language of input text
    const detectedLanguage = detectLanguage(text);
    const languageInstruction = getLanguageInstruction(detectedLanguage.name);

    logger.info('Starting fact-check process', {
      textLength: text.length,
      model: modelName,
      detectedLanguage: detectedLanguage.name,
    });

    onProgress?.({ type: 'started', message: 'Initializing fact-check...' });

    // Step 1: Try to identify claims that need verification
    // If LLM finds no claims, it's likely a question
    onProgress?.({ type: 'screening', message: 'Extracting verifiable claims...' });
    const claimsToVerify = await performInitialScreening(openai, text, modelName, languageInstruction, onProgress);

    // If no claims found, treat as a question and route to question answerer
    if (claimsToVerify.length === 0) {
      logger.info('No claims found - treating as question, routing to question answerer');
      return await answerAndVerifyQuestion(openai, text, modelName, languageInstruction, onProgress);
    }

    // Claims found - proceed with verification
    logger.info('Claims identified, proceeding with verification', {
      claimCount: claimsToVerify.length
    });

    onProgress?.({
      type: 'claims_identified',
      message: `Found ${claimsToVerify.length} claim(s) to verify`,
      data: {
        claims: claimsToVerify.map(c => c.claim),
        total: claimsToVerify.length,
      },
    });

    // Step 2: Search web for each claim
    onProgress?.({ type: 'searching', message: 'Searching web for evidence...' });
    const allSearchResults = await searchForClaims(openai, claimsToVerify, modelName, onProgress);

    // Step 3: Verify each claim with its search results
    logger.info('Step 3: Verifying claims with evidence', {
      totalClaims: claimsToVerify.length,
    });

    const claimResults: ClaimVerificationResult[] = [];
    for (let i = 0; i < claimsToVerify.length; i++) {
      const claim = claimsToVerify[i];
      const searchResults = allSearchResults[i];

      onProgress?.({
        type: 'verifying',
        message: `Verifying claim ${i + 1} of ${claimsToVerify.length}`,
        data: {
          currentClaim: claim.claim,
          current: i + 1,
          total: claimsToVerify.length,
        },
      });

      const result = await verifyClaim(
        openai,
        claim,
        searchResults,
        modelName,
        text,
        i,
        claimsToVerify.length,
        languageInstruction
      );

      claimResults.push(result);

      onProgress?.({
        type: 'claim_complete',
        message: result.status === 'success' ? 'Claim verified' : 'Verification failed',
        data: {
          current: i + 1,
          total: claimsToVerify.length,
        },
      });
    }

    // Extract fact checks from successful verifications
    const allFactChecks: FactCheck[] = [];
    for (const result of claimResults) {
      if (result.status === 'success' && result.factChecks) {
        allFactChecks.push(...result.factChecks);
      }
    }

    // Filter to show results with sufficient confidence (>= 0.8)
    const filteredFactChecks = allFactChecks.filter(
      check => check.confidence >= CONFIDENCE_THRESHOLDS.MIN_CONFIDENCE
    );

    const hasFailures = claimResults.some(r => r.status === 'failed');
    const successfulClaims = claimResults.filter(r => r.status === 'success').length;
    const failedClaims = claimResults.filter(r => r.status === 'failed').length;

    logger.info('Filtered fact checks by confidence', {
      totalChecks: allFactChecks.length,
      filteredChecks: filteredFactChecks.length,
      filteredOut: allFactChecks.length - filteredFactChecks.length,
      minConfidence: CONFIDENCE_THRESHOLDS.MIN_CONFIDENCE,
    });

    processTimer.end({
      totalClaims: claimsToVerify.length,
      successfulClaims,
      failedClaims,
      totalChecks: allFactChecks.length,
      returnedChecks: filteredFactChecks.length,
      hasFailures,
    });

    logger.info('Fact-check process completed successfully', {
      totalClaims: claimsToVerify.length,
      successfulClaims,
      failedClaims,
      returnedChecks: filteredFactChecks.length,
      hasFailures,
    });

    const finalResult: FactCheckResponse = {
      original_text: text,
      fact_checks: filteredFactChecks,
      claim_results: claimResults,
      has_failures: hasFailures,
    };

    onProgress?.({
      type: 'complete',
      message: 'Fact-check complete!',
      data: { result: finalResult },
    });

    return finalResult;
  } catch (error) {
    logger.error('Fact-check process failed', error, {
      textLength: text.length,
    });

    processTimer.end({ failed: true });

    onProgress?.({
      type: 'error',
      message: 'Fact-check failed',
      data: {
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: isAppError(error) ? error.code : 'UNKNOWN_ERROR',
        },
      },
    });

    // Convert to AppError and re-throw
    throw toAppError(error, ERROR_MESSAGES.FACT_CHECK_FAILED);
  }
}
