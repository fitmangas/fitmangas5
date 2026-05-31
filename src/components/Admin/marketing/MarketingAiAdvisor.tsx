'use client';

import { useCallback, useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import {
  analyzeMarketing,
  analyzeSEO,
  analyzeTraffic,
  type MarketingAdvisorInput,
  type SeoAdvisorInput,
  type TrafficAdvisorInput,
} from '@/app/admin/marketing/actions-ai-advisor';
import { fetchGaDashboardBundle, fetchGaRealtimeUsers } from '@/app/admin/marketing/actions-analytics';
import { fetchSearchConsoleBundle } from '@/app/admin/marketing/actions-search-console';

const CACHE_MS = 5 * 60 * 1000;

type CacheEntry = { text: string; at: number };
const advisorCache = new Map<string, CacheEntry>();

function cacheKey(id: string, payload: unknown) {
  return `${id}:${JSON.stringify(payload)}`;
}

function readCache(key: string): string | null {
  const hit = advisorCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_MS) {
    advisorCache.delete(key);
    return null;
  }
  return hit.text;
}

function writeCache(key: string, text: string) {
  advisorCache.set(key, { text, at: Date.now() });
}

function AdvisorMarkdown({ text }: { text: string }) {
  return (
    <div className="advisor-markdown space-y-3 text-sm leading-relaxed text-luxury-ink normal-case [&_strong]:font-semibold [&_strong]:text-luxury-ink">
      <ReactMarkdown
        components={{
          h2: ({ children }) => (
            <h2 className="mt-1 text-base font-bold text-luxury-ink first:mt-0 md:text-lg">{children}</h2>
          ),
          h3: ({ children }) => <h3 className="mt-4 text-sm font-semibold text-luxury-ink">{children}</h3>,
          ul: ({ children }) => <ul className="my-2 ml-5 list-disc space-y-2">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 ml-5 list-decimal space-y-3">{children}</ol>,
          li: ({ children }) => <li className="text-luxury-muted">{children}</li>,
          p: ({ children }) => <p className="my-1 text-luxury-muted">{children}</p>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}


function Box({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}

function AdvisorShell({
  buildAndAnalyze,
}: {
  buildAndAnalyze: () => Promise<
    | { ok: true; text: string; cachePayload: unknown }
    | { ok: false; error: string }
  >;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [visible, setVisible] = useState(false);

  const run = useCallback(async () => {
    setError(null);
    setLoading(true);
    setVisible(true);
    setCollapsed(false);
    try {
      const built = await buildAndAnalyze();
      if (!built.ok) {
        setError(built.error);
        setText(null);
        return;
      }
      setText(built.text);
    } finally {
      setLoading(false);
    }
  }, [buildAndAnalyze]);

  return (
    <Box className="rounded-[1.75rem] border border-amber-200/70 bg-[#faf6f0] p-4 shadow-[0_10px_28px_rgba(120,80,20,0.06)] md:p-5">
      <Box className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Box>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-900/70">Conseiller IA</p>
          <p className="mt-1 text-xs text-luxury-muted md:text-sm">
            Diagnostic et actions basés sur les données affichées dans cet onglet.
          </p>
        </Box>
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          className="btn-luxury-primary min-h-[44px] w-full gap-2 px-5 py-2.5 text-sm normal-case tracking-normal disabled:opacity-60 sm:w-auto"
        >
          <Sparkles size={18} aria-hidden />
          {loading ? 'Analyse en cours…' : 'Analyser et conseiller (IA)'}
        </button>
      </Box>

      {loading ? <p className="mt-4 animate-pulse text-sm text-luxury-muted">Analyse en cours…</p> : null}

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-900">{error}</p>
      ) : null}

      {visible && text && !loading ? (
        <Box className="mt-4">
          <Box className="mb-3 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-amber-300/80 bg-white/80 px-3 py-2 text-xs font-semibold text-amber-950"
            >
              {collapsed ? (
                <>
                  <ChevronDown size={16} /> Développer
                </>
              ) : (
                <>
                  <ChevronUp size={16} /> Réduire
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setVisible(false);
                setText(null);
              }}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-amber-300/80 bg-white/80 px-3 py-2 text-xs font-semibold text-amber-950"
            >
              <X size={16} /> Fermer
            </button>
          </Box>
          {!collapsed ? (
            <Box className="rounded-2xl border border-amber-100 bg-white/60 p-4 md:p-5">
              <AdvisorMarkdown text={text} />
            </Box>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}

type SeoProps = {
  variant: 'seo';
  googleConnected: boolean;
  articleScores: SeoAdvisorInput['articleScores'];
  metaPages: SeoAdvisorInput['metaPages'];
  publishedCount: number;
  scheduledCount: number;
};

type TrafficProps = {
  variant: 'traffic';
  googleConnected: boolean;
  blogTopArticles: TrafficAdvisorInput['blogTopArticles'];
};

type MarketingProps = {
  variant: 'marketing';
  marketingInput: MarketingAdvisorInput;
};

export function MarketingAiAdvisor(props: SeoProps | TrafficProps | MarketingProps) {
  if (props.variant === 'seo') {
    return <SeoAdvisor {...props} />;
  }
  if (props.variant === 'traffic') {
    return <TrafficAdvisor {...props} />;
  }
  return <MarketingAdvisorSection {...props} />;
}

function SeoAdvisor({
  googleConnected,
  articleScores,
  metaPages,
  publishedCount,
  scheduledCount,
}: SeoProps) {
  const buildAndAnalyze = useCallback(async () => {
    let searchConsole: SeoAdvisorInput['searchConsole'] = { available: false };
    if (googleConnected) {
      const r = await fetchSearchConsoleBundle();
      if (!r.ok) {
        searchConsole = { available: false, error: r.error };
      } else {
        searchConsole = {
          available: true,
          queries: r.queries.slice(0, 15),
          topPages: r.topPages.slice(0, 10),
          indexing: r.indexing,
          crawlErrors: r.crawlErrors,
        };
      }
    }
    const data: SeoAdvisorInput = {
      articleScores,
      metaPages,
      publishedCount,
      scheduledCount,
      searchConsole,
    };
    const key = cacheKey('seo', data);
    const cached = readCache(key);
    if (cached) return { ok: true as const, text: cached, cachePayload: data };
    const result = await analyzeSEO(data);
    if (!result.ok) return result;
    writeCache(key, result.text);
    return { ok: true as const, text: result.text, cachePayload: data };
  }, [googleConnected, articleScores, metaPages, publishedCount, scheduledCount]);

  return <AdvisorShell buildAndAnalyze={buildAndAnalyze} />;
}

function TrafficAdvisor({ googleConnected, blogTopArticles }: TrafficProps) {
  const buildAndAnalyze = useCallback(async () => {
    let realtimeUsers: number | null = null;
    let gaAvailable = false;
    let gaError: string | undefined;
    let pageViews: TrafficAdvisorInput['pageViews'] = [];
    let topPages: TrafficAdvisorInput['topPages'] = [];
    let trafficSources: TrafficAdvisorInput['trafficSources'] = [];
    let countries: TrafficAdvisorInput['countries'] = [];
    let conversion: TrafficAdvisorInput['conversion'] = null;

    if (googleConnected) {
      const [rt, bundle] = await Promise.all([fetchGaRealtimeUsers(), fetchGaDashboardBundle()]);
      if (rt.ok) realtimeUsers = rt.value;
      if (!bundle.ok) {
        gaError = bundle.error;
      } else {
        gaAvailable = true;
        pageViews = bundle.pageViews;
        topPages = bundle.topPages;
        trafficSources = bundle.trafficSources;
        countries = bundle.countries;
        conversion = bundle.conversion;
      }
    }

    const data: TrafficAdvisorInput = {
      realtimeUsers,
      gaAvailable,
      gaError,
      pageViews,
      topPages,
      trafficSources,
      countries,
      conversion,
      blogTopArticles,
    };
    const key = cacheKey('traffic', data);
    const cached = readCache(key);
    if (cached) return { ok: true as const, text: cached, cachePayload: data };
    const result = await analyzeTraffic(data);
    if (!result.ok) return result;
    writeCache(key, result.text);
    return { ok: true as const, text: result.text, cachePayload: data };
  }, [googleConnected, blogTopArticles]);

  return <AdvisorShell buildAndAnalyze={buildAndAnalyze} />;
}

function MarketingAdvisorSection({ marketingInput }: MarketingProps) {
  const buildAndAnalyze = useCallback(async () => {
    const key = cacheKey('marketing', marketingInput);
    const cached = readCache(key);
    if (cached) return { ok: true as const, text: cached, cachePayload: marketingInput };
    const result = await analyzeMarketing(marketingInput);
    if (!result.ok) return result;
    writeCache(key, result.text);
    return { ok: true as const, text: result.text, cachePayload: marketingInput };
  }, [marketingInput]);

  return <AdvisorShell buildAndAnalyze={buildAndAnalyze} />;
}
