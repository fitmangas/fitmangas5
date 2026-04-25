import './load-env-local';

import { createClient } from '@supabase/supabase-js';

type ArticleStatus = 'draft' | 'validated';

type Article = {
  id: string;
  coach_id: string;
  title_fr: string;
  status: ArticleStatus;
  scheduled_publication_at: string;
};

type Validation = {
  id: string;
  article_id: string;
  coach_id: string;
  month_year: string;
  status: 'pending' | 'validated' | 'rejected';
  validated_at: string | null;
  notes: string | null;
  created_at: string;
};

const APPLY = process.argv.includes('--apply');
const TARGET_PER_MONTH = 8;
const SLOT_DAYS = [3, 6, 9, 12, 15, 18, 21, 24];

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function addMonths(base: Date, n: number): Date {
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1, 0, 0, 0, 0));
  d.setUTCMonth(d.getUTCMonth() + n);
  return d;
}

function pickValidation(a: Validation, b: Validation): Validation {
  const rank = { validated: 3, pending: 2, rejected: 1 } as const;
  if (rank[a.status] !== rank[b.status]) return rank[a.status] > rank[b.status] ? a : b;
  return new Date(a.created_at).getTime() >= new Date(b.created_at).getTime() ? a : b;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis.');
    process.exit(1);
  }
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: rows, error } = await admin
    .from('blog_articles')
    .select('id,coach_id,title_fr,status,scheduled_publication_at')
    .in('status', ['draft', 'validated'])
    .order('scheduled_publication_at', { ascending: true });
  if (error) {
    console.error('[blog_articles]', error.message);
    process.exit(1);
  }

  const articles = (rows ?? []) as Article[];
  if (articles.length === 0) {
    console.log('Aucun article draft/validated à normaliser.');
    return;
  }

  const baseDate = new Date(articles[0].scheduled_publication_at);
  const baseMonth = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), 1));

  const planned = articles.map((a, index) => {
    const monthOffset = Math.floor(index / TARGET_PER_MONTH);
    const slot = index % TARGET_PER_MONTH;
    const m = addMonths(baseMonth, monthOffset);
    const oldDate = new Date(a.scheduled_publication_at);
    const hour = oldDate.getUTCHours();
    const minute = oldDate.getUTCMinutes();
    const second = oldDate.getUTCSeconds();
    const day = SLOT_DAYS[slot] ?? 24;
    const targetDate = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), day, hour, minute, second, 0));
    return {
      article: a,
      targetDate,
      targetMonth: monthKey(targetDate),
      oldMonth: monthKey(oldDate),
      changed: targetDate.toISOString() !== oldDate.toISOString(),
    };
  });

  const changedCount = planned.filter((p) => p.changed || p.targetMonth !== p.oldMonth).length;
  const monthCounts = new Map<string, number>();
  for (const p of planned) monthCounts.set(p.targetMonth, (monthCounts.get(p.targetMonth) ?? 0) + 1);

  console.log(`Articles draft/validated analysés: ${articles.length}`);
  console.log(`Articles à replanifier: ${changedCount}`);
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log('Répartition cible:', JSON.stringify(Array.from(monthCounts.entries())));

  for (const p of planned.slice(0, 10)) {
    console.log(
      `- ${p.article.title_fr} | ${p.article.scheduled_publication_at} -> ${p.targetDate.toISOString()} (${p.targetMonth})`,
    );
  }

  if (!APPLY) return;

  // 1) update article schedule
  for (const p of planned) {
    if (!p.changed) continue;
    const { error: updErr } = await admin
      .from('blog_articles')
      .update({ scheduled_publication_at: p.targetDate.toISOString() })
      .eq('id', p.article.id);
    if (updErr) {
      console.error(`[update schedule] ${p.article.id}`, updErr.message);
      process.exit(1);
    }
  }

  // 2) normalize validation rows (one row per article with target month)
  const articleIds = planned.map((p) => p.article.id);
  const { data: validations, error: valErr } = await admin
    .from('admin_article_validations')
    .select('id,article_id,coach_id,month_year,status,validated_at,notes,created_at')
    .in('article_id', articleIds);
  if (valErr) {
    console.error('[admin_article_validations]', valErr.message);
    process.exit(1);
  }

  const byArticle = new Map<string, Validation[]>();
  for (const v of (validations ?? []) as Validation[]) {
    const list = byArticle.get(v.article_id) ?? [];
    list.push(v);
    byArticle.set(v.article_id, list);
  }

  for (const p of planned) {
    const existing = byArticle.get(p.article.id) ?? [];
    let seed: Validation | null = null;
    for (const v of existing) {
      seed = seed ? pickValidation(seed, v) : v;
    }

    // wipe existing rows for this article, then upsert one normalized row
    if (existing.length > 0) {
      const { error: delErr } = await admin.from('admin_article_validations').delete().eq('article_id', p.article.id);
      if (delErr) {
        console.error(`[validation delete] ${p.article.id}`, delErr.message);
        process.exit(1);
      }
    }

    const payload = {
      article_id: p.article.id,
      coach_id: seed?.coach_id ?? p.article.coach_id,
      month_year: p.targetMonth,
      status: seed?.status ?? 'pending',
      validated_at: seed?.validated_at ?? null,
      notes: seed?.notes ?? null,
    };
    const { error: insErr } = await admin.from('admin_article_validations').insert(payload);
    if (insErr) {
      console.error(`[validation insert] ${p.article.id}`, insErr.message);
      process.exit(1);
    }
  }

  console.log('✅ Normalisation des dates et validations terminée.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
