import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabase-server';
import { logger } from '@/app/lib/logger';
import { ShareRequest, ShareResponse } from '@/app/lib/types';

/**
 * POST /api/share
 * Creates a shareable link for a fact-check result
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ShareRequest;

    // Validate request
    if (!body.prompt || typeof body.prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid prompt' },
        { status: 400 }
      );
    }

    if (!body.result || !body.result.original_text || !Array.isArray(body.result.fact_checks)) {
      return NextResponse.json(
        { error: 'Invalid result format' },
        { status: 400 }
      );
    }

    // Insert into database
    const { data, error } = await supabaseServer
      .from('shared_checks')
      .insert({
        prompt: body.prompt,
        cached_result: body.result,
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to create shared check', error);
      return NextResponse.json(
        { error: 'Failed to create share link' },
        { status: 500 }
      );
    }

    // Get the base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                    request.headers.get('origin') ||
                    'http://localhost:3000';

    const shareUrl = `${baseUrl}/?share=${data.id}`;

    logger.info('Share link created', { shareId: data.id });

    const response: ShareResponse = {
      shareId: data.id,
      shareUrl,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Unexpected error creating share link', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
