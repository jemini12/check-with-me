import { tavily } from '@tavily/core';
import { Source } from './types';

const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY || '',
});

export async function searchWeb(query: string): Promise<Source[]> {
  try {
    if (!process.env.TAVILY_API_KEY || process.env.TAVILY_API_KEY === 'your_tavily_api_key_here') {
      console.warn('Tavily API key not configured. Skipping web search.');
      return [];
    }

    const response = await tavilyClient.search(query, {
      maxResults: 3,
      searchDepth: 'basic',
      includeAnswer: false,
    });

    return response.results.map((result) => ({
      url: result.url,
      title: result.title,
      snippet: result.content,
    }));
  } catch (error) {
    console.error('Error searching web:', error);
    return [];
  }
}
