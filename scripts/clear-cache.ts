import { supabaseServer } from '../app/lib/supabase-server';

async function clearCache() {
  const textHash = '5c609cc14af0c56f8f4fd945f846691833e64a7ca500638cde2150ae51841cc5';

  const { error } = await supabaseServer
    .from('fact_check_history')
    .delete()
    .eq('text_hash', textHash);

  if (error) {
    console.error('Error deleting cache:', error);
    process.exit(1);
  }

  console.log('Cache cleared for text_hash:', textHash);
  console.log('You can now test "파리가 로마보다 작다" with the new fallback query generation!');
}

clearCache();
