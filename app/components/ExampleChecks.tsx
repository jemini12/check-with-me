'use client';

import { useState, useEffect } from 'react';
import ExampleCheckCard from './ExampleCheckCard';
import { EXAMPLE_CHECKS } from '../lib/example-checks';
import { FactCheckResponse } from '../lib/types';

interface ExampleChecksProps {
  onCheckExample: (result: FactCheckResponse) => void;
}

const UPVOTES_STORAGE_KEY = 'fact-checker-upvotes';

export default function ExampleChecks({ onCheckExample }: ExampleChecksProps) {
  const [upvotes, setUpvotes] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  // Load upvotes from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(UPVOTES_STORAGE_KEY);
    if (stored) {
      try {
        setUpvotes(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load upvotes:', e);
      }
    }
  }, []);

  // Save upvotes to localStorage when they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(UPVOTES_STORAGE_KEY, JSON.stringify(upvotes));
    }
  }, [upvotes, mounted]);

  // Toggle upvote for an example
  const handleUpvote = (exampleId: string) => {
    setUpvotes(prev => ({
      ...prev,
      [exampleId]: !prev[exampleId]
    }));
  };

  // Calculate upvote count for an example
  const getUpvoteCount = (exampleId: string, initialCount: number): number => {
    return initialCount + (upvotes[exampleId] ? 1 : 0);
  };

  // Sort by upvote count (highest first)
  const sortedExamples = [...EXAMPLE_CHECKS].sort((a, b) => {
    const aCount = getUpvoteCount(a.id, a.initialUpvotes);
    const bCount = getUpvoteCount(b.id, b.initialUpvotes);
    return bCount - aCount;
  });

  return (
    <section className="w-full space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Trendings</h2>
      </div>

      {/* Examples Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedExamples.map(example => (
          <ExampleCheckCard
            key={example.id}
            example={example}
            upvoteCount={getUpvoteCount(example.id, example.initialUpvotes)}
            isUpvoted={upvotes[example.id] || false}
            onUpvote={() => handleUpvote(example.id)}
            onCheck={() => onCheckExample(example.cachedResult)}
          />
        ))}
      </div>
    </section>
  );
}
