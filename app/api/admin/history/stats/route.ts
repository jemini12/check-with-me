import { NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabase-server';
import { logger } from '@/app/lib/logger';

/**
 * GET /api/admin/history/stats
 * Get analytics/statistics about fact-check history
 */
export async function GET() {
  try {
    logger.info('Fetching history statistics');

    // Total checks
    const { count: totalChecks } = await supabaseServer
      .from('fact_check_history')
      .select('*', { count: 'exact', head: true });

    // Error count
    const { count: errorCount } = await supabaseServer
      .from('fact_check_history')
      .select('*', { count: 'exact', head: true })
      .eq('is_error', true);

    // Unique sessions
    const { data: uniqueSessions } = await supabaseServer
      .from('fact_check_history')
      .select('session_id')
      .not('session_id', 'is', null);

    const uniqueSessionCount = new Set(
      uniqueSessions?.map((s) => s.session_id)
    ).size;

    // Average response time
    const { data: responseTimes } = await supabaseServer
      .from('fact_check_history')
      .select('response_time_ms')
      .not('response_time_ms', 'is', null);

    const avgResponseTime =
      responseTimes && responseTimes.length > 0
        ? Math.round(
            responseTimes.reduce((sum, r) => sum + r.response_time_ms, 0) /
              responseTimes.length
          )
        : 0;

    // Most checked queries (top 10)
    const { data: topQueries } = await supabaseServer
      .from('fact_check_history')
      .select('text_hash, original_text')
      .limit(1000); // Get recent queries

    const queryCounts = new Map<string, { text: string; count: number }>();
    topQueries?.forEach((q) => {
      const existing = queryCounts.get(q.text_hash);
      if (existing) {
        existing.count++;
      } else {
        queryCounts.set(q.text_hash, { text: q.original_text, count: 1 });
      }
    });

    const topQueriesList = Array.from(queryCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Checks by date (last 7 days)
    const { data: recentChecks } = await supabaseServer
      .from('fact_check_history')
      .select('created_at')
      .gte(
        'created_at',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    const checksByDate = new Map<string, number>();
    recentChecks?.forEach((check) => {
      const date = new Date(check.created_at).toISOString().split('T')[0];
      checksByDate.set(date, (checksByDate.get(date) || 0) + 1);
    });

    const checksByDateList = Array.from(checksByDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const stats = {
      totalChecks: totalChecks || 0,
      errorCount: errorCount || 0,
      successCount: (totalChecks || 0) - (errorCount || 0),
      uniqueSessions: uniqueSessionCount,
      avgResponseTimeMs: avgResponseTime,
      topQueries: topQueriesList,
      checksByDate: checksByDateList,
    };

    logger.info('History statistics calculated', stats);
    return NextResponse.json({ data: stats });
  } catch (error) {
    logger.error('Unexpected error fetching statistics', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
