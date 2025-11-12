'use client';

import { ExampleCheck } from '../lib/types';
import { useSwipeGesture } from '../lib/hooks/useSwipeGesture';

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
  // Swipe left to check
  const cardRef = useSwipeGesture<HTMLDivElement>({
    onSwipeLeft: onCheck,
  });

  return (
    <div
      ref={cardRef}
      className="border border-gray-200 rounded-lg p-4 bg-white flex flex-col h-full touch-pan-y"
    >
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
        {/* Upvote button hidden - feature not stable yet */}
      </div>
    </div>
  );
}
