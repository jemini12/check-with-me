import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabase-server';
import { logger } from '@/app/lib/logger';

/**
 * GET /api/share/[id]
 * Retrieves a shared fact-check result
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid share ID format' },
        { status: 400 }
      );
    }

    // Fetch from database
    const { data, error } = await supabaseServer
      .from('shared_checks')
      .select('prompt, cached_result, view_count')
      .eq('id', id)
      .single();

    if (error || !data) {
      logger.warn('Shared check not found', { shareId: id });
      return NextResponse.json(
        { error: 'Share link not found' },
        { status: 404 }
      );
    }

    // Increment view count asynchronously (don't wait)
    void (async () => {
      try {
        await supabaseServer.rpc('increment_share_view', { share_id: id });
        logger.info('Share view count incremented', { shareId: id });
      } catch (err) {
        logger.error('Failed to increment view count', err);
      }
    })();

    logger.info('Shared check retrieved', { shareId: id, viewCount: data.view_count });

    return NextResponse.json({
      prompt: data.prompt,
      result: data.cached_result,
    });
  } catch (error) {
    logger.error('Unexpected error retrieving shared check', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
