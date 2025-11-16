/**
 * OpenAI prompt templates for fact-checking
 * Centralized location for all prompt engineering
 */

/**
 * Prompt for initial screening phase - identifies claims that need verification
 * @param languageInstruction - Optional instruction to respond in specific language
 */
export function createInitialScreeningPrompt(languageInstruction?: string): string {
  return `Extract ALL factual claims from the text that can be verified. Be VERY liberal - when in doubt, include it.

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
Input: "The Joseon Dynasty came after the Goryeo Dynasty"
Output: [{"claim": "The Joseon Dynasty came after the Goryeo Dynasty", "reason_to_verify": "Historical sequence claim"}]

Input: "The earth is flat"
Output: [{"claim": "The earth is flat", "reason_to_verify": "Scientific fact"}]

Input: "I think the weather is nice"
Output: []

Extract claims EXACTLY as they appear. Support all languages.

${languageInstruction || ''}`;
}

/**
 * Creates a verification prompt with web search context
 * @param webContext - Formatted search results from web search
 * @param languageInstruction - Optional instruction to respond in specific language
 * @returns The complete verification prompt
 */
export function createVerificationPrompt(webContext: string, languageInstruction?: string): string {
  return `You are verifying specific claims using real-time web search results. You will identify BOTH accurate and inaccurate claims.

${languageInstruction || ''}

===== WEB SEARCH RESULTS =====
${webContext}
===== END OF SEARCH RESULTS =====

VERIFICATION PROCESS:
1. First, extract the key facts from EACH search result separately
2. Check for consensus: Do multiple independent sources agree on the facts?
3. Understand what the original claim is stating
4. Compare the claim against the consensus facts
5. Flag claims that have CONSENSUS from multiple sources (either confirming OR contradicting)

SOURCE CONSENSUS REQUIREMENTS:
- REQUIRE at least 2 different sources to agree before flagging a claim (for both true and false)
- If only 1 source supports/contradicts, DO NOT flag it unless the evidence is very strong
- If sources significantly conflict, lower confidence or don't flag
- Higher confidence when 3+ sources agree
- Medium confidence when 2 sources agree with clear evidence
- Consider source independence (multiple sources quoting the same original source = 1 source)

For each claim you were given, verify it against the web search results above.

Return ONLY a valid JSON array with BOTH accurate and inaccurate claims:
[
  {
    "claim": "exact text from original",
    "is_accurate": true,
    "confidence": 0.95,
    "reason": "A clear, natural explanation confirming why this claim is accurate based on multiple sources.",
    "correction": null
  },
  {
    "claim": "exact text from original",
    "is_accurate": false,
    "confidence": 0.90,
    "reason": "A clear, natural explanation why this claim is inaccurate based on multiple sources.",
    "correction": "accurate version based on search results"
  }
]

FORMATTING GUIDELINES FOR "reason":
- Write in natural, flowing prose (NOT numbered steps or bullet points)
- Use a friendly, conversational tone
- Mention the consensus across sources (e.g., "multiple sources confirm..." or "sources consistently show...")
- For TRUE claims: Explain what evidence confirms this
- For FALSE claims: Explain what the evidence shows and why it contradicts the claim
- Keep it concise but informative (2-4 sentences)
- Avoid technical jargon or overly formal language
- Make it easy to understand for a general audience

EXAMPLES:
For FALSE claims:
Bad: "Step-by-step explanation: 1) Result 3 states... 2) Result 1 reports... 3) Therefore contradicts..."
Good: "Multiple independent sources confirm that zero-calorie drinks actually contain about 0.24 kcal per 100ml. They're labeled as 'zero calorie' because regulations allow products with less than 5 kcal per 100ml to use this term, but they're not truly zero calories."

For TRUE claims:
Good: "Multiple reputable sources consistently confirm this fact. Historical records and encyclopedias all agree that the Joseon Dynasty did indeed follow the Goryeo Dynasty in 1392."

CRITICAL RULES:
- CAREFULLY read and understand the search results before making any judgment
- CHECK FOR CONSENSUS: At least 2 sources must agree before flagging
- Flag BOTH accurate AND inaccurate claims that have reasonable consensus
- Pay special attention to chronological order and timelines (e.g., historical periods, dates, sequences)
- Flag claims when you have CLEAR evidence from MULTIPLE sources (minimum 2)
- If search results don't provide clear evidence or sources significantly conflict, don't flag the claim
- When correcting historical sequences or timelines, verify the COMPLETE timeline from search results
- For corrections involving "next" or "previous" periods, ensure you understand the chronological order
- For accurate claims: Set correction to null
- For inaccurate claims: Ensure the correction directly addresses what the claim got wrong

CONFIDENCE SCORING GUIDELINES:
- 0.95-1.0: 5+ sources clearly agree with very strong evidence (will be shown)
- 0.90-0.94: 4+ sources agree with strong evidence (will be shown)
- 0.85-0.89: 3+ sources agree with clear evidence (will be shown)
- 0.80-0.84: 2-3 sources agree with good evidence (will be shown)
- 0.75-0.79: 2 sources agree with reasonable evidence (will be shown)
- 0.70-0.74: 2 sources agree but evidence is moderate (will be shown)
- Below 0.70: Don't flag the claim (insufficient consensus)
- If sources significantly conflict: Don't flag or assign lower confidence

IMPORTANT: Results with confidence >= 0.7 will be shown to users. Be reasonably thorough but don't be too conservative.

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

