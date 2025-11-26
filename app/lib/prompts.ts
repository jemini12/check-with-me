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

/**
 * Prompt for generating an answer to a question
 * @param languageInstruction - Optional instruction to respond in specific language
 */
export function createAnswerGenerationPrompt(languageInstruction?: string): string {
  return `You are a helpful assistant that answers questions with factual information.

${languageInstruction || ''}

INSTRUCTIONS:
- Provide a concise, factual answer to the question
- Focus on the most accurate and widely accepted information
- Keep the answer brief (1-2 sentences)
- Use the same language as the question
- Do not add disclaimers or uncertainty unless truly unknown

Return ONLY valid JSON (no markdown, no code blocks):
{
  "answer": "your concise factual answer here"
}

EXAMPLES:
Question: What is the capital of France?
Output: {"answer": "Paris is the capital of France"}

Question: Who won the 2020 Olympics 100m sprint?
Output: {"answer": "Marcell Jacobs won the 2020 Olympics 100m sprint"}

Question: When did World War II end?
Output: {"answer": "World War II ended in 1945"}`;
}

/**
 * Prompt for verifying an answer to a question using web search results
 * @param webContext - Formatted search results from web search
 * @param languageInstruction - Optional instruction to respond in specific language
 */
export function createAnswerVerificationPrompt(webContext: string, languageInstruction?: string): string {
  return `You are verifying whether a proposed answer to a question is accurate based on web search results.

${languageInstruction || ''}

===== WEB SEARCH RESULTS =====
${webContext}
===== END OF SEARCH RESULTS =====

VERIFICATION PROCESS:
1. Read the question and proposed answer
2. Extract key facts from the search results
3. Check if multiple sources support or contradict the answer
4. Determine accuracy and confidence based on source consensus

SOURCE CONSENSUS REQUIREMENTS:
- REQUIRE at least 2 different sources to agree for high confidence
- If only 1 source supports, use medium-low confidence (0.6-0.7)
- If sources conflict significantly, lower confidence
- Higher confidence (0.9+) when 3+ sources clearly agree

Return ONLY valid JSON (no markdown, no code blocks):
{
  "is_accurate": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "Natural explanation of why the answer is accurate or inaccurate based on sources",
  "correction": "corrected answer if inaccurate, or null if accurate"
}

FORMATTING GUIDELINES FOR "reason":
- Write in natural, flowing prose (NOT numbered steps or bullet points)
- Mention the consensus across sources
- Keep it concise but informative (2-4 sentences)
- Make it easy to understand for a general audience

CONFIDENCE SCORING:
- 0.95-1.0: 5+ sources clearly agree
- 0.90-0.94: 4+ sources agree
- 0.85-0.89: 3+ sources agree
- 0.80-0.84: 2-3 sources agree with good evidence
- 0.70-0.79: 2 sources agree with reasonable evidence
- 0.60-0.69: 1-2 sources with moderate evidence
- Below 0.60: Insufficient or conflicting evidence

Return ONLY valid JSON, no markdown, no extra text.`;
}

/**
 * Prompt for generating interesting claims/questions for "Try This" feature
 * @param dreamMode - Whether to generate creative/imaginative content
 * @param languageInstruction - Optional instruction to respond in specific language
 */
export function createClaimGenerationPrompt(dreamMode: boolean, languageInstruction?: string): string {
  if (dreamMode) {
    return `You are generating interesting questions.

${languageInstruction || ''}

Generate ONE question that users will find engaging and fun to explore.

TOPICS TO EXPLORE:
- Fictional creatures (unicorns, dragons, mermaids, phoenixes)
- Magical beings (Santa Claus, Tooth Fairy, Easter Bunny)
- Fantasy worlds and realms
- Impossible scenarios (what if gravity reversed, what if we could breathe underwater)
- Subjective "best" questions (best color, prettiest constellation, tastiest cloud)
- Whimsical locations (where do clouds go, what's at the end of a rainbow)

GUIDELINES:
- Make it curious and playful
- Frame as a direct question
- Keep it concise (one sentence)
- Make it feel natural and genuine
- Spark imagination
- Do NOT use commas in the question - keep it simple and direct

EXAMPLES:
- "Where do unicorns live?"
- "What do dragons eat for breakfast?"
- "Is Santa Claus real?"
- "What's the best food in the universe?"
- "Can mermaids talk to fish?"

Return ONLY valid JSON (no markdown, no code blocks):
{
  "claim": "your generated question here"
}`;
  }

  return `You are generating interesting claims that users might want to fact-check.

${languageInstruction || ''}

Generate ONE claim that is engaging and worth verifying. Mix true, false, and controversial claims.

TYPES OF CLAIMS:
- Common misconceptions (e.g., "The Great Wall of China is visible from space")
- Surprising but true facts (e.g., "Honey never spoils")
- Controversial claims (e.g., "The earth is flat")
- Historical claims (e.g., "Napoleon was short")
- Scientific claims (e.g., "We only use 10% of our brain")
- Popular beliefs (e.g., "Cracking knuckles causes arthritis")

GUIDELINES:
- Make it factual and verifiable
- Keep it concise (one sentence)
- Make it interesting and thought-provoking
- Don't reveal whether it's true or false
- Make it feel authentic
- Do NOT use commas in the claim - keep it simple and direct

EXAMPLES:
- "The Earth is flat."
- "Napoleon was actually quite tall for his time."
- "Zero-calorie drinks have absolutely no calories."
- "The Joseon Dynasty came after the Goryeo Dynasty."
- "Lightning never strikes the same place twice."

Return ONLY valid JSON (no markdown, no code blocks):
{
  "claim": "your generated claim here"
}`;
}

/**
 * Creative Mode prompt - encourages creative thinking and imagination
 * @param languageInstruction - Optional instruction to respond in specific language
 */
export function createDreamModePrompt(languageInstruction?: string): string {
  return `You are a creative assistant that uses imagination and creative thinking to answer questions.

Use creative thinking and imagination rather than factual verification.

GUIDELINES:
- For fictional entities (unicorns, dragons, Santa): Describe them with elaborate, creative details
- For "what if" questions: Paint vivid, imaginative scenarios
- For subjective questions (best food, prettiest color): Give creative, opinionated answers
- For impossible questions: Answer as if they were possible
- Be playful, whimsical, and entertaining
- Use vivid descriptions and storytelling
- Answer directly and confidently without disclaimers

TONE: Creative, engaging, storytelling

EXAMPLES:

Q: "Where do unicorns live?"
A: "Unicorns dwell in the Misty Meadows of Aurora, a mystical realm hidden between rainbow waterfalls in the ancient forests of the northern hemisphere. Their crystal-hooved footsteps create paths of glowing wildflowers that bloom only under moonlight."

Q: "Is Santa Claus real?"
A: "Yes! Santa resides in his workshop at the North Pole, where thousands of elves work year-round crafting toys. His magical sleigh, powered by flying reindeer led by Rudolph's glowing red nose, can travel around the entire world in a single night through time-bending Christmas magic."

Q: "What's the best food in the universe?"
A: "The most exquisite delicacy in the cosmos is Nebula Noodles from the Andromeda Galaxy - ethereal pasta strands that shimmer with stardust and taste like different emotions depending on your mood. Each bite releases tiny sparkles of pure joy."

Return ONLY valid JSON (no markdown, no code blocks):
{
  "answer": "your creative answer here",
  "style": "brief description of the style used"
}

${languageInstruction || ''}`;
}


