/**
 * OpenAI prompt templates for fact-checking
 * Centralized location for all prompt engineering
 */

/**
 * Prompt for initial screening phase - identifies claims that need verification
 */
export const INITIAL_SCREENING_PROMPT = `Extract ALL factual claims from the text that can be verified. Be VERY liberal - when in doubt, include it.

INCLUDE these types of claims:
- Historical facts (periods, dynasties, dates, events, sequences like "X came after Y")
- Numbers, statistics, measurements
- Scientific facts
- Geographic facts
- Biographical information
- Any statement about "next", "previous", "after", "before" (temporal relationships)

EXCLUDE:
- Opinions
- Predictions about the future
- Subjective statements

Return ONLY valid JSON (no markdown, no code blocks):
[
  {
    "claim": "exact text from original",
    "reason_to_verify": "why this needs checking"
  }
]

If there are no factual claims, return: []

EXAMPLES:
Input: "고려시대 다음시대는 고조선이다"
Output: [{"claim": "고려시대 다음시대는 고조선이다", "reason_to_verify": "Historical sequence claim"}]

Input: "The earth is flat"
Output: [{"claim": "The earth is flat", "reason_to_verify": "Scientific fact"}]

Input: "I think the weather is nice"
Output: []

Extract claims EXACTLY as they appear. Support all languages.`;

/**
 * Creates a verification prompt with web search context
 * @param webContext - Formatted search results from web search
 * @returns The complete verification prompt
 */
export function createVerificationPrompt(webContext: string): string {
  return `You are verifying specific claims using real-time web search results.

===== WEB SEARCH RESULTS =====
${webContext}
===== END OF SEARCH RESULTS =====

VERIFICATION PROCESS:
1. First, extract the key facts from the search results (timelines, dates, sequences, etc.)
2. Understand what the original claim is stating
3. Compare the claim against the extracted facts
4. Only if there's a clear contradiction, mark as inaccurate and provide correction

For each claim you were given, verify it against the web search results above.

Return ONLY a valid JSON array:
[
  {
    "claim": "exact text from original",
    "is_accurate": false,
    "confidence": 0.95,
    "reason": "Step-by-step explanation: [1] From search results: [key facts]. [2] The claim states: [interpretation]. [3] Contradiction: [specific discrepancy]",
    "correction": "accurate version based on search results"
  }
]

CRITICAL RULES:
- CAREFULLY read and understand the search results before making any judgment
- Pay special attention to chronological order and timelines (e.g., historical periods, dates, sequences)
- Only flag claims as inaccurate if you have STRONG and CLEAR evidence from the search results
- If search results don't provide clear evidence, don't flag the claim
- When correcting historical sequences or timelines, verify the COMPLETE timeline from search results
- For corrections involving "next" or "previous" periods, ensure you understand the chronological order
- Double-check that your correction actually contradicts the original claim (not a related but different statement)
- Ensure the correction directly addresses what the claim got wrong
- Confidence score should reflect how definitive the search results are
- If you're not 100% certain about the correction, lower the confidence score or don't flag it
- Return ONLY valid JSON, no markdown, no extra text`;
}

/**
 * Creates the input text for initial screening
 * @param text - The text to screen for claims
 * @returns Formatted input for the screening prompt
 */
export function createScreeningInput(text: string): string {
  return `Identify claims in this text that need fact-checking:\n\n${text}`;
}

/**
 * Creates the input text for verification
 * @param claim - The claim to verify
 * @returns Formatted input for the verification prompt
 */
export function createVerificationInput(claim: string): string {
  return `Verify this claim: "${claim}"`;
}
