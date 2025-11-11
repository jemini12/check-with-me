import { createHash } from 'crypto';
import { supabaseServer } from './supabase-server';
import { logger } from './logger';
import { FactCheckResponse } from './types';

/**
 * Generate SHA256 hash of text for deduplication
 */
export function generateTextHash(text: string): string {
  return createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
}

/**
 * Generate a simple anonymous session ID from IP and user agent
 */
export function generateSessionId(ip: string | null, userAgent: string | null): string {
  const combined = `${ip || 'unknown'}-${userAgent || 'unknown'}`;
  return createHash('sha256').update(combined).digest('hex').substring(0, 16);
}

/**
 * Hash IP address for privacy
 */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

interface LogFactCheckParams {
  originalText: string;
  result: FactCheckResponse;
  responseTimeMs: number;
  sessionId?: string;
  ipHash?: string;
  userAgent?: string;
  isError?: boolean;
  errorMessage?: string;
}

/**
 * Log a fact-check request to the history database
 */
export async function logFactCheck(params: LogFactCheckParams): Promise<void> {
  try {
    const textHash = generateTextHash(params.originalText);

    const { error } = await supabaseServer
      .from('fact_check_history')
      .insert({
        original_text: params.originalText,
        text_hash: textHash,
        result: params.result,
        response_time_ms: params.responseTimeMs,
        session_id: params.sessionId || null,
        ip_hash: params.ipHash || null,
        user_agent: params.userAgent || null,
        is_error: params.isError || false,
        error_message: params.errorMessage || null,
      });

    if (error) {
      logger.error('Failed to log fact-check to history', error);
    } else {
      logger.debug('Fact-check logged to history', {
        textHash,
        responseTimeMs: params.responseTimeMs,
        isError: params.isError,
      });
    }
  } catch (error) {
    logger.error('Unexpected error logging fact-check to history', error);
  }
}

/**
 * Check if a fact-check result exists in history (for caching)
 */
export async function getFromHistory(text: string): Promise<FactCheckResponse | null> {
  try {
    const textHash = generateTextHash(text);

    const { data, error } = await supabaseServer
      .from('fact_check_history')
      .select('result')
      .eq('text_hash', textHash)
      .eq('is_error', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    logger.info('Cache hit from history', { textHash });
    return data.result as FactCheckResponse;
  } catch (error) {
    logger.debug('No cache hit from history');
    return null;
  }
}
