import OpenAI from 'openai';
import { FactCheck, Source, ClaimVerificationResult, FactCheckResponse } from './types';
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
  languageInstruction: string
): Promise<ClaimToVerify[]> {
  const stepStart = Date.now();
  logger.info('Step 1: Identifying claims that need verification');

  const params = createOpenAIParams(modelName, OPENAI_CONFIG.SCREENING_EFFORT);
  const screeningInput = createScreeningInput(text);

  logger.debug('Screening input', { input: screeningInput });

  const screeningResponse = await openai.responses.create({
    ...params,
    instructions: createInitialScreeningPrompt(languageInstruction),
    input: screeningInput,
  });

  const screeningContent = screeningResponse.output_text;

  if (!screeningContent) {
    throw new ProcessingError(ERROR_MESSAGES.NO_SCREENING_RESPONSE);
  }

  logger.debug('Screening response received', {
    outputLength: screeningContent.length
  });

  const parsedClaims = safeJsonParse<unknown[]>(screeningContent.trim());

  if (!parsedClaims) {
    throw new ProcessingError('Failed to parse screening response as JSON', {
      content: screeningContent.substring(0, 200),
    });
  }

  const validatedClaims = validateClaimsToVerify(parsedClaims);

  if (validatedClaims.length === 0) {
    logger.info('No claims identified for verification', {
      elapsedMs: getElapsedMs(stepStart),
    });
    return [];
  }

  logger.info('Claims identified for verification', {
    count: validatedClaims.length,
    claims: validatedClaims.map(c => c.claim),
    elapsedMs: getElapsedMs(stepStart),
  });

  return validatedClaims;
}

/**
 * Searches the web for all claims in parallel
 * Uses LLM to generate optimized search queries
 * Returns array of search results corresponding to each claim
 */
