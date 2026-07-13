'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { generateSeoArticleDraftAction } from '@/app/admin/blog/actions-article-seo';

export function GenerateSeoArticleButton() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-luxury-primary min-h-[44px] w-full px-4 text-xs sm:w-auto">
        Générer un article SEO (IA)
      </button>
      {open ? (
        <div className="fixed inset-0 z-[500] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6" role="presentation" data-overlay-dismiss onClick={() => !pending && setOpen(false)}>
          <div
            className="w-full max-w-lg rounded-t-3xl border border-white/40 bg-[#fffdf8] p-6 shadow-2xl sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-luxury-ink">Nouvel article brouillon</h2>
            <p className="mt-2 text-sm text-luxury-muted">Indique un thème ou une intention (ex. bienfaits du pilates pour le dos).</p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.12em] text-luxury-soft">
              Thème
              <textarea
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-luxury-ink outline-none ring-orange-200 focus:ring-2"
                placeholder="Ex. pilates pour le dos, mobilité des épaules…"
              />
            </label>
            {err ? <p className="mt-2 text-sm text-red-700">{err}</p> : null}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="min-h-[44px] rounded-full border border-black/10 px-4 text-sm" disabled={pending} onClick={() => setOpen(false)}>
                Annuler
              </button>
              <button
                type="button"
                className="btn-luxury-primary min-h-[44px] px-4 text-sm"
                disabled={pending || theme.trim().length < 4}
                onClick={() => {
                  setErr(null);
                  start(async () => {
                    const r = await generateSeoArticleDraftAction(theme);
                    if (r.ok) {
                      setOpen(false);
                      router.push(`/admin/blog/articles/${r.articleId}/edit`);
                      router.refresh();
                    } else setErr(r.error);
                  });
                }}
              >
                {pending ? 'Génération…' : 'Créer le brouillon'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
