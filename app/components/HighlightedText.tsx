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
  let lastIndex = 0;

  sortedFactChecks.forEach((factCheck) => {
    // Add text before the fact check
    if (factCheck.start > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, factCheck.start),
      });
    }

    // Add the fact check segment
    segments.push({
      text: text.slice(factCheck.start, factCheck.end),
      factCheck,
    });

    lastIndex = factCheck.end;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
    });
  }

  const getHighlightColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-red-200 hover:bg-red-300';
    if (confidence >= 0.8) return 'bg-orange-200 hover:bg-orange-300';
    return 'bg-yellow-200 hover:bg-yellow-300';
  };

  if (factChecks.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-800">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium">No factual issues detected!</p>
        </div>
        <p className="mt-2 text-sm text-green-700">The text appears to be factually accurate based on available information.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Results</h3>
        <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {segments.map((segment, index) => {
            if (segment.factCheck) {
              return (
                <span
                  key={index}
                  className={`${getHighlightColor(segment.factCheck.confidence)} cursor-pointer transition-colors rounded px-1 relative group`}
                  onClick={() => setSelectedFactCheck(segment.factCheck!)}
                  title={segment.factCheck.reason}
                >
                  {segment.text}
                  <span className="invisible group-hover:visible absolute left-0 top-full mt-2 w-80 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-10 whitespace-normal">
                    <strong className="block mb-1">Why this is flagged:</strong>
                    {segment.factCheck.reason}
                  </span>
                </span>
              );
            }
            return <span key={index}>{segment.text}</span>;
          })}
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Legend</h4>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 bg-red-200 rounded"></span>
            <span className="text-gray-700">High confidence (90%+) - Likely false</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 bg-orange-200 rounded"></span>
            <span className="text-gray-700">Medium confidence (80-90%) - Possibly false</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 bg-yellow-200 rounded"></span>
            <span className="text-gray-700">Lower confidence (70-80%) - Questionable</span>
          </div>
        </div>
      </div>

      {selectedFactCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedFactCheck(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Fact Check Details</h3>
              <button
                onClick={() => setSelectedFactCheck(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Claim</p>
                <p className="text-gray-900 mt-1">{selectedFactCheck.claim}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Confidence</p>
                <p className="text-gray-900 mt-1">{(selectedFactCheck.confidence * 100).toFixed(0)}%</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Reason</p>
                <p className="text-gray-900 mt-1">{selectedFactCheck.reason}</p>
              </div>

              {selectedFactCheck.correction && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Correction</p>
                  <p className="text-gray-900 mt-1">{selectedFactCheck.correction}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedFactCheck(null)}
              className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
