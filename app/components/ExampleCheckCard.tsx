'use client';

import { ExampleCheck } from '../lib/types';

interface ExampleCheckCardProps {
  example: ExampleCheck;
  upvoteCount: number;
  isUpvoted: boolean;
  onUpvote: () => void;
  onCheck: () => void;
}

export default function ExampleCheckCard({
  example,
  upvoteCount,
  isUpvoted,
  onUpvote,
  onCheck
}: ExampleCheckCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white flex flex-col h-full">
      {/* Claim Text */}
      <p className="text-gray-900 text-sm leading-relaxed mb-4 flex-1">
        "{example.prompt}"
      </p>

      {/* Check Button */}
      <div className="flex items-center gap-2 mt-auto">
        <button
          onClick={onCheck}
          className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-900 transition-colors inline-flex items-center justify-center gap-2"
        >
          <span>Check</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUpvote();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
            isUpvoted
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-700 border-gray-300 hover:border-black'
          }`}
          title={isUpvoted ? 'Remove upvote' : 'Upvote if interesting'}
        >
          <svg
            className="w-4 h-4"
            fill={isUpvoted ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
          <span className="text-sm font-semibold">{upvoteCount}</span>
        </button>
      </div>
    </div>
  );
}
