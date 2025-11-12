'use client';

import { useState } from 'react';
import { FactCheck } from '../lib/types';

interface HighlightedTextProps {
  text: string;
  factChecks: FactCheck[];
}

interface TextSegment {
  text: string;
  factCheck?: FactCheck;
}

export default function HighlightedText({ text, factChecks }: HighlightedTextProps) {
  const [selectedFactCheck, setSelectedFactCheck] = useState<FactCheck | null>(null);

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

  const getHighlightColor = (isAccurate: boolean, confidence: number) => {
    if (isAccurate) {
      // Green for accurate claims
      if (confidence >= 0.95) return 'bg-green-200 hover:bg-green-300';
      if (confidence >= 0.9) return 'bg-green-100 hover:bg-green-200';
      return 'bg-green-50 hover:bg-green-100';
    } else {
      // Red for inaccurate claims
      if (confidence >= 0.95) return 'bg-red-200 hover:bg-red-300';
      if (confidence >= 0.9) return 'bg-red-100 hover:bg-red-200';
      return 'bg-red-50 hover:bg-red-100';
    }
  };

  const getBorderColor = (isAccurate: boolean) => {
    return isAccurate ? 'border-green-400' : 'border-red-400';
  };

  if (factChecks.length === 0) {
    return (
      <div className="w-full p-4 border border-gray-200 rounded">
        <p className="text-sm text-gray-900">No verifiable claims found with sufficient consensus from sources.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="p-6 border border-gray-200 rounded">
        <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">
          {segments.map((segment, index) => {
            if (segment.factCheck) {
              return (
                <span
                  key={index}
                  className={`${getHighlightColor(segment.factCheck.is_accurate, segment.factCheck.confidence)} cursor-pointer border-b-2 ${getBorderColor(segment.factCheck.is_accurate)}`}
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

      <div className="p-4 border border-gray-200 rounded bg-gray-50">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Legend</p>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="inline-block w-4 h-4 bg-green-200 border-2 border-green-400 rounded"></span>
            <div>
              <span className="font-semibold text-green-700">Verified as Accurate</span>
              <span className="text-gray-600"> - Confirmed by multiple sources</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-block w-4 h-4 bg-red-200 border-2 border-red-400 rounded"></span>
            <div>
              <span className="font-semibold text-red-700">Flagged as False</span>
              <span className="text-gray-600"> - Contradicted by multiple sources</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 italic">Darker shading indicates higher confidence</p>
        </div>
      </div>

      {selectedFactCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setSelectedFactCheck(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">Details</h3>
              <button
                onClick={() => setSelectedFactCheck(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className={`${selectedFactCheck.is_accurate ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
                <p className={`text-xs font-semibold ${selectedFactCheck.is_accurate ? 'text-green-600' : 'text-red-600'} uppercase tracking-wide mb-2`}>
                  {selectedFactCheck.is_accurate ? 'Verified Claim' : 'Flagged Claim'}
                </p>
                <p className="text-base text-gray-900 leading-relaxed">{selectedFactCheck.claim}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedFactCheck.is_accurate
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-red-100 text-red-700 border border-red-300'
                  }`}>
                    {(selectedFactCheck.confidence * 100).toFixed(0)}% confidence
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {selectedFactCheck.is_accurate
                    ? 'Confirmed by multiple sources'
                    : 'Contradicted by multiple sources'}
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Analysis</p>
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selectedFactCheck.reason}</p>
                </div>
              </div>

              {!selectedFactCheck.is_accurate && selectedFactCheck.correction && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Correction</p>
                  <p className="text-sm text-gray-900 leading-relaxed">{selectedFactCheck.correction}</p>
                </div>
              )}

              {selectedFactCheck.sources && selectedFactCheck.sources.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Sources</p>
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
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
