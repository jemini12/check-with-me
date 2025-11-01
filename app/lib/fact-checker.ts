import OpenAI from 'openai';
import { FactCheck } from './types';
import { searchWeb } from './web-search';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT_WITH_CONTEXT = (webContext: string) => `You are a rigorous fact-checker with access to comprehensive knowledge AND real-time web search results. Your task is to thoroughly analyze text and identify ANY false, misleading, outdated, or inaccurate claims in ANY language (English, Korean, Japanese, Chinese, etc.).

${webContext ? `\n===== REAL-TIME WEB SEARCH RESULTS =====\n${webContext}\n===== END OF WEB SEARCH RESULTS =====\n` : ''}

Be thorough and critical:
- Check factual claims against the provided web search results AND your knowledge
- Verify dates, numbers, statistics, and historical facts
- Identify misleading or exaggerated statements
- Flag outdated information that is no longer accurate
- Question claims that lack evidence or are unprovable
- Prioritize recent web search results over older knowledge
- Works with all languages including Korean (한국어), Japanese (日本語), Chinese (中文), etc.

For EACH inaccurate claim you find:
1. Extract the EXACT text of the claim from the original (match it precisely, character-by-character)
2. Instead of providing positions, just provide the exact claim text - we'll find it automatically
3. Set "is_accurate" to false
4. Provide a confidence score between 0.7-1.0 (only flag if confident)
5. Explain clearly WHY it's false or misleading, referencing web sources when available
6. Provide the accurate correction based on the latest information

Return ONLY a valid JSON array. Example format:
[
  {
    "claim": "exact text from original",
    "is_accurate": false,
    "confidence": 0.95,
    "reason": "explanation of why this is false based on current information",
    "correction": "accurate version based on latest data"
  }
]

CRITICAL RULES:
- If text contains NO inaccuracies, return: []
- Return ONLY valid JSON, no markdown, no explanations, no extra text
- Extract claims EXACTLY as they appear (copy-paste precision)
- Be thorough - don't miss obvious falsehoods
- Support all languages equally well
- Use the web search results to verify current facts`;

export async function checkFacts(text: string): Promise<FactCheck[]> {
  try {
    // Step 1: Perform web search to get current information
    console.log('Performing web search for fact verification...');
    const searchResults = await searchWeb(text.substring(0, 500)); // Search with first 500 chars as query

    // Format web search results for the prompt
    let webContext = '';
    if (searchResults.length > 0) {
      webContext = searchResults
        .map((source, i) => `[${i + 1}] ${source.title}\nURL: ${source.url}\n${source.snippet || ''}\n`)
        .join('\n');
      console.log(`Found ${searchResults.length} web sources`);
    } else {
      console.log('No web sources found, proceeding with LLM knowledge only');
    }

    // Step 2: Use LLM to fact-check with web context
    const modelName = process.env.OPENAI_MODEL || 'gpt-4o';

    // Handle different token parameter names for different model families
    // o1 models and gpt-5 models use max_completion_tokens instead of max_tokens
    const usesCompletionTokens = modelName.startsWith('o1') || modelName.startsWith('gpt-5');
    const tokenParams = usesCompletionTokens
      ? { max_completion_tokens: 3000 }
      : { max_tokens: 3000 };

    // o1 and gpt-5 models don't support custom temperature, they only use default (1)
    const temperatureParam = usesCompletionTokens ? {} : { temperature: 0.2 };

    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_WITH_CONTEXT(webContext) },
        { role: 'user', content: `Carefully analyze this text and identify ALL factually incorrect claims:\n\n${text}` },
      ],
      ...temperatureParam,
      ...tokenParams,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let rawFactChecks: Omit<FactCheck, 'start' | 'end' | 'sources'>[] = JSON.parse(content.trim());

    // Validate the response structure
    if (!Array.isArray(rawFactChecks)) {
      throw new Error('Invalid response format');
    }

    // Find the start and end positions for each claim in the original text
    const factChecks: FactCheck[] = rawFactChecks.map((check) => {
      const claimIndex = text.indexOf(check.claim);

      if (claimIndex === -1) {
        // If exact match not found, try to find a close match
        console.warn(`Could not find exact match for claim: "${check.claim}"`);
        return {
          ...check,
          start: 0,
          end: check.claim.length,
          sources: searchResults.length > 0 ? searchResults : undefined,
        };
      }

      return {
        ...check,
        start: claimIndex,
        end: claimIndex + check.claim.length,
        sources: searchResults.length > 0 ? searchResults : undefined,
      };
    });

    return factChecks;
  } catch (error) {
    console.error('Error checking facts:', error);
    throw new Error('Failed to check facts. Please try again.');
  }
}
