/** Lecture seule : compare le HTML de 5 articles publiés avant / après sanitizeArticleHtml. */
import { createClient } from '@supabase/supabase-js';

import { sanitizeArticleHtml } from '../../src/lib/blog/sanitize-article-html';


function norm(h: string) {
  return h.replace(/\s+/g, ' ').replace(/\s*\/>/g, '>').replace(/<br>/g, '<br>').trim();
}

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const table = process.argv[2] || 'blog_articles';
  const { data, error } = await sb.from(table).select('*').eq('status', 'published').limit(40);
  if (error) throw error;
  const rows = (data ?? []).filter((r: Record<string, unknown>) => /<\/?[a-z][\s\S]*>/i.test(String(r.content ?? r.content_fr ?? '')));
  const picked = rows.slice(0, 5);
  console.log(`articles publiés lus: ${data?.length ?? 0}, avec HTML: ${rows.length}, comparés: ${picked.length}`);
  for (const r of picked as Record<string, unknown>[]) {
    for (const key of ['content', 'content_fr', 'content_es']) {
      const raw = r[key];
      if (typeof raw !== 'string' || !raw) continue;
      const before = norm(raw);
      const after = norm(sanitizeArticleHtml(raw));
      const same = before === after;
      console.log(`- ${String(r.slug).slice(0, 50)} [${key}] avant=${before.length} après=${after.length} ${same ? 'IDENTIQUE' : 'DIFFÉRENT'}`);
      if (!same) {
        let i = 0;
        while (i < before.length && before[i] === after[i]) i++;
        console.log(`    1re différence @${i}: avant «${before.slice(i, i + 90)}» / après «${after.slice(i, i + 90)}»`);
      }
    }
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
