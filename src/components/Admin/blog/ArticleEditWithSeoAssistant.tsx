'use client';

import { useCallback, useState, useTransition } from 'react';
import Link from 'next/link';
import { PanelRightOpen, Sparkles, X } from 'lucide-react';

import { analyzeArticleSeoAction } from '@/app/admin/blog/actions-article-seo';

type Article = {
  id: string;
  title_fr: string;
  description_fr: string | null;
  content_fr: string;
  meta_description_fr: string | null;
  seo_keywords: string | null;
  slug_fr: string;
  status: string;
};

function SeoPanelContent({
  seoLoading,
  seoResult,
  onAnalyze,
  onApply,
}: {
  seoLoading: boolean;
  seoResult: {
    keywords: string[];
    score: number;
    title_suggestion: string;
    meta_description: string;
    content_advice: string;
  } | null;
  onAnalyze: () => void;
  onApply: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className="btn-luxury-gold w-full px-4 py-3 text-sm normal-case tracking-normal"
        disabled={seoLoading}
        onClick={onAnalyze}
      >
        {seoLoading ? 'Analyse…' : 'Analyser le SEO'}
      </button>
      {seoResult ? (
        <div className="mt-4 space-y-3 text-sm text-luxury-muted">
          <p>
            <span className="font-semibold text-luxury-ink">Score estimé :</span> {seoResult.score}/100
          </p>
          <p>
            <span className="font-semibold text-luxury-ink">Mots-clés :</span> {seoResult.keywords.join(', ')}
          </p>
          <p>
            <span className="font-semibold text-luxury-ink">Titre suggéré :</span> {seoResult.title_suggestion}
          </p>
          <p>
            <span className="font-semibold text-luxury-ink">Meta suggérée :</span> {seoResult.meta_description}
          </p>
          <p>
            <span className="font-semibold text-luxury-ink">Conseils :</span> {seoResult.content_advice}
          </p>
          <button type="button" className="mt-2 w-full rounded-full border border-orange-300 bg-white py-3 text-sm font-semibold text-orange-900" onClick={onApply}>
            Appliquer les suggestions
          </button>
        </div>
      ) : null}
    </>
  );
}

export function ArticleEditWithSeoAssistant({ article }: { article: Article }) {
  const [title, setTitle] = useState(article.title_fr);
  const [description, setDescription] = useState(article.description_fr ?? '');
  const [content, setContent] = useState(article.content_fr);
  const [meta, setMeta] = useState(article.meta_description_fr ?? '');
  const [keywords, setKeywords] = useState(article.seo_keywords ?? '');
  const [slug, setSlug] = useState(article.slug_fr);
  const [saved, setSaved] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const [panelOpen, setPanelOpen] = useState(false);
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoResult, setSeoResult] = useState<{
    keywords: string[];
    score: number;
    title_suggestion: string;
    meta_description: string;
    content_advice: string;
  } | null>(null);
  const slugLocked = article.status === 'published';

  const save = useCallback(() => {
    setErr(null);
    setSaved(null);
    start(async () => {
      const res = await fetch(`/api/admin/blog/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title_fr: title,
          description_fr: description,
          content_fr: content,
          meta_description_fr: meta,
          seo_keywords: keywords,
          ...(slugLocked ? {} : { slug_fr: slug }),
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setErr(json.error ?? 'Erreur enregistrement');
        return;
      }
      setSaved('Enregistré');
    });
  }, [article.id, title, description, content, meta, keywords, slug, slugLocked]);

  async function runSeo() {
    setSeoLoading(true);
    setSeoResult(null);
    try {
      const r = await analyzeArticleSeoAction({ title, contentHtml: content });
      if (r.ok) {
        setSeoResult({
          keywords: r.keywords,
          score: r.score,
          title_suggestion: r.title_suggestion,
          meta_description: r.meta_description,
          content_advice: r.content_advice,
        });
      } else setErr(r.error);
    } finally {
      setSeoLoading(false);
    }
  }

  function applySuggestions() {
    if (!seoResult) return;
    if (seoResult.title_suggestion) setTitle(seoResult.title_suggestion);
    if (seoResult.meta_description) setMeta(seoResult.meta_description);
    if (seoResult.keywords.length) setKeywords(seoResult.keywords.join(', '));
  }

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/admin/blog/validation" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-muted hover:text-luxury-ink">
          ← Validation
        </Link>
        <button
          type="button"
          className="btn-luxury-gold inline-flex min-h-[44px] items-center justify-center gap-2 px-4 text-xs normal-case tracking-normal lg:hidden"
          onClick={() => setPanelOpen(true)}
        >
          <PanelRightOpen size={18} /> Assistant SEO
        </button>
      </div>

      <h1 className="hero-signature-title mt-6 text-3xl text-luxury-ink">Édition article</h1>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-luxury-soft">
            Titre (FR)
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm" />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-luxury-soft">
            Slug FR
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={slugLocked}
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 font-mono text-xs disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500"
            />
            {slugLocked ? (
              <span className="mt-2 block text-[11px] normal-case leading-4 tracking-normal text-luxury-muted">
                Slug verrouillé : cet article est publié, son URL Google ne doit pas changer.
              </span>
            ) : null}
          </label>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-luxury-soft">
            Chapô / description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm" />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-luxury-soft">
            Contenu HTML
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={18} className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 font-mono text-xs leading-relaxed" />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-luxury-soft">
            Meta description
            <textarea value={meta} onChange={(e) => setMeta(e.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm" />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-luxury-soft">
            Mots-clés SEO
            <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm" />
          </label>
          {err ? <p className="text-sm text-red-700">{err}</p> : null}
          {saved ? <p className="text-sm text-emerald-700">{saved}</p> : null}
          <button type="button" className="btn-luxury-primary min-h-[44px] px-5 text-sm" disabled={pending} onClick={() => save()}>
            {pending ? '…' : 'Enregistrer'}
          </button>
        </div>

        <aside className="hidden w-full max-w-md shrink-0 flex-col rounded-2xl border border-black/10 bg-[#fffdf8] p-5 shadow-md lg:flex">
          <p className="inline-flex items-center gap-2 border-b border-black/10 pb-3 text-sm font-semibold text-luxury-ink">
            <Sparkles size={18} className="text-orange-600" /> Assistant SEO
          </p>
          <div className="mt-4">
            <SeoPanelContent seoLoading={seoLoading} seoResult={seoResult} onAnalyze={() => void runSeo()} onApply={applySuggestions} />
          </div>
        </aside>
      </div>

      {panelOpen ? (
        <div className="fixed inset-0 z-[500] flex lg:hidden" role="dialog" aria-modal="true" aria-label="Assistant SEO">
          <button type="button" className="absolute inset-0 bg-black/45" aria-label="Fermer" onClick={() => setPanelOpen(false)} />
          <div className="relative ml-auto flex h-full w-full max-w-md flex-col border-l border-black/10 bg-[#fffdf8] shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-luxury-ink">
                <Sparkles size={18} className="text-orange-600" /> Assistant SEO
              </p>
              <button type="button" className="rounded-full p-2 text-luxury-muted hover:bg-black/5" onClick={() => setPanelOpen(false)} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <SeoPanelContent seoLoading={seoLoading} seoResult={seoResult} onAnalyze={() => void runSeo()} onApply={applySuggestions} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
