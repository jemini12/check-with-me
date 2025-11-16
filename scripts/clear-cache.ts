import { supabaseServer } from '../app/lib/supabase-server';

async function clearCache() {
  const textHash = '196315e3a904385128c2531ade0d245f71e50387f4e4f4763273e4e42fdab306';

  const { error } = await supabaseServer
    .from('fact_check_history')
    .delete()
    .eq('text_hash', textHash);

  if (error) {
    console.error('Error deleting cache:', error);
    process.exit(1);
  }

  console.log('Cache cleared for text_hash:', textHash);
  console.log('You can now test "이탈리아가 그리스보다 크다" with the new LLM query generation!');
}

clearCache();
