import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabase-server';
import { logger } from '@/app/lib/logger';

/**
 * GET /api/admin/history
 * Fetch fact-check history with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const searchQuery = searchParams.get('search') || '';
    const isError = searchParams.get('is_error');
    const sessionId = searchParams.get('session_id');

    logger.info('Fetching fact-check history', { limit, offset, searchQuery });

    let query = supabaseServer
      .from('fact_check_history')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (searchQuery) {
      query = query.ilike('original_text', `%${searchQuery}%`);
    }

    if (isError !== null && isError !== undefined) {
      query = query.eq('is_error', isError === 'true');
    }

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch history', error);
      return NextResponse.json(
        { error: 'Failed to fetch history' },
        { status: 500 }
      );
    }

    logger.info('History fetched', { count: data?.length || 0, total: count });
    return NextResponse.json({ data: data || [], total: count || 0 });
  } catch (error) {
    logger.error('Unexpected error fetching history', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
