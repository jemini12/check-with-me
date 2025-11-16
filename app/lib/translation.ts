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
  try {
    logger.debug('Generating search queries', { claim: claim.substring(0, 50) });

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

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      logger.warn('Empty response from query generation, using original claim');
      return [claim];
    }

    // Parse JSON response
    const queries = JSON.parse(content) as string[];

    logger.debug('Search queries generated', {
      claim: claim.substring(0, 50),
      queriesGenerated: queries.length,
      queries,
    });

    return queries.length > 0 ? queries : [claim];
  } catch (error) {
    logger.warn('Query generation failed, using original claim', { error, claim });
    return [claim];
  }
}
