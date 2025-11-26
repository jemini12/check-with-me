'use client';

import { ProgressEvent } from '../lib/types';
import { useLanguage } from '../contexts/LanguageContext';

interface ProgressIndicatorProps {
  /** Current progress event */
  event: ProgressEvent;
}

type StageStatus = 'pending' | 'active' | 'complete';

interface Stage {
  id: string;
  label: string;
  status: StageStatus;
  data?: React.ReactNode;
}

/**
 * Truncates text to a maximum length with ellipsis
 */
const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Component that displays real-time progress during fact-checking with multi-stage visualization
 */
export function ProgressIndicator({ event }: ProgressIndicatorProps) {
  const { t } = useLanguage();

  const isDreamMode = event.data?.isDreamMode || false;
  const isQuestion = event.data?.isQuestion || false;

  // Determine stage statuses based on current event
  const getStages = (): Stage[] => {
    const stages: Stage[] = [];

    // Stage 1: Screening
    const screeningStatus: StageStatus =
      event.type === 'started' || event.type === 'screening'
        ? 'active'
        : event.type === 'claims_identified' ||
          event.type === 'searching' ||
          event.type === 'verifying' ||
          event.type === 'claim_complete' ||
          event.type === 'complete'
        ? 'complete'
        : 'pending';

    const screeningData =
      screeningStatus === 'complete' && event.data?.claims ? (
        <ul className="mt-2 space-y-1">
          {event.data.claims.slice(0, 3).map((claim, index) => (
            <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
              <span className="text-gray-400 flex-shrink-0">•</span>
              <span>{truncate(claim, 80)}</span>
            </li>
          ))}
          {event.data.claims.length > 3 && (
            <li className="text-xs text-gray-500 italic">
              +{event.data.claims.length - 3} more...
            </li>
          )}
        </ul>
      ) : screeningStatus === 'active' ? (
        <p className="text-xs text-gray-500 mt-1 italic">
          {isDreamMode ? t('dreamingAnswer') : t('screening')}
        </p>
      ) : null;

    stages.push({
      id: 'screening',
      label: isDreamMode ? t('dreamingAnswer') : t('screening'),
      status: screeningStatus,
      data: screeningData,
    });

    // Stage 2: Searching
    const searchingStatus: StageStatus =
      event.type === 'searching'
        ? 'active'
        : event.type === 'verifying' ||
          event.type === 'claim_complete' ||
          event.type === 'complete'
        ? 'complete'
        : 'pending';

    const searchingData =
      (searchingStatus === 'active' || searchingStatus === 'complete') &&
      event.data?.searchResults &&
      event.data.searchResults.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {event.data.searchResults.slice(0, 4).map((result, index) => (
            <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
              <span className="text-gray-400 flex-shrink-0">→</span>
              <span>{truncate(result, 70)}</span>
            </li>
          ))}
          {event.data.searchResults.length > 4 && (
            <li className="text-xs text-gray-500 italic">
              +{event.data.searchResults.length - 4} more sources...
            </li>
          )}
        </ul>
      ) : searchingStatus === 'active' ? (
        <p className="text-xs text-gray-500 mt-1 italic">
          {t('searching')}
        </p>
      ) : null;

    stages.push({
      id: 'searching',
      label: t('searching'),
      status: searchingStatus,
      data: searchingData,
    });

    // Stage 3: Verifying
    const verifyingStatus: StageStatus =
      event.type === 'verifying' || event.type === 'claim_complete'
        ? 'active'
        : event.type === 'complete'
        ? 'complete'
        : 'pending';

    const current = event.data?.current || 0;
    const total = event.data?.total || 0;
    const progressText =
      current && total ? `${current}/${total} ${t('verifying').toLowerCase()}` : null;

    const verifyingData =
      verifyingStatus === 'active' || verifyingStatus === 'complete' ? (
        <div className="mt-2">
          {progressText && (
            <p className="text-xs text-gray-600 font-medium mb-1">{progressText}</p>
          )}
          {event.data?.currentClaim && verifyingStatus === 'active' && (
            <p className="text-xs text-gray-600 flex items-start gap-2">
              <span className="text-gray-400 flex-shrink-0">→</span>
              <span>{truncate(event.data.currentClaim, 90)}</span>
            </p>
          )}
          {event.data?.partialAIResponse && verifyingStatus === 'active' && (
            <p className="text-xs text-gray-500 mt-1 italic">
              {truncate(event.data.partialAIResponse, 100)}
            </p>
          )}
          {!progressText && !event.data?.currentClaim && verifyingStatus === 'active' && (
            <p className="text-xs text-gray-500 mt-1 italic">
              {isQuestion ? t('answeringQuestion') : t('verifying')}
            </p>
          )}
        </div>
      ) : null;

    stages.push({
      id: 'verifying',
      label: isQuestion ? t('answeringQuestion') : t('verifying'),
      status: verifyingStatus,
      data: verifyingData,
    });

    return stages;
  };

  const stages = getStages();
  const isComplete = event.type === 'complete';
  const isError = event.type === 'error';

  return (
    <div className="p-6 border border-gray-200 rounded bg-white">
      {/* Stages */}
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            className={`transition-opacity duration-300 ${
              stage.status === 'pending' ? 'opacity-40' : 'opacity-100'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Stage indicator */}
              <div className="flex-shrink-0 mt-0.5">
                {stage.status === 'complete' ? (
                  <svg
                    className="w-5 h-5 text-gray-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : stage.status === 'active' ? (
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
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
              </div>

              {/* Stage content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    stage.status === 'pending' ? 'text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {stage.label}
                </p>
                {stage.data && (
                  <div className="mt-1">{stage.data}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error state */}
      {event.type === 'error' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-900">{event.message || t('errorOccurred')}</p>
        </div>
      )}
    </div>
  );
}
