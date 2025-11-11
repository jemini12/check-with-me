'use client';

import { useState } from 'react';
import TextInput from './components/TextInput';
import HighlightedText from './components/HighlightedText';
import ExampleChecks from './components/ExampleChecks';
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
  const [inputText, setInputText] = useState<string>('');
  const [pendingCachedResult, setPendingCachedResult] = useState<FactCheckResponse | null>(null);

  const handleCheckFacts = async (text: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setLastCheckedText(text);

    if (pendingCachedResult && pendingCachedResult.original_text === text) {
      setResult(pendingCachedResult);
      setPendingCachedResult(null);
      setIsLoading(false);
      return;
    }

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

  const handleCheckExample = (cachedResult: FactCheckResponse) => {
    setError(null);
    setResult(null);
    setPendingCachedResult(cachedResult);
    setInputText(cachedResult.original_text);
    const inputElement = document.getElementById('text-input') as HTMLTextAreaElement | null;
    inputElement?.focus();
  };

  return (
    <main id="main-content" className="min-h-screen bg-white py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900">
            Verify Claims.
          </h1>
        </header>

        {/* Input Section */}
        <div className="max-w-3xl mx-auto">
          <TextInput
            onCheckFacts={handleCheckFacts}
            isLoading={isLoading}
            text={inputText}
            onTextChange={(value) => {
              setInputText(value);
              if (pendingCachedResult && pendingCachedResult.original_text !== value) {
                setPendingCachedResult(null);
              }
            }}
          />

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
            <div id="results-section" className="mt-8 animate-slide-up">
              <HighlightedText
                text={result.original_text}
                factChecks={result.fact_checks}
              />
            </div>
          )}
        </div>

        {/* Examples Section */}
        <div className="mt-16">
          <ExampleChecks onCheckExample={handleCheckExample} />
        </div>

      </div>
    </main>
  );
}
