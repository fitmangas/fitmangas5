'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Sparkles, X } from 'lucide-react';

import { analyzeGlobalMarketingDiagnostic } from '@/app/admin/marketing/actions-global-diagnostic';
import { AdvisorMarkdownRenderer } from '@/components/Admin/AdvisorMarkdownRenderer';

const CACHE_MS = 30 * 60 * 1000;
const CACHE_KEY = 'admin-marketing-global-diagnostic-v3';
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

export function MarketingGlobalAiAdvisor() {
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
      const result = await analyzeGlobalMarketingDiagnostic();
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

  const openModal = () => {
    setOpen(true);
    const cached = readCache();
    if (cached) {
      setText(cached);
      return;
    }
    void run(false);
  };

  const modal =
    open && mounted ? (
      <div
        className="kpi-modal-backdrop fixed inset-0 z-[500] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal
        aria-labelledby="marketing-global-advisor-title"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        <div className="kpi-modal-panel relative flex max-h-[92vh] w-[min(90vw,64rem)] max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/50 bg-white/95 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
          <div className="flex items-start justify-between gap-4 border-b border-black/10 px-6 py-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles size={20} style={{ color: TERRACOTTA }} strokeWidth={1.75} aria-hidden />
                <h2 id="marketing-global-advisor-title" className="text-xl font-semibold tracking-tight text-luxury-ink">
                  Diagnostic marketing complet
                </h2>
              </div>
              <p className="mt-1.5 text-xs text-luxury-muted">
                SEO · Analytics · Communication — 5 actions prioritaires + problèmes structurels
              </p>
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
                className="min-h-[48px] w-full max-w-md gap-2 rounded-full px-8 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(196,93,62,0.35)] transition hover:brightness-105 disabled:opacity-60 sm:w-auto"
                style={{ backgroundColor: TERRACOTTA }}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Sparkles size={18} aria-hidden />
                  {loading ? 'Analyse en cours…' : 'Relancer le diagnostic complet'}
                </span>
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-luxury-orange" aria-hidden />
                <p className="mt-4 text-sm text-luxury-muted">Collecte SEO, Analytics et Marketing…</p>
              </div>
            ) : null}

            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p>
            ) : null}

            {showResults && text ? <AdvisorMarkdownRenderer text={text} /> : null}

            {!loading && !showResults && !error ? (
              <p className="text-center text-sm text-luxury-muted">
                Lance le diagnostic pour obtenir un tableau de 5 actions prioritaires et les problèmes structurels détectés.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <div className="rounded-[1.75rem] border border-amber-200/80 bg-[#faf6f0] p-5 shadow-[0_12px_32px_rgba(120,80,20,0.08)] md:p-6">
        <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-900/75">Conseiller IA global</p>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-luxury-muted">
              Diagnostic croisé SEO, trafic GA4, Search Console, Meta Pixel, parrainage et checklist — en un seul clic.
            </p>
          </div>
          <button
            type="button"
            onClick={openModal}
            disabled={loading}
            className="min-h-[52px] w-full shrink-0 gap-2 rounded-full px-8 text-sm font-semibold uppercase tracking-[0.08em] text-white shadow-[0_12px_32px_rgba(196,93,62,0.4)] transition hover:brightness-105 disabled:opacity-60 md:w-auto md:min-w-[280px]"
            style={{ backgroundColor: TERRACOTTA }}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Sparkles size={20} aria-hidden />
              Diagnostic complet (IA)
            </span>
          </button>
        </div>
      </div>

      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
