/**
 * Supabase client-side client
 * Uses anon key for read-only operations from the browser
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Client-side Supabase client with anon access
 * Use this for browser-side operations (reading data)
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
