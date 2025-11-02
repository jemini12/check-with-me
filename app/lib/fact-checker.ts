import OpenAI from 'openai';
import { FactCheck, Source } from './types';
import { searchWeb } from './web-search';
import { OPENAI_CONFIG, ERROR_MESSAGES } from './config';
import { getOpenAIApiKey, getOpenAIModel } from './env';
import { logger } from './logger';
import {
  INITIAL_SCREENING_PROMPT,
  createVerificationPrompt,
  createScreeningInput,
  createVerificationInput,
} from './prompts';
import {
  validateClaimsToVerify,
  safeJsonParse,
  ClaimToVerify,
} from './validation';
import { ProcessingError, toAppError } from './errors';

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
const createOpenAIParams = (modelName: string, effort: 'medium' | 'high') => ({
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
  modelName: string
): Promise<ClaimToVerify[]> {
  logger.info('Step 1: Identifying claims that need verification');

  const params = createOpenAIParams(modelName, OPENAI_CONFIG.SCREENING_EFFORT);

  const screeningResponse = await openai.responses.create({
    ...params,
    instructions: INITIAL_SCREENING_PROMPT,
    input: createScreeningInput(text),
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
    logger.info('No claims identified for verification');
    return [];
  }

  logger.info('Claims identified for verification', {
    count: validatedClaims.length,
    claims: validatedClaims.map(c => c.claim)
  });

  return validatedClaims;
}

/**
 * Searches the web for all claims in parallel
 * Returns array of search results corresponding to each claim
 */
async function searchForClaims(claims: ClaimToVerify[]): Promise<Source[][]> {
  logger.info('Step 2: Searching web for verification', { claimCount: claims.length });

  const searchPromises = claims.map(({ claim }) =>
    searchWeb(claim).catch((error) => {
      logger.warn('Search failed for claim, continuing with empty results', { claim, error });
      return [];
    })
  );

  const allSearchResults = await Promise.all(searchPromises);

  logger.debug('Web search completed', {
    claims: claims.map((claim, idx) => ({
      claim: claim.claim,
      resultCount: allSearchResults[idx].length,
    })),
  });

  return allSearchResults;
}

/**
 * Verifies a single claim using OpenAI and search results
 */
async function verifyClaim(
  openai: OpenAI,
  claim: ClaimToVerify,
  searchResults: Source[],
  modelName: string,
  originalText: string,
  claimIndex: number,
  totalClaims: number
): Promise<FactCheck[]> {
  logger.debug('Processing claim', {
    index: claimIndex + 1,
    total: totalClaims,
    claim: claim.claim,
    searchResultCount: searchResults.length,
  });

  if (searchResults.length === 0) {
    logger.warn('No search results available for claim, skipping', { claim: claim.claim });
    return [];
  }

  const webContext = formatSearchResults(searchResults);
  const params = createOpenAIParams(modelName, OPENAI_CONFIG.VERIFICATION_EFFORT);

  const verificationResponse = await openai.responses.create({
    ...params,
    instructions: createVerificationPrompt(webContext),
    input: createVerificationInput(claim.claim),
  });

  const verificationContent = verificationResponse.output_text;

  if (!verificationContent) {
    logger.warn('No verification response received, skipping claim', { claim: claim.claim });
    return [];
  }

  logger.debug('Verification response received', {
    claim: claim.claim,
    outputLength: verificationContent.length,
  });

  const parsedVerification = safeJsonParse<Array<Omit<FactCheck, 'start' | 'end' | 'sources'>>>(
    verificationContent.trim()
  );

  if (!parsedVerification || !Array.isArray(parsedVerification)) {
    logger.warn('Failed to parse verification response, skipping claim', {
      claim: claim.claim,
      content: verificationContent.substring(0, 200),
    });
    return [];
  }

  if (parsedVerification.length === 0) {
    logger.debug('No issues found for claim', { claim: claim.claim });
    return [];
  }

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
  });

  return factChecks;
}

/**
 * Verifies all claims with their respective search results
 */
async function verifyAllClaims(
  openai: OpenAI,
  claims: ClaimToVerify[],
  searchResults: Source[][],
  modelName: string,
  originalText: string
): Promise<FactCheck[]> {
  logger.info('Step 3: Verifying claims with search results', { claimCount: claims.length });

  const verificationPromises = claims.map((claim, index) =>
    verifyClaim(
      openai,
      claim,
      searchResults[index],
      modelName,
      originalText,
      index,
      claims.length
    )
  );

  const allFactChecks = await Promise.all(verificationPromises);

  // Flatten array of arrays into single array
  const flattenedFactChecks = allFactChecks.flat();

  logger.info('Verification complete', { inaccurateClaimsFound: flattenedFactChecks.length });

  return flattenedFactChecks;
}

/**
 * Main fact-checking function that orchestrates the entire process
 * @param text - The text to fact-check
 * @returns Array of fact-check results for inaccurate claims
 * @throws {AppError} If the fact-checking process fails
 */
export async function checkFacts(text: string): Promise<FactCheck[]> {
  try {
    const openai = createOpenAIClient();
    const modelName = getOpenAIModel(OPENAI_CONFIG.DEFAULT_MODEL);

    logger.info('Starting fact-check process', {
      textLength: text.length,
      model: modelName,
    });

    // Step 1: Identify claims that need verification
    const claimsToVerify = await performInitialScreening(openai, text, modelName);

    if (claimsToVerify.length === 0) {
      return [];
    }

    // Step 2: Search web for each claim
    const allSearchResults = await searchForClaims(claimsToVerify);

    // Step 3: Verify each claim with its search results
    const factChecks = await verifyAllClaims(
      openai,
      claimsToVerify,
      allSearchResults,
      modelName,
      text
    );

    return factChecks;
  } catch (error) {
    logger.error('Error checking facts', error);

    // Convert to AppError and re-throw
    throw toAppError(error, ERROR_MESSAGES.FACT_CHECK_FAILED);
  }
}
