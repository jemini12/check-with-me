import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabase-server';
import { logger } from '@/app/lib/logger';

/**
 * POST /api/trending/[id]/upvote
 * Increment upvote count for a trending prompt
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    logger.info('Upvoting trending prompt', { id });

    // Increment upvote_count using RPC or direct update
    const { data, error } = await supabaseServer
      .rpc('increment_upvote', { prompt_id: id });

    if (error) {
      // If RPC doesn't exist, fall back to manual increment
      logger.warn('RPC increment_upvote not found, using manual increment', { error });

      // Get current upvote count
      const { data: currentData, error: fetchError } = await supabaseServer
        .from('trending_prompts')
        .select('upvote_count')
        .eq('id', id)
        .single();

      if (fetchError) {
        logger.error('Failed to fetch trending prompt', fetchError);
        return NextResponse.json(
          { error: 'Trending prompt not found' },
          { status: 404 }
        );
      }

      // Increment and update
      const newCount = (currentData.upvote_count || 0) + 1;
      const { error: updateError } = await supabaseServer
        .from('trending_prompts')
        .update({ upvote_count: newCount })
        .eq('id', id);

      if (updateError) {
        logger.error('Failed to update upvote count', updateError);
        return NextResponse.json(
          { error: 'Failed to upvote' },
          { status: 500 }
        );
      }

      logger.info('Trending prompt upvoted', { id, newCount });
      return NextResponse.json({ success: true, upvote_count: newCount });
    }

    logger.info('Trending prompt upvoted via RPC', { id, data });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('Unexpected error upvoting trending prompt', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
