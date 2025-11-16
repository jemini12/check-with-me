'use client';

import { useState } from 'react';

interface RetryButtonProps {
  /** The claim that failed */
  claim: string;
  /** Error message to display */
  errorMessage: string;
  /** Whether this error is retryable */
  retryable: boolean;
  /** Callback when retry is clicked */
  onRetry: (claim: string) => Promise<void>;
}

/**
 * Button component for retrying failed claim verifications
 */
export function RetryButton({ claim, errorMessage, retryable, onRetry }: RetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry(claim);
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-start gap-2">
        <span className="text-red-600 dark:text-red-400 text-sm">⚠️</span>
        <div className="flex-1">
          <p className="text-sm text-red-800 dark:text-red-300 font-medium">
            Failed to verify claim
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            {errorMessage}
          </p>
          {retryable && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="mt-2 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400
                       hover:bg-red-100 dark:hover:bg-red-900/40 rounded border border-red-300
                       dark:border-red-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
