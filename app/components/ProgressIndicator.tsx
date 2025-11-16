'use client';

import { ProgressEvent } from '../lib/types';

interface ProgressIndicatorProps {
  /** Current progress event */
  event: ProgressEvent;
}

/**
 * Component that displays real-time progress during fact-checking
 */
export function ProgressIndicator({ event }: ProgressIndicatorProps) {
  const getStepInfo = () => {
    switch (event.type) {
      case 'started':
        return {
          icon: '🔍',
          text: 'Initializing fact-check...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        };
      case 'screening':
        return {
          icon: '📝',
          text: 'Extracting verifiable claims...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        };
      case 'claims_identified':
        return {
          icon: '✓',
          text: `Found ${event.data?.claims?.length || 0} claim(s) to verify`,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'searching':
        return {
          icon: '🔎',
          text: event.message || 'Searching web for evidence...',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
        };
      case 'verifying':
        const current = event.data?.current || 0;
        const total = event.data?.total || 0;
        return {
          icon: '⚖️',
          text: event.message || `Verifying claim ${current} of ${total}...`,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
        };
      case 'claim_complete':
        return {
          icon: '✓',
          text: event.message || 'Claim verified',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'complete':
        return {
          icon: '🎉',
          text: 'Fact-check complete!',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'error':
        return {
          icon: '⚠️',
          text: event.message || 'An error occurred',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        };
      default:
        return {
          icon: '⏳',
          text: 'Processing...',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <div className={`p-4 border border-gray-200 rounded ${stepInfo.bgColor} animate-pulse-subtle`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden="true">
          {stepInfo.icon}
        </span>
        <div className="flex-1">
          <p className={`text-sm font-medium ${stepInfo.color}`}>
            {stepInfo.text}
          </p>
          {event.data?.currentClaim && (
            <p className="text-xs text-gray-600 mt-1">
              {event.data.currentClaim}
            </p>
          )}
          {event.type === 'claims_identified' && event.data?.claims && event.data.claims.length > 0 && (
            <ul className="mt-2 space-y-1">
              {event.data.claims.map((claim, index) => (
                <li key={index} className="text-xs text-gray-700 flex items-start gap-2">
                  <span className="text-green-500 flex-shrink-0">•</span>
                  <span>{claim}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {(event.type === 'screening' || event.type === 'searching' || event.type === 'verifying') && (
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 animate-spin text-gray-500"
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
      </div>
    </div>
  );
}
