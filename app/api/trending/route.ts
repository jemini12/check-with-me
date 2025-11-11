import { NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabase-server';
import { logger } from '@/app/lib/logger';

/**
 * GET /api/trending
 * Fetch all trending prompts sorted by upvote count
 */
export async function GET() {
  try {
    logger.info('Fetching trending prompts');

    const { data, error } = await supabaseServer
      .from('trending_prompts')
      .select('*')
      .order('upvote_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch trending prompts', error);
      return NextResponse.json(
        { error: 'Failed to fetch trending prompts' },
        { status: 500 }
      );
    }

    logger.info('Trending prompts fetched', { count: data?.length || 0 });
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    logger.error('Unexpected error fetching trending prompts', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
