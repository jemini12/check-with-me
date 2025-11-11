import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabase-server';
import { logger } from '@/app/lib/logger';

/**
 * POST /api/admin/history/[id]/to-trending
 * Convert a history entry to a trending prompt
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    logger.info('Converting history entry to trending prompt', { id });

    // Fetch the history entry
    const { data: historyEntry, error: fetchError } = await supabaseServer
      .from('fact_check_history')
      .select('original_text, result')
      .eq('id', id)
      .single();

    if (fetchError || !historyEntry) {
      logger.error('History entry not found', { id, error: fetchError });
      return NextResponse.json(
        { error: 'History entry not found' },
        { status: 404 }
      );
    }

    // Check if this prompt already exists in trending
    const { data: existing } = await supabaseServer
      .from('trending_prompts')
      .select('id')
      .eq('prompt', historyEntry.original_text)
      .maybeSingle();

    if (existing) {
      logger.warn('Prompt already exists in trending', { id });
      return NextResponse.json(
        { error: 'This prompt already exists in trending prompts' },
        { status: 409 }
      );
    }

    // Create new trending prompt
    const { data: newPrompt, error: insertError } = await supabaseServer
      .from('trending_prompts')
      .insert({
        prompt: historyEntry.original_text,
        cached_result: historyEntry.result,
        upvote_count: 0,
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to create trending prompt', insertError);
      return NextResponse.json(
        { error: 'Failed to create trending prompt' },
        { status: 500 }
      );
    }

    logger.info('History entry converted to trending prompt', {
      historyId: id,
      trendingId: newPrompt.id,
    });

    return NextResponse.json({
      success: true,
      data: newPrompt,
    });
  } catch (error) {
    logger.error('Unexpected error converting to trending', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
