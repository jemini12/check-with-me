'use client';

import { useState, useEffect } from 'react';
import ExampleCheckCard from './ExampleCheckCard';
import { FactCheckResponse } from '../lib/types';

interface ExampleChecksProps {
  onCheckExample: (result: FactCheckResponse) => void;
}

interface TrendingPrompt {
  id: string;
  prompt: string;
  cached_result: FactCheckResponse;
  upvote_count: number;
}

const UPVOTES_STORAGE_KEY = 'check-with-me-upvotes';

export default function ExampleChecks({ onCheckExample }: ExampleChecksProps) {
  const [trendingPrompts, setTrendingPrompts] = useState<TrendingPrompt[]>([]);
  const [upvotes, setUpvotes] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // Fetch trending prompts from API
  useEffect(() => {
    const fetchTrendingPrompts = async () => {
      try {
        const response = await fetch('/api/trending');
        if (!response.ok) {
          throw new Error('Failed to fetch trending prompts');
        }
        const { data } = await response.json();
        setTrendingPrompts(data);
      } catch (error) {
        console.error('Error fetching trending prompts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingPrompts();
  }, []);

  // Save upvotes to localStorage when they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(UPVOTES_STORAGE_KEY, JSON.stringify(upvotes));
    }
  }, [upvotes, mounted]);

  // Toggle upvote for an example and update database
  const handleUpvote = async (promptId: string) => {
    const wasUpvoted = upvotes[promptId];

    // Optimistic UI update
    setUpvotes(prev => ({
      ...prev,
      [promptId]: !prev[promptId]
    }));

    // Only call API if not already upvoted (prevent multiple upvotes)
    if (!wasUpvoted) {
      try {
        const response = await fetch(`/api/trending/${promptId}/upvote`, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Failed to upvote');
        }

        const { upvote_count } = await response.json();

        // Update local state with new count
        setTrendingPrompts(prev =>
          prev.map(p =>
            p.id === promptId ? { ...p, upvote_count } : p
          )
        );
      } catch (error) {
        console.error('Error upvoting prompt:', error);
        // Revert on error
        setUpvotes(prev => ({
          ...prev,
          [promptId]: wasUpvoted
        }));
      }
    }
  };

  // Calculate upvote count for display
  const getUpvoteCount = (promptId: string, baseCount: number): number => {
    return (baseCount || 0) + (upvotes[promptId] ? 1 : 0);
  };

  if (loading) {
    return (
      <section className="w-full space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Trendings</h2>
        </div>
        <div className="text-center py-8 text-gray-500">Loading trending prompts...</div>
      </section>
    );
  }

  return (
    <section className="w-full space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Trendings</h2>
      </div>

      {/* Examples Grid */}
      {trendingPrompts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No trending prompts yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingPrompts.map(prompt => (
            <ExampleCheckCard
              key={prompt.id}
              example={{
                id: prompt.id,
                prompt: prompt.prompt,
                category: 'science', // placeholder, not used
                cachedResult: prompt.cached_result,
                initialUpvotes: prompt.upvote_count
              }}
              upvoteCount={getUpvoteCount(prompt.id, prompt.upvote_count)}
              isUpvoted={upvotes[prompt.id] || false}
              onUpvote={() => handleUpvote(prompt.id)}
              onCheck={() => onCheckExample(prompt.cached_result)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
