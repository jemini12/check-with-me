'use client';

import { ProgressEvent } from '../lib/types';
import { useLanguage } from '../contexts/LanguageContext';

interface ProgressIndicatorProps {
  /** Current progress event */
  event: ProgressEvent;
}

/**
 * Component that displays real-time progress during fact-checking
 */
export function ProgressIndicator({ event }: ProgressIndicatorProps) {
  const { t } = useLanguage();

  // Debug: log event data
  if (event.data?.partialAIResponse || event.data?.searchResults) {
    console.log('ProgressIndicator received:', event);
  }

  const getStepInfo = () => {
    // Check for dream mode
    const isDreamMode = event.data?.isDreamMode || false;

    switch (event.type) {
      case 'started':
        return {
          text: t('initializing'),
        };
      case 'screening':
        if (isDreamMode) {
          return {
            text: t('dreamingAnswer'),
            icon: '💭',
          };
        }
        return {
          text: t('screening'),
        };
      case 'claims_identified':
        return {
          text: `${t('claimsIdentified')}: ${event.data?.claims?.length || 0}`,
        };
      case 'searching':
        return {
          text: t('searching'),
        };
      case 'verifying':
        const current = event.data?.current || 0;
        const total = event.data?.total || 0;
        const isQuestion = event.data?.isQuestion || false;

        if (isQuestion) {
          return {
            text: t('answeringQuestion'),
          };
        }

        return {
          text: current && total ? `${t('verifying')} (${current}/${total})` : t('verifying'),
        };
      case 'claim_complete':
        return {
          text: t('verifying'),
        };
      case 'complete':
        if (isDreamMode) {
          return {
            text: t('dreamComplete'),
          };
        }
        return {
          text: t('complete'),
        };
      case 'error':
        return {
          text: event.message || t('errorOccurred'),
        };
      default:
        return {
          text: t('initializing'),
        };
    }
  };

  const stepInfo = getStepInfo();
  const isError = event.type === 'error';
  const isComplete = event.type === 'complete';
  const showSpinner = !isError && !isComplete;

  return (
    <div className="p-6 border border-gray-200 rounded bg-white">
      <div className="flex items-center gap-3">
        {showSpinner && (
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 animate-spin text-gray-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {stepInfo.text}
          </p>
          {event.data?.currentClaim && (
            <p className="text-xs text-gray-600 mt-1">
              {event.data.currentClaim}
            </p>
          )}
          {event.data?.partialAIResponse && (
            <p className="text-xs text-gray-500 mt-1 italic">
              {event.data.partialAIResponse}
            </p>
          )}
          {event.data?.searchResults && event.data.searchResults.length > 0 && (
            <ul className="mt-2 space-y-1">
              {event.data.searchResults.map((result, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-gray-400 flex-shrink-0">→</span>
                  <span>{result}</span>
                </li>
              ))}
            </ul>
          )}
          {event.type === 'claims_identified' && event.data?.claims && event.data.claims.length > 0 && (
            <ul className="mt-2 space-y-1">
              {event.data.claims.map((claim, index) => (
                <li key={index} className="text-xs text-gray-700 flex items-start gap-2">
                  <span className="text-gray-400 flex-shrink-0">•</span>
                  <span>{claim}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
