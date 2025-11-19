'use client';

import { useState } from 'react';
import { FactCheck, ClaimVerificationResult } from '../lib/types';
import BottomSheet from './BottomSheet';
import { RetryButton } from './RetryButton';
import { useLanguage } from '../contexts/LanguageContext';

interface HighlightedTextProps {
  text: string;
  factChecks: FactCheck[];
  claimResults?: ClaimVerificationResult[];
  hasFailures?: boolean;
  onShare?: () => void;
  onRetry?: (claim: string) => Promise<void>;
}

interface TextSegment {
  text: string;
  factCheck?: FactCheck;
}

export default function HighlightedText({
  text,
  factChecks,
  claimResults,
  hasFailures,
  onShare,
  onRetry
}: HighlightedTextProps) {
  const { t } = useLanguage();
  const [selectedFactCheck, setSelectedFactCheck] = useState<FactCheck | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShare = async () => {
    if (!onShare || isSharing) return;

    setIsSharing(true);
    setShareSuccess(false);

    try {
      await onShare();
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // Sort fact checks by start position
  const sortedFactChecks = [...factChecks].sort((a, b) => a.start - b.start);

  // Split text into segments with and without highlights
  const segments: TextSegment[] = [];
  let cursor = 0;

  sortedFactChecks.forEach((factCheck) => {
    const start = Math.max(factCheck.start, cursor);
    const end = Math.min(Math.max(factCheck.end, start), text.length);

    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start) });
    }

    if (end > start) {
      segments.push({
        text: text.slice(start, end),
        factCheck,
      });
      cursor = end;
    }
  });

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  const getHighlightColor = (factCheck: FactCheck) => {
    // Dream mode - purple highlights (ALL dream mode responses)
    if (factCheck.is_dream_mode) {
      if (factCheck.confidence >= 0.95) return 'bg-purple-200 hover:bg-purple-300';
      if (factCheck.confidence >= 0.9) return 'bg-purple-100 hover:bg-purple-200';
      return 'bg-purple-50 hover:bg-purple-100';
    }

    // Orange for questions (answers to user questions)
    if (factCheck.is_question) {
      if (factCheck.confidence >= 0.95) return 'bg-orange-200 hover:bg-orange-300';
      if (factCheck.confidence >= 0.9) return 'bg-orange-100 hover:bg-orange-200';
      return 'bg-orange-50 hover:bg-orange-100';
    }

    // Green/Red for claims
    if (factCheck.is_accurate) {
      // Green for accurate claims
      if (factCheck.confidence >= 0.95) return 'bg-green-200 hover:bg-green-300';
      if (factCheck.confidence >= 0.9) return 'bg-green-100 hover:bg-green-200';
      return 'bg-green-50 hover:bg-green-100';
    } else {
      // Red for inaccurate claims
      if (factCheck.confidence >= 0.95) return 'bg-red-200 hover:bg-red-300';
      if (factCheck.confidence >= 0.9) return 'bg-red-100 hover:bg-red-200';
      return 'bg-red-50 hover:bg-red-100';
    }
  };

  const getBorderColor = (factCheck: FactCheck) => {
    if (factCheck.is_dream_mode) return 'border-purple-400';
    if (factCheck.is_question) return 'border-orange-400';
    return factCheck.is_accurate ? 'border-green-400' : 'border-red-400';
  };

  const failedClaims = claimResults?.filter(r => r.status === 'failed') || [];

  if (factChecks.length === 0 && failedClaims.length === 0) {
    return (
      <div className="w-full p-6 border border-gray-200 rounded bg-gray-50">
        <p className="text-sm text-gray-700 leading-relaxed">
          {t('noVerificationResults')}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          {t('noVerificationExplanation')}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {factChecks.length > 0 && (
        <div className="p-6 border border-gray-200 rounded">
          <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">
            {segments.map((segment, index) => {
              if (segment.factCheck) {
                return (
                  <span
                    key={index}
                    className={`${getHighlightColor(segment.factCheck)} cursor-pointer border-b-2 ${getBorderColor(segment.factCheck)}`}
                    onClick={() => setSelectedFactCheck(segment.factCheck!)}
                    title={segment.factCheck.reason}
                  >
                    {segment.text}
                  </span>
                );
              }
              return <span key={index}>{segment.text}</span>;
            })}
          </div>
        </div>
      )}

      {hasFailures && failedClaims.length > 0 && (
        <div className="p-4 border border-yellow-200 rounded bg-yellow-50">
          <div className="flex items-start gap-2 mb-3">
            <span className="text-yellow-600">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-yellow-800">
                Partial Results
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Some claims could not be verified. {onRetry ? 'You can retry them below.' : ''}
              </p>
            </div>
          </div>

          {onRetry && (
            <div className="space-y-2">
              {failedClaims.map((result, index) => (
                <RetryButton
                  key={index}
                  claim={result.claim}
                  errorMessage={result.error?.message || 'Unknown error'}
                  retryable={result.error?.retryable ?? true}
                  onRetry={onRetry}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="p-4 border border-gray-200 rounded bg-gray-50">
        <div className="flex items-start justify-between gap-4 mb-3">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Legend</p>
          {onShare && (
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {shareSuccess ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-600">{t('shareSuccess')}</span>
                </>
              ) : isSharing ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{t('share')}...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>{t('share')}</span>
                </>
              )}
            </button>
          )}
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="inline-block w-4 h-4 bg-purple-200 border-2 border-purple-400 rounded"></span>
            <div>
              <span className="font-semibold text-purple-700">{t('dreamModeAnswer')}</span>
              <span className="text-gray-600"> - {t('dreamModeDescription')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-block w-4 h-4 bg-orange-200 border-2 border-orange-400 rounded"></span>
            <div>
              <span className="font-semibold text-orange-700">{t('questionAnswer')}</span>
              <span className="text-gray-600"> - {t('generatedAnswer')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-block w-4 h-4 bg-green-200 border-2 border-green-400 rounded"></span>
            <div>
              <span className="font-semibold text-green-700">{t('verifiedAccurate')}</span>
              <span className="text-gray-600"> - {t('confirmedSources')}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-block w-4 h-4 bg-red-200 border-2 border-red-400 rounded"></span>
            <div>
              <span className="font-semibold text-red-700">{t('flaggedInaccurate')}</span>
              <span className="text-gray-600"> - {t('contradictedSources')}</span>
            </div>
          </div>
        </div>
      </div>

      <BottomSheet
        isOpen={selectedFactCheck !== null}
        onClose={() => setSelectedFactCheck(null)}
        title={t('details')}
      >
        {selectedFactCheck && (
          <>
            <div className="space-y-6">
              <div className={`${
                selectedFactCheck.is_dream_mode
                  ? 'bg-purple-50 border-purple-200'
                  : selectedFactCheck.is_question
                  ? 'bg-orange-50 border-orange-200'
                  : selectedFactCheck.is_accurate
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              } border rounded-lg p-4`}>
                <p className={`text-xs font-semibold ${
                  selectedFactCheck.is_dream_mode
                    ? 'text-purple-600'
                    : selectedFactCheck.is_question
                    ? 'text-orange-600'
                    : selectedFactCheck.is_accurate
                    ? 'text-green-600'
                    : 'text-red-600'
                } uppercase tracking-wide mb-2`}>
                  {selectedFactCheck.is_dream_mode
                    ? 'Dream Mode Answer'
                    : selectedFactCheck.is_question
                    ? 'Answer to Question'
                    : selectedFactCheck.is_accurate
                    ? 'Verified Claim'
                    : 'Flagged Claim'}
                </p>
                <p className="text-base text-gray-900 leading-relaxed">{selectedFactCheck.claim}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedFactCheck.is_dream_mode
                      ? 'bg-purple-100 text-purple-700 border border-purple-300'
                      : selectedFactCheck.is_question
                      ? 'bg-orange-100 text-orange-700 border border-orange-300'
                      : selectedFactCheck.is_accurate
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-red-100 text-red-700 border border-red-300'
                  }`}>
                    {(selectedFactCheck.confidence * 100).toFixed(0)}% {selectedFactCheck.is_dream_mode ? 'imaginative' : 'confidence'}
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {selectedFactCheck.is_dream_mode
                    ? t('dreamModeDescription')
                    : selectedFactCheck.is_question
                    ? t('generatedAnswer')
                    : selectedFactCheck.is_accurate
                    ? t('confirmedSources')
                    : t('contradictedSources')}
                </p>
              </div>

              {!selectedFactCheck.is_dream_mode && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Analysis</p>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selectedFactCheck.reason}</p>
                  </div>
                </div>
              )}

              {!selectedFactCheck.is_accurate && selectedFactCheck.correction && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Correction</p>
                  <p className="text-sm text-gray-900 leading-relaxed">{selectedFactCheck.correction}</p>
                </div>
              )}

              {selectedFactCheck.sources && selectedFactCheck.sources.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">{t('details')}</p>
                  <div className="space-y-3">
                    {selectedFactCheck.sources.map((source, index) => (
                      <a
                        key={index}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                              {source.title}
                            </p>
                            {source.snippet && (
                              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                                {source.snippet}
                              </p>
                            )}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedFactCheck(null)}
              className="mt-8 w-full px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              {t('close')}
            </button>
          </>
        )}
      </BottomSheet>
    </div>
  );
}
