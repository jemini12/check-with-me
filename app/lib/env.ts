/**
 * Environment variable validation and access utilities
 * Provides type-safe access to environment variables with validation
 */

/**
 * Retrieves and validates the OpenAI API key
 * @throws {Error} If the API key is not configured
 * @returns {string} The validated OpenAI API key
 */
export function getOpenAIApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('OPENAI_API_KEY environment variable is not configured');
  }

  return apiKey;
}

/**
 * Retrieves and validates the Tavily API key
 * @returns {string | null} The Tavily API key or null if not configured
 */
export function getTavilyApiKey(): string | null {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_tavily_api_key_here') {
    return null;
  }

  return apiKey;
}

/**
 * Retrieves the OpenAI model name from environment or returns default
 * @param {string} defaultModel - The default model to use if not configured
 * @returns {string} The model name to use
 */
export function getOpenAIModel(defaultModel: string): string {
  const model = process.env.OPENAI_MODEL;
  return model && model.trim() !== '' ? model : defaultModel;
}

/**
 * Checks if the application is running in development mode
 * @returns {boolean} True if in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}
