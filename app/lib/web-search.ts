import { tavily } from '@tavily/core';
import { Source } from './types';
import { API_CONFIG, ERROR_MESSAGES } from './config';
import { getTavilyApiKey } from './env';
import { logger } from './logger';
import { ExternalAPIError, getErrorMessage } from './errors';

/**
 * Creates a Tavily client instance with the configured API key
 * Returns null if the API key is not configured
 */
function createTavilyClient() {
  const apiKey = getTavilyApiKey();

  if (!apiKey) {
    logger.warn(ERROR_MESSAGES.TAVILY_NOT_CONFIGURED);
    return null;
  }

  return tavily({ apiKey });
}

/**
 * Maps Tavily search results to Source objects
 * Pure function with no side effects
 */
const mapSearchResultToSource = (result: { url: string; title: string; content: string }): Source => ({
  url: result.url,
  title: result.title,
  snippet: result.content,
});

/**
 * Searches the web for information about a given query using Tavily API
 * @param query - The search query
 * @returns Array of search results as Source objects, or empty array if search fails or is not configured
 */
export async function searchWeb(query: string): Promise<Source[]> {
  const client = createTavilyClient();

  if (!client) {
    return [];
  }

  try {
    logger.debug('Searching web', { query, maxResults: API_CONFIG.MAX_SEARCH_RESULTS });

    const response = await client.search(query, {
      maxResults: API_CONFIG.MAX_SEARCH_RESULTS,
      searchDepth: API_CONFIG.SEARCH_DEPTH,
      includeAnswer: API_CONFIG.INCLUDE_ANSWER,
    });

    const sources = response.results.map(mapSearchResultToSource);

    logger.debug('Web search completed', {
      query,
      resultCount: sources.length
    });

    return sources;
  } catch (error) {
    logger.error('Error searching web', error, { query });

    // Re-throw as ExternalAPIError for better error handling upstream
    throw new ExternalAPIError(
      `Failed to search web: ${getErrorMessage(error)}`,
      'Tavily',
      { query }
    );
  }
}
