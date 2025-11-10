'use client';

import { useState } from 'react';
import TextInput from './components/TextInput';
import HighlightedText from './components/HighlightedText';
import { FactCheckResponse } from './lib/types';

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="mt-8 space-y-4" role="status" aria-label="Loading fact-check results">
      <div className="p-6 border border-gray-200 rounded">
        <div className="space-y-3">
          <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-gray-100 rounded w-4/6 animate-pulse"></div>
        </div>
      </div>
      <p className="sr-only">Analyzing text...</p>
    </div>
  );
}

export default function Home() {
  const [result, setResult] = useState<FactCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckedText, setLastCheckedText] = useState<string>('');

  const handleCheckFacts = async (text: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setLastCheckedText(text);

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
        throw new Error(errorData.error || 'Fact-check failed');
      }

      const data: FactCheckResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastCheckedText) {
      handleCheckFacts(lastCheckedText);
    }
  };

  const handleClearError = () => {
    setError(null);
  };

  return (
    <main id="main-content" className="min-h-screen bg-white py-8 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-black mb-2">
            Fact Checker
          </h1>
        </header>

        <TextInput onCheckFacts={handleCheckFacts} isLoading={isLoading} />

        {error && (
          <div
            className="mt-6 p-4 border border-gray-200 rounded"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-sm text-gray-900 mb-3">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={handleRetry}
                className="px-3 py-1.5 text-sm bg-black text-white rounded hover:bg-gray-800"
                aria-label="Retry fact-check"
              >
                Retry
              </button>
              <button
                onClick={handleClearError}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                aria-label="Close error message"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {isLoading && <LoadingSkeleton />}

        {result && !isLoading && (
          <div className="mt-8 animate-slide-up">
            <HighlightedText
              text={result.original_text}
              factChecks={result.fact_checks}
            />
          </div>
        )}

      </div>
    </main>
  );
}
