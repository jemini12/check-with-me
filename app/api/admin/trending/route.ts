import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabase-server';
import { logger } from '@/app/lib/logger';
import { FactCheckResponse } from '@/app/lib/types';

/**
 * POST /api/admin/trending
 * Create a new trending prompt
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, cached_result } = body;

    if (!prompt || !cached_result) {
      return NextResponse.json(
        { error: 'prompt and cached_result are required' },
        { status: 400 }
      );
    }

    logger.info('Creating new trending prompt', { prompt });

    const { data, error } = await supabaseServer
      .from('trending_prompts')
      .insert({
        prompt,
        cached_result,
        upvote_count: 0,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create trending prompt', error);
      return NextResponse.json(
        { error: 'Failed to create trending prompt' },
        { status: 500 }
      );
    }

    logger.info('Trending prompt created', { id: data.id });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    logger.error('Unexpected error creating trending prompt', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
