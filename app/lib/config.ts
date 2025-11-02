/**
 * Application configuration constants
 * Centralized location for all configuration values to improve maintainability
 */

export const API_CONFIG = {
  /** Maximum character limit for text input */
  MAX_TEXT_LENGTH: 10000,

  /** Maximum number of web search results to retrieve per claim */
  MAX_SEARCH_RESULTS: 3,

  /** Web search depth level */
  SEARCH_DEPTH: 'basic' as const,

  /** Whether to include answer in search results */
  INCLUDE_ANSWER: false,
} as const;

export const OPENAI_CONFIG = {
  /** Default model to use for fact-checking */
  DEFAULT_MODEL: 'gpt-5',

  /** Maximum output tokens for OpenAI API calls */
  MAX_OUTPUT_TOKENS: 8000,

  /** Reasoning effort level for initial screening */
  SCREENING_EFFORT: 'medium' as const,

  /** Reasoning effort level for verification */
  VERIFICATION_EFFORT: 'high' as const,
} as const;

export const CONFIDENCE_THRESHOLDS = {
  /** Minimum confidence to report a fact check */
  MIN_CONFIDENCE: 0.7,

  /** High confidence threshold (red highlight) */
  HIGH_CONFIDENCE: 0.9,

  /** Medium confidence threshold (orange highlight) */
  MEDIUM_CONFIDENCE: 0.8,
} as const;

export const ERROR_MESSAGES = {
  INVALID_TEXT: 'Invalid request. Text is required.',
  TEXT_TOO_LONG: `Text is too long. Maximum ${API_CONFIG.MAX_TEXT_LENGTH.toLocaleString()} characters.`,
  PROCESSING_FAILED: 'Failed to process fact-check request.',
  NO_SCREENING_RESPONSE: 'No response from initial screening',
  FACT_CHECK_FAILED: 'Failed to check facts. Please try again.',
  TAVILY_NOT_CONFIGURED: 'Tavily API key not configured. Skipping web search.',
} as const;
