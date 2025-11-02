'use client';

import { useState } from 'react';
import TextInput from './components/TextInput';
import HighlightedText from './components/HighlightedText';
import { FactCheckResponse } from './lib/types';

export default function Home() {
  const [result, setResult] = useState<FactCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckFacts = async (text: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/fact-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check facts');
      }

      const data: FactCheckResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Fact Checker
          </h1>
          <p className="text-lg text-gray-600">
            Verify the accuracy of any text using AI-powered fact-checking
          </p>
        </div>

        <TextInput onCheckFacts={handleCheckFacts} isLoading={isLoading} />

        {error && (
          <div className="mt-6 max-w-4xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </div>
        )}

        {result && (
          <div className="mt-8">
            <HighlightedText
              text={result.original_text}
              factChecks={result.fact_checks}
            />
          </div>
        )}

        {!result && !isLoading && (
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">How it works</h2>
              <ol className="space-y-2 text-gray-600">
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">1.</span>
                  <span>Enter or paste any text you want to fact-check</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">2.</span>
                  <span>Click &quot;Check Facts&quot; to analyze the content</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">3.</span>
                  <span>Review highlighted claims that may be inaccurate</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-blue-600">4.</span>
                  <span>Click on highlights to see detailed explanations and corrections</span>
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
