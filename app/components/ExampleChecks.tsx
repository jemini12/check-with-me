'use client';

import { useState, useEffect } from 'react';
import ExampleCheckCard from './ExampleCheckCard';
import { EXAMPLE_CHECKS, ExampleCategory, CATEGORY_INFO } from '../lib/example-checks';
import { FactCheckResponse } from '../lib/types';

interface ExampleChecksProps {
  onCheckExample: (result: FactCheckResponse) => void;
}

const UPVOTES_STORAGE_KEY = 'fact-checker-upvotes';

export default function ExampleChecks({ onCheckExample }: ExampleChecksProps) {
  const [upvotes, setUpvotes] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<ExampleCategory | 'all'>('all');
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

  // Filter examples by category
  const filteredExamples = selectedCategory === 'all'
    ? EXAMPLE_CHECKS
    : EXAMPLE_CHECKS.filter(ex => ex.category === selectedCategory);

  // Sort by upvote count (highest first)
  const sortedExamples = [...filteredExamples].sort((a, b) => {
    const aCount = getUpvoteCount(a.id, a.initialUpvotes);
    const bCount = getUpvoteCount(b.id, b.initialUpvotes);
    return bCount - aCount;
  });

  const categories: Array<ExampleCategory | 'all'> = ['all', 'science', 'health', 'history', 'myths'];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Popular Fact-Checks</h2>
          <p className="text-sm text-gray-600 mt-1">
            Explore interesting claims others have checked
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 text-sm rounded-full transition-colors ${
            selectedCategory === 'all'
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.slice(1).map(category => {
          const info = CATEGORY_INFO[category as ExampleCategory];
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category as ExampleCategory)}
              className={`px-4 py-2 text-sm rounded-full transition-colors flex items-center gap-2 ${
                selectedCategory === category
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{info.emoji}</span>
              <span>{info.label}</span>
            </button>
          );
        })}
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

      {/* Empty State */}
      {sortedExamples.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No examples in this category yet.</p>
        </div>
      )}
    </div>
  );
}