async function searchForClaims(
  openai: OpenAI,
  claims: ClaimToVerify[],
  modelName: string
): Promise<Source[][]> {
  const stepStart = Date.now();
  logger.info('Step 2: Searching web for verification', { claimCount: claims.length });

  const searchPromises = claims.map(async ({ claim }) => {
    try {
      // Generate optimized search queries using LLM
      const searchQueries = await generateSearchQueries(openai, claim, modelName);

      logger.debug('Generated search queries', {
        claim: claim.substring(0, 50),
        queries: searchQueries,
      });

      // Search with each query in parallel
      const searchResults = await Promise.all(
        searchQueries.map(query => searchWeb(query).catch(() => []))
      );

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

      logger.debug('Multi-query search completed', {
        claim: claim.substring(0, 50),
        queriesUsed: searchQueries.length,
        totalResults: mergedResults.length,
      });

      return mergedResults;
    } catch (error) {
      logger.warn('Search failed for claim, continuing with empty results', { claim, error });
      return [];
    }
  });

  const allSearchResults = await Promise.all(searchPromises);

  logger.debug('Web search completed', {
    claims: claims.map((claim, idx) => ({
      claim: claim.claim,
      resultCount: allSearchResults[idx].length,
    })),
    elapsedMs: getElapsedMs(stepStart),
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
  const claimStart = Date.now();
  logger.debug('Processing claim', {
    index: claimIndex + 1,
    total: totalClaims,
    claim: claim.claim,
    searchResultCount: searchResults.length,
  });

  try {
    if (searchResults.length === 0) {
      logger.warn('No search results available for claim', { claim: claim.claim });
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
      claim: claim.claim,
      model: params.model,
      reasoningEffort: OPENAI_CONFIG.VERIFICATION_EFFORT,
      maxOutputTokens: params.max_output_tokens,
      searchResultCount: searchResults.length,
      webContextLength: webContext.length,
    });

    logger.debug('Verification input', {
      claim: claim.claim,
      input: verificationInput,
      webContext: webContext,
    });

    const verificationResponse = await openai.responses.create({
      ...params,
      instructions: createVerificationPrompt(webContext, languageInstruction),
      input: verificationInput,
    });

    logger.debug('OpenAI verification response received', {
      claim: claim.claim,
      responseId: verificationResponse.id,
      model: verificationResponse.model,
      status: verificationResponse.status,
      hasOutputText: !!verificationResponse.output_text,
      outputTextLength: verificationResponse.output_text?.length || 0,
      usage: verificationResponse.usage,
      responseKeys: Object.keys(verificationResponse),
    });

    const verificationContent = verificationResponse.output_text;

    if (!verificationContent) {
      logger.warn('No verification response received', {
        claim: claim.claim,
        responseId: verificationResponse.id,
        status: verificationResponse.status,
        model: verificationResponse.model,
        usage: verificationResponse.usage,
        allResponseKeys: Object.keys(verificationResponse),
        fullResponse: JSON.stringify(verificationResponse, null, 2),
      });
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
      claim: claim.claim,
      outputLength: verificationContent.length,
      contentPreview: verificationContent.substring(0, 500),
    });

    logger.debug('Attempting to parse verification JSON', {
      claim: claim.claim,
      contentLength: verificationContent.length,
    });

    const parsedVerification = safeJsonParse<Array<Omit<FactCheck, 'start' | 'end' | 'sources'>>>(
      verificationContent.trim()
    );

    if (!parsedVerification || !Array.isArray(parsedVerification)) {
      logger.warn('Failed to parse verification response', {
        claim: claim.claim,
        contentLength: verificationContent.length,
        fullContent: verificationContent,
        parseResult: parsedVerification,
      });
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
      claim: claim.claim,
      parsedCount: parsedVerification.length,
      parsedItems: parsedVerification,
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

    logger.info('Verification complete for claim', {
      claim: claim.claim,
      issuesFound: factChecks.length,
      elapsedMs: getElapsedMs(claimStart),
    });

    return {
      claim: claim.claim,
      status: 'success',
      factChecks,
    };
  } catch (error) {
    logger.error('Error verifying claim', {
      claim: claim.claim,
      error,
      elapsedMs: getElapsedMs(claimStart),
    });

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
 * Verifies all claims with their respective search results
 * Returns both successful and failed verification results
 */
async function verifyAllClaims(
  openai: OpenAI,
  claims: ClaimToVerify[],
  searchResults: Source[][],
  modelName: string,
  originalText: string,
  languageInstruction: string
): Promise<ClaimVerificationResult[]> {
  const stepStart = Date.now();
  logger.info('Step 3: Verifying claims with search results', { claimCount: claims.length });

  const verificationPromises = claims.map((claim, index) =>
    verifyClaim(
      openai,
      claim,
      searchResults[index],
      modelName,
      originalText,
      index,
      claims.length,
      languageInstruction
    )
  );

  const allResults = await Promise.all(verificationPromises);

  const successCount = allResults.filter(r => r.status === 'success').length;
  const failureCount = allResults.filter(r => r.status === 'failed').length;

  logger.info('Verification complete', {
    successfulClaims: successCount,
    failedClaims: failureCount,
    totalClaims: allResults.length,
    elapsedMs: getElapsedMs(stepStart),
  });

  return allResults;
}

/**
 * Main fact-checking function that orchestrates the entire process
 * @param text - The text to fact-check
 * @returns FactCheckResponse with results and error information
 * @throws {AppError} If the fact-checking process fails
 */
export async function checkFacts(text: string): Promise<FactCheckResponse> {
  try {
    const processStart = Date.now();
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

    // Step 1: Identify claims that need verification
    const claimsToVerify = await performInitialScreening(openai, text, modelName, languageInstruction);

    if (claimsToVerify.length === 0) {
      return {
        original_text: text,
        fact_checks: [],
        claim_results: [],
        has_failures: false,
      };
    }

    // Step 2: Search web for each claim
    const allSearchResults = await searchForClaims(openai, claimsToVerify, modelName);

    // Step 3: Verify each claim with its search results
    const claimResults = await verifyAllClaims(
      openai,
      claimsToVerify,
      allSearchResults,
      modelName,
      text,
      languageInstruction
    );

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

    logger.info('Filtered fact checks by confidence', {
      totalChecks: allFactChecks.length,
      filteredChecks: filteredFactChecks.length,
      minConfidence: CONFIDENCE_THRESHOLDS.MIN_CONFIDENCE,
      elapsedMs: getElapsedMs(processStart),
    });

    logger.info('Fact-check process completed', {
      elapsedMs: getElapsedMs(processStart),
      totalClaims: claimsToVerify.length,
      successfulClaims: claimResults.filter(r => r.status === 'success').length,
      failedClaims: claimResults.filter(r => r.status === 'failed').length,
      returnedChecks: filteredFactChecks.length,
      hasFailures,
    });

    return {
      original_text: text,
      fact_checks: filteredFactChecks,
      claim_results: claimResults,
      has_failures: hasFailures,
    };
  } catch (error) {
    logger.error('Error checking facts', error);

    // Convert to AppError and re-throw
    throw toAppError(error, ERROR_MESSAGES.FACT_CHECK_FAILED);
  }
}
