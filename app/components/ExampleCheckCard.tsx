'use client';

import { ExampleCheck, CATEGORY_INFO } from '../lib/example-checks';

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
  const categoryInfo = CATEGORY_INFO[example.category];

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors bg-white">
      {/* Header: Category and Upvote */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{categoryInfo.emoji}</span>
          <span className="text-xs font-medium text-gray-600">{categoryInfo.label}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onUpvote();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
            isUpvoted
              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

      {/* Claim Text */}
      <p className="text-gray-900 text-sm leading-relaxed mb-4">
        "{example.prompt}"
      </p>

      {/* Check Button */}
      <button
        onClick={onCheck}
        className="w-full px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
      >
        <span>Check This Claim</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
