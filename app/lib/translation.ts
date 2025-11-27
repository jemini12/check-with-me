import OpenAI from 'openai';
import { logger } from './logger';

/**
 * Generates optimized search queries for a claim using OpenAI
 * Returns array of search queries (2-3 different angles)
 */
export async function generateSearchQueries(
  openai: OpenAI,
  claim: string,
  modelName: string
): Promise<string[]> {
  const timer = logger.startTimer('Generate search queries');

  try {
    logger.debug('Generating optimized search queries', {
      claimLength: claim.length,
      model: modelName,
    });

    const apiStart = Date.now();
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: `You are a search query optimizer. Given a factual claim, generate 2-3 optimized search queries in English that would help verify the claim using web search.

Guidelines:
- Extract key factual elements (numbers, names, places, dates)
- Use specific terms that authoritative sources would use
- Focus on verifiable facts, not opinions
- Include relevant keywords (vs, comparison, area, population, etc.)
- Prefer specific over general terms

Return ONLY a JSON array of strings, no explanations:
["query1", "query2", "query3"]

Examples:
Claim: "이탈리아가 그리스보다 크다"
Output: ["Italy Greece land area comparison km2", "Italy total area square kilometers", "Greece total area square kilometers"]

Claim: "The Eiffel Tower is 324 meters tall"
Output: ["Eiffel Tower height meters", "Eiffel Tower 324 meters official height"]`,
        },
        {
          role: 'user',
          content: `Generate search queries for this claim: "${claim}"`,
        },
      ],
    });
    const apiDuration = Date.now() - apiStart;

    logger.apiCall('OpenAI', 'query-generation', apiDuration, {
      model: modelName,
      usage: response.usage,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      logger.warn('Empty response from query generation, using original claim', {
        model: modelName,
        responseId: response.id,
      });
      timer.end({ failed: true, reason: 'empty_response', fallback: true });
      return [claim];
    }

    // Parse JSON response
    let queries: string[];
    try {
      queries = JSON.parse(content) as string[];
    } catch (parseError) {
      logger.warn('Failed to parse query generation response, using original claim', {
        parseError,
        contentLength: content.length,
        contentPreview: content.substring(0, 100),
      });
      timer.end({ failed: true, reason: 'parse_error', fallback: true });
      return [claim];
    }

    if (!Array.isArray(queries) || queries.length === 0) {
      logger.warn('Invalid queries format, using original claim', {
        queriesType: typeof queries,
        queriesLength: Array.isArray(queries) ? queries.length : 0,
      });
      timer.end({ failed: true, reason: 'invalid_format', fallback: true });
      return [claim];
    }

    timer.end({
      queriesGenerated: queries.length,
      success: true,
    });

    logger.info('Search queries generated successfully', {
      queriesGenerated: queries.length,
      queries,
    });

    return queries;
  } catch (error) {
    timer.end({ failed: true, fallback: true });

    logger.warn('Query generation failed, using original claim as fallback', {
      error,
      claimLength: claim.length,
    });

    return [claim];
  }
}
