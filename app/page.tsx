'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import TextInput from './components/TextInput';
import HighlightedText from './components/HighlightedText';
import { FactCheckResponse, ShareResponse, ProgressEvent } from './lib/types';
import { ProgressIndicator } from './components/ProgressIndicator';
import LanguageSwitch from './components/LanguageSwitch';
import { useLanguage } from './contexts/LanguageContext';

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

function HomeContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [result, setResult] = useState<FactCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckedText, setLastCheckedText] = useState<string>('');
  const [isSharedResult, setIsSharedResult] = useState(false);
  const [progressEvent, setProgressEvent] = useState<ProgressEvent | null>(null);
  const [dreamMode, setDreamMode] = useState(false);

  // Multi-language titles
  const TITLES = [
    'Check with me.',      // English
    '확인해 보세요.',       // Korean
    '一緒に確認しよう。',   // Japanese
    'Comprueba conmigo.',  // Spanish
    'Vérifie avec moi.',   // French
  ];

  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [typedTitle, setTypedTitle] = useState('');
  const [typingStarted, setTypingStarted] = useState(false);
  const [showCaret, setShowCaret] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Multi-language typing effect
  useEffect(() => {
    setMounted(true);
    setTypingStarted(true);

    const currentTitle = TITLES[currentTitleIndex];
    let charIndex = 0;
    let isCurrentlyDeleting = false;

    const typeInterval = window.setInterval(() => {
      if (!isCurrentlyDeleting) {
        // Typing
        charIndex += 1;
        setTypedTitle(currentTitle.slice(0, charIndex));

        if (charIndex >= currentTitle.length) {
          // Finished typing, wait then start deleting
          setTimeout(() => {
            isCurrentlyDeleting = true;
          }, 2000);
        }
      } else {
        // Deleting
        charIndex -= 1;
        setTypedTitle(currentTitle.slice(0, charIndex));

        if (charIndex <= 0) {
          // Finished deleting, move to next title
          setCurrentTitleIndex((prev) => (prev + 1) % TITLES.length);
          clearInterval(typeInterval);
        }
      }
    }, isCurrentlyDeleting ? 50 : 90);

    return () => clearInterval(typeInterval);
  }, [currentTitleIndex]);

  useEffect(() => {
    const caretInterval = window.setInterval(() => {
      setShowCaret(prev => !prev);
    }, 550);
    return () => clearInterval(caretInterval);
  }, []);

  // Handle share query parameter
  useEffect(() => {
    const shareId = searchParams.get('share');
    if (!shareId) return;

    const loadSharedResult = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/share/${shareId}`);
        if (!response.ok) {
          throw new Error('Failed to load shared result');
        }

        const data = await response.json();
        setLastCheckedText(data.prompt);
        setResult(data.result);
        setIsSharedResult(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load shared result');
      } finally {
        setIsLoading(false);
      }
    };

    loadSharedResult();
  }, [searchParams]);

  // Handle example query parameter from help page
  useEffect(() => {
    const example = searchParams.get('example');
    if (example) {
      setLastCheckedText(example);
    }
  }, [searchParams]);

  const handleCheckFacts = async (text: string) => {
    setIsSharedResult(false);
    setIsLoading(true);
    setError(null);
    setResult(null);
    setProgressEvent(null);
    setLastCheckedText(text);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({ text, dreamMode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      // Check if response is streaming
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream')) {
        // Handle SSE streaming
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Failed to get response reader');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const eventData = line.slice(6);
              try {
                const event: ProgressEvent = JSON.parse(eventData);
                setProgressEvent(event);

                // Handle different event types
                if (event.type === 'complete' && event.data?.result) {
                  setResult(event.data.result);
                } else if (event.type === 'error') {
                  throw new Error(event.message || 'Verification failed');
                }
              } catch (parseError) {
                console.error('Failed to parse SSE event:', parseError);
              }
            }
          }
        }
      } else {
        // Fallback to standard JSON response
        const data: FactCheckResponse = await response.json();
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setProgressEvent(null);
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

  const handleShare = async () => {
    if (!result || !lastCheckedText) return;

    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: lastCheckedText,
          result: result,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const data: ShareResponse = await response.json();

      // Copy to clipboard
      await navigator.clipboard.writeText(data.shareUrl);
    } catch (err) {
      console.error('Share failed:', err);
      throw err;
    }
  };

  const handleRetryClaim = async (_claim: string) => {
    // Re-run the full fact-check for now
    // In the future, this could be optimized to only retry the specific claim
    await handleCheckFacts(lastCheckedText);
  };

  return (
    <main id="main-content" className="min-h-screen bg-white py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 flex items-center min-h-[2.5rem] sm:min-h-[3rem]">
              <span className="inline-block min-w-0">
                {mounted && typingStarted ? typedTitle : TITLES[0]}
                {mounted && !typedTitle && '\u00A0'}
              </span>
              {mounted && typingStarted && (
                <span
                  aria-hidden="true"
                  className={`ml-1 h-7 w-0.5 bg-gray-900 transition-opacity ${
                    showCaret ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}
            </h1>
            <Link
              href="/help"
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('help')}
            </Link>
          </div>
        </header>

        {/* Input Section */}
        <div className="max-w-3xl mx-auto">
          {isSharedResult && result && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="text-blue-900">{t('viewingShared')}</span>
            </div>
          )}

          <TextInput
            onCheckFacts={handleCheckFacts}
            isLoading={isLoading}
            text={lastCheckedText}
            onTextChange={setLastCheckedText}
            dreamMode={dreamMode}
            onDreamModeChange={setDreamMode}
          />

          <div className="mt-4 flex justify-center">
            <LanguageSwitch />
          </div>

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
                  aria-label={t('retryFactCheck')}
                >
                  {t('retry')}
                </button>
                <button
                  onClick={handleClearError}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  aria-label={t('closeError')}
                >
                  {t('close')}
                </button>
              </div>
            </div>
          )}

          {isLoading && progressEvent && (
            <div className="mt-8 animate-slide-up">
              <ProgressIndicator event={progressEvent} />
            </div>
          )}

          {result && !isLoading && (
            <div id="results-section" className="mt-8 animate-slide-up">
              <HighlightedText
                text={result.original_text}
                factChecks={result.fact_checks}
                claimResults={result.claim_results}
                hasFailures={result.has_failures}
                onShare={handleShare}
                onRetry={handleRetryClaim}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
