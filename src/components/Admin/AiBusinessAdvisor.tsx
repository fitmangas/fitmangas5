'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Sparkles, X } from 'lucide-react';

import { analyzeBusiness } from '@/app/admin/actions-ai-business';
import { AdvisorMarkdownRenderer } from '@/components/Admin/AdvisorMarkdownRenderer';

const CACHE_MS = 30 * 60 * 1000;
const CACHE_KEY = 'admin-business-advisor-v3';
const TERRACOTTA = '#C45D3E';

type CacheEntry = { text: string; at: number };

function readCache(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (Date.now() - parsed.at > CACHE_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.text;
  } catch {
    return null;
  }
}

function writeCache(text: string) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ text, at: Date.now() } satisfies CacheEntry));
  } catch {
    /* ignore */
  }
}

export function AiBusinessAdvisor() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);

  const showResults = Boolean(text && !loading);

  const run = useCallback(async (force = false) => {
    setError(null);
    setLoading(true);
    try {
      if (!force) {
        const cached = readCache();
        if (cached) {
          setText(cached);
          return;
        }
      } else if (typeof window !== 'undefined') {
        sessionStorage.removeItem(CACHE_KEY);
      }
      const result = await analyzeBusiness();
      if (!result.ok) {
        setError(result.error);
        setText(null);
        return;
      }
      writeCache(result.text);
      setText(result.text);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const modal =
    open && mounted ? (
      <div
        className="kpi-modal-backdrop fixed inset-0 z-[500] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal
        aria-labelledby="ai-business-advisor-title"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        <div className="kpi-modal-panel relative flex max-h-[92vh] w-[min(90vw,64rem)] max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/50 bg-white/95 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
          <div className="flex items-start justify-between gap-4 border-b border-black/10 px-6 py-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles size={20} style={{ color: TERRACOTTA }} strokeWidth={1.75} aria-hidden />
                <h2 id="ai-business-advisor-title" className="text-xl font-semibold tracking-tight text-luxury-ink">
                  Ton conseiller business
                </h2>
              </div>
              <p className="mt-1.5 text-xs text-luxury-muted">5 actions prioritaires + alertes structurelles</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-full border border-black/10 bg-white p-2 text-luxury-ink transition hover:bg-black/5"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-5">
            <div className="flex justify-center pb-6">
              <button
                type="button"
                onClick={() => void run(true)}
                disabled={loading}
                className="btn-luxury-primary min-h-[44px] gap-2 px-6 disabled:opacity-60"
              >
                <Sparkles size={18} aria-hidden />
                {loading ? 'Analyse en cours…' : 'Analyser mon business'}
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-luxury-orange" aria-hidden />
                <p className="mt-4 text-sm text-luxury-muted">Analyse en cours…</p>
              </div>
            ) : null}

            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p>
            ) : null}

            {showResults && text ? <AdvisorMarkdownRenderer text={text} /> : null}

            {!loading && !showResults && !error ? (
              <p className="text-center text-sm text-luxury-muted">
                Lance une analyse pour obtenir un tableau de 5 actions prioritaires et les problèmes structurels détectés.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          const cached = readCache();
          if (cached) setText(cached);
        }}
        title="Conseiller IA"
        aria-label="Conseiller IA"
        className="group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/80 bg-gradient-to-br from-white to-[#F5F0EB] shadow-[0_8px_20px_rgba(29,29,31,0.1)] transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-luxury-orange/40 focus-visible:ring-offset-2"
      >
        <Sparkles size={22} style={{ color: TERRACOTTA }} strokeWidth={1.75} aria-hidden />
        <span className="pointer-events-none absolute -bottom-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-luxury-ink shadow-md group-hover:block">
          Conseiller IA
        </span>
      </button>

      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
