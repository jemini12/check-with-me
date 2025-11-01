import OpenAI from 'openai';
import { FactCheck } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a rigorous fact-checker with access to comprehensive knowledge. Your task is to thoroughly analyze text and identify ANY false, misleading, outdated, or inaccurate claims in ANY language (English, Korean, Japanese, Chinese, etc.).

Be thorough and critical:
- Check factual claims against known information
- Verify dates, numbers, statistics, and historical facts
- Identify misleading or exaggerated statements
- Flag outdated information that is no longer accurate
- Question claims that lack evidence or are unprovable
- Works with all languages including Korean (한국어), Japanese (日本語), Chinese (中文), etc.

For EACH inaccurate claim you find:
1. Extract the EXACT text of the claim from the original (match it precisely, character-by-character)
2. Instead of providing positions, just provide the exact claim text - we'll find it automatically
3. Set "is_accurate" to false
4. Provide a confidence score between 0.7-1.0 (only flag if confident)
5. Explain clearly WHY it's false or misleading
6. Provide the accurate correction with sources/reasoning if possible

Return ONLY a valid JSON array. Example format:
[
  {
    "claim": "exact text from original",
    "is_accurate": false,
    "confidence": 0.95,
    "reason": "explanation of why this is false",
    "correction": "accurate version"
  }
]

CRITICAL RULES:
- If text contains NO inaccuracies, return: []
- Return ONLY valid JSON, no markdown, no explanations, no extra text
- Extract claims EXACTLY as they appear (copy-paste precision)
- Be thorough - don't miss obvious falsehoods
- Support all languages equally well`;

export async function checkFacts(text: string): Promise<FactCheck[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Carefully analyze this text and identify ALL factually incorrect claims:\n\n${text}` },
      ],
      temperature: 0.2,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let rawFactChecks: Omit<FactCheck, 'start' | 'end'>[] = JSON.parse(content.trim());

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
        };
      }

      return {
        ...check,
        start: claimIndex,
        end: claimIndex + check.claim.length,
      };
    });

    return factChecks;
  } catch (error) {
    console.error('Error checking facts:', error);
    throw new Error('Failed to check facts. Please try again.');
  }
}
