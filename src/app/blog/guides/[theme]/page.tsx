import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createAdminClient } from '@/lib/supabase/admin';

const THEMES = {
  respiration: { title: 'Respiration', match: /respir/i },
  'seances-courtes': { title: 'Séances courtes', match: /courte|20 min|quinze|rapide/i },
  progresser: { title: 'Progresser', match: /progress|niveau|avancer/i },
} as const;

type ThemeId = keyof typeof THEMES;

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ theme: string }> }) {
  const { theme } = await params;
  const spec = THEMES[theme as ThemeId];
  if (!spec) return { title: 'Guide' };
  return { title: `Guide ${spec.title}` };
}

export default async function BlogGuidePage({ params }: { params: Promise<{ theme: string }> }) {
  const { theme } = await params;
  const spec = THEMES[theme as ThemeId];
  if (!spec) notFound();

  let articles: Array<{ title_fr: string; slug_fr: string }> = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('blog_articles')
      .select('title_fr, slug_fr, status')
      .eq('status', 'published')
      .limit(80);
    articles = (data ?? [])
      .filter((row) => spec.match.test(String(row.title_fr ?? '')))
      .map((row) => ({ title_fr: String(row.title_fr), slug_fr: String(row.slug_fr) }));
  } catch {
    articles = [];
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C45D3E]">Guide</p>
      <h1 className="mt-2 font-serif text-3xl text-[#2A2420]">{spec.title}</h1>
      <p className="mt-3 text-sm text-[#5A5550]">
        Articles déjà publiés sur ce thème. Aucun article n’a été fusionné ni déplacé.
      </p>
      <ul className="mt-8 space-y-3">
        {articles.map((a) => (
          <li key={String(a.slug_fr)}>
            <Link href={`/blog/${a.slug_fr}`} className="text-[#C45D3E] underline">
              {a.title_fr}
            </Link>
          </li>
        ))}
      </ul>
      {!articles.length ? (
        <p className="mt-6 text-sm text-[#78716C]">Pas encore d’article listé pour ce thème.</p>
      ) : null}
    </main>
  );
}
