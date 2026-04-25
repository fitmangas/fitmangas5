'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ArticleProse } from '@/components/Blog/ArticleProse';

export function CalendarDraftStatusModal({
  title,
  description,
  content,
  categoryLabel,
}: {
  title: string;
  description: string | null;
  content: string | null;
  categoryLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-700 underline underline-offset-2"
      >
        draft
      </button>

      {open && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4"
              onClick={() => setOpen(false)}
            >
              <div
                className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-white/40 bg-[#fffdf8] p-6 shadow-2xl sm:p-8"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-4 top-4 rounded-full border border-black/10 bg-white p-1.5 text-luxury-muted hover:text-luxury-ink"
                  aria-label="Fermer l’aperçu du brouillon"
                >
                  <X size={16} />
                </button>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">{categoryLabel}</p>
                <h3 className="mt-2 pr-8 text-3xl font-semibold text-luxury-ink">{title}</h3>
                {description ? <p className="mt-3 text-sm text-luxury-muted">{description}</p> : null}
                <div className="mt-8 border-t border-black/10 pt-6">
                  {content ? <ArticleProse text={content} /> : <p className="text-sm text-luxury-muted">Contenu vide.</p>}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
