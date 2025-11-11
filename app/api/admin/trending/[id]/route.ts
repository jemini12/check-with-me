import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabase-server';
import { logger } from '@/app/lib/logger';

/**
 * PUT /api/admin/trending/[id]
 * Update an existing trending prompt
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { prompt, cached_result } = body;

    if (!prompt && !cached_result) {
      return NextResponse.json(
        { error: 'At least one field (prompt or cached_result) is required' },
        { status: 400 }
      );
    }

    logger.info('Updating trending prompt', { id, prompt });

    const updates: Record<string, unknown> = {};
    if (prompt) updates.prompt = prompt;
    if (cached_result) updates.cached_result = cached_result;

    const { data, error } = await supabaseServer
      .from('trending_prompts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update trending prompt', error);
      return NextResponse.json(
        { error: 'Failed to update trending prompt' },
        { status: 500 }
      );
    }

    logger.info('Trending prompt updated', { id });
    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Unexpected error updating trending prompt', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/trending/[id]
 * Delete a trending prompt
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    logger.info('Deleting trending prompt', { id });

    const { error } = await supabaseServer
      .from('trending_prompts')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Failed to delete trending prompt', error);
      return NextResponse.json(
        { error: 'Failed to delete trending prompt' },
        { status: 500 }
      );
    }

    logger.info('Trending prompt deleted', { id });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Unexpected error deleting trending prompt', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
