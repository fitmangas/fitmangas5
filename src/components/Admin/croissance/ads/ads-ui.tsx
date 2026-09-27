'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { ChevronDown, Info, Plus } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

import { acq } from '@/components/acquisition/tokens';
import {
  ADS_GLOSSARY,
  type AdsUiLang,
  type GlossaryKey,
  glossaryText,
} from '@/lib/acquisition/ads/ads-glossary';

export const adsTone = {
  good: '#15803d',
  goodSoft: 'rgba(21,128,61,0.10)',
  bad: '#b91c1c',
  badSoft: 'rgba(185,28,28,0.08)',
  warn: '#b45309',
  warnSoft: 'rgba(245,158,11,0.14)',
  sand: '#D9A48F',
  clay: '#8C4A33',
  sage: '#8A9A7B',
  ink2: '#4A4541',
};

/** Palette séquentielle terracotta → sable, pour barres et anneaux. */
export const ADS_CHART_PALETTE = ['#C45D3E', '#D9826A', '#E7AE98', '#8C4A33', '#B9A89A', '#EBD9CC', '#6F625A'];

export function num(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('fr-FR');
}

export function compact(n: number | null | undefined): string {
  if (n == null) return '—';
  if (Math.abs(n) >= 10_000) return `${(n / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k`;
  return n.toLocaleString('fr-FR');
}

export function eur(cents: number | null | undefined): string {
  if (cents == null) return '—';
  return `${(cents / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
}

export function pct(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: digits })} %`;
}

export function shortDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d);
}

export function AdsCard({
  eyebrow,
  title,
  subtitle,
  icon,
  right,
  children,
  testId,
  padded = true,
  tone = 'default',
}: {
  eyebrow?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  testId?: string;
  padded?: boolean;
  tone?: 'default' | 'warm' | 'ink';
}) {
  const bg =
    tone === 'ink'
      ? 'linear-gradient(160deg,#2A2521 0%,#1A1714 100%)'
      : tone === 'warm'
        ? 'linear-gradient(160deg,rgba(196,93,62,0.10) 0%,#FFFAF5 55%,#FFFFFF 100%)'
        : 'linear-gradient(165deg,#FFFFFF 0%,#FFFAF5 100%)';
  const dark = tone === 'ink';
  return (
    <section
      data-testid={testId}
      className="overflow-hidden rounded-[1.75rem] border"
      style={{ borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(232,223,212,0.9)', boxShadow: acq.shadowCard, background: bg }}
    >
      {title || eyebrow ? (
        <header className={`flex items-start justify-between gap-3 ${padded ? 'px-5 pt-5 sm:px-6 sm:pt-6' : 'px-5 pt-5'}`}>
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: acq.terracotta }}>
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h3 className="mt-1 font-serif text-xl font-semibold tracking-tight sm:text-[1.4rem]" style={{ color: dark ? '#FFFAF5' : acq.ink }}>
                {title}
              </h3>
            ) : null}
            {subtitle ? (
              <p className="mt-1 max-w-2xl text-sm leading-relaxed" style={{ color: dark ? 'rgba(255,250,245,0.7)' : acq.muted }}>
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {right}
            {icon ? (
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: dark ? 'rgba(196,93,62,0.25)' : acq.terracottaSoft, color: acq.terracotta }}>
                {icon}
              </span>
            ) : null}
          </div>
        </header>
      ) : null}
      <div className={padded ? 'px-5 pb-5 pt-4 sm:px-6 sm:pb-6' : ''}>{children}</div>
    </section>
  );
}

export function Sparkline({ values, color = acq.terracotta, height = 36 }: { values: Array<number | null>; color?: string; height?: number }) {
  const data = values.map((v, i) => ({ i, v: v ?? 0 }));
  if (data.length < 2) return <div style={{ height }} />;
  const id = `spark-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <div style={{ height }} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.8} fill={`url(#${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DeltaBadge({ delta, invert = false }: { delta: number | null; invert?: boolean }) {
  if (delta == null) {
    return (
      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: acq.warmBeige, color: acq.muted }}>
        —
      </span>
    );
  }
  const up = delta >= 0;
  const good = invert ? !up : up;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
      style={{ backgroundColor: good ? adsTone.goodSoft : adsTone.badSoft, color: good ? adsTone.good : adsTone.bad }}
    >
      {up ? '▲' : '▼'} {Math.abs(delta).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} %
    </span>
  );
}

export function KpiTile({
  label,
  value,
  delta,
  invertDelta,
  hint,
  spark,
  active,
  onClick,
  testId,
  big,
}: {
  label: string;
  value: string;
  delta?: number | null;
  invertDelta?: boolean;
  hint?: string;
  spark?: Array<number | null>;
  active?: boolean;
  onClick?: () => void;
  testId?: string;
  big?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      data-testid={testId}
      className="group flex min-w-0 flex-col rounded-[1.25rem] border p-3.5 text-left transition sm:p-4"
      style={{
        borderColor: active ? acq.terracotta : acq.warmBeigeDeep,
        backgroundColor: active ? 'rgba(196,93,62,0.06)' : '#fff',
        boxShadow: active ? '0 0 0 3px rgba(196,93,62,0.12)' : undefined,
      }}
    >
      <p className="text-[10px] font-bold uppercase leading-tight tracking-[0.1em]" style={{ color: acq.muted }}>
        {label}
      </p>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className={`font-serif font-semibold tabular-nums tracking-tight ${big ? 'text-3xl sm:text-[2.1rem]' : 'text-2xl'}`} style={{ color: acq.ink }}>
          {value}
        </p>
        {delta !== undefined ? <DeltaBadge delta={delta} invert={invertDelta} /> : null}
      </div>
      {hint ? (
        <p className={`mt-0.5 text-[11px] leading-snug ${spark ? 'hidden sm:line-clamp-2' : 'line-clamp-3'}`} style={{ color: acq.mutedLight }}>
          {hint}
        </p>
      ) : null}
      {spark ? (
        <div className="mt-2">
          <Sparkline values={spark} color={active ? acq.terracotta : '#D9826A'} />
        </div>
      ) : null}
    </Tag>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  testId,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  testId?: string;
}) {
  return (
    <div className="inline-flex rounded-full border p-1" style={{ borderColor: acq.warmBeigeDeep, backgroundColor: '#fff' }} data-testid={testId} role="tablist">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={testId ? `${testId}-${o.id}` : undefined}
            onClick={() => onChange(o.id)}
            className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
            style={{ backgroundColor: active ? acq.ink : 'transparent', color: active ? '#fff' : acq.muted }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Collapsible({
  title,
  meta,
  children,
  defaultOpen = false,
  testId,
}: {
  title: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  testId?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-[1.25rem] border bg-white" style={{ borderColor: acq.warmBeigeDeep }} data-testid={testId}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        data-testid={testId ? `${testId}-toggle` : undefined}
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold" style={{ color: acq.ink }}>
            {title}
          </span>
          {meta ? (
            <span className="mt-0.5 block text-xs" style={{ color: acq.muted }}>
              {meta}
            </span>
          ) : null}
        </span>
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: acq.warmBeigeDeep, color: acq.ink }} aria-hidden>
          {open ? <ChevronDown size={16} className="rotate-180" /> : <Plus size={16} />}
        </span>
      </button>
      {open ? <div className="border-t px-4 py-4" style={{ borderColor: acq.warmBeigeDeep }}>{children}</div> : null}
    </div>
  );
}

export function HBar({ label, value, pctValue, color = acq.terracotta, right }: { label: string; value: string; pctValue: number; color?: string; right?: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="truncate font-semibold" style={{ color: acq.ink }}>
          {label}
        </span>
        <span className="shrink-0 tabular-nums" style={{ color: acq.muted }}>
          {value}
          {right}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full" style={{ backgroundColor: acq.warmBeige }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, pctValue))}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

const LANG_KEY = 'fitmangas-ads-ui-lang';

export function useAdsUiLang(): [AdsUiLang, (lang: AdsUiLang) => void] {
  const [lang, setLang] = useState<AdsUiLang>('fr');
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_KEY);
      if (saved === 'es' || saved === 'fr') setLang(saved);
    } catch {
      /* ignore */
    }
  }, []);
  function persist(next: AdsUiLang) {
    setLang(next);
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
  }
  return [lang, persist];
}

/** Petit « i » à côté d’un terme anglais obligatoire. */
export function AdsTermHint({
  term,
  lang,
  children,
}: {
  term: GlossaryKey;
  lang: AdsUiLang;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const entry = ADS_GLOSSARY[term];
  return (
    <span className="relative inline-flex items-center gap-0.5">
      {children ?? <span>{entry.short}</span>}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={lang === 'es' ? `¿Qué significa ${entry.short}?` : `Que signifie ${entry.short} ?`}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold leading-none"
        style={{ backgroundColor: acq.terracottaSoft, color: acq.terracotta }}
        data-testid={`ads-term-${term}`}
      >
        <Info size={10} strokeWidth={2.6} />
      </button>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className="absolute left-0 top-[140%] z-30 w-64 rounded-2xl border px-3 py-2 text-left text-[11px] font-normal leading-relaxed shadow-lg sm:w-72"
          style={{ borderColor: acq.warmBeigeDeep, backgroundColor: '#fff', color: acq.ink, boxShadow: acq.shadowCard }}
        >
          <span className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: acq.terracotta }}>
            {entry.short}
          </span>
          {glossaryText(term, lang)}
        </span>
      ) : null}
    </span>
  );
}

export function AdsLangSwitch({ lang, onChange }: { lang: AdsUiLang; onChange: (l: AdsUiLang) => void }) {
  return (
    <div className="inline-flex rounded-full border p-0.5" style={{ borderColor: acq.warmBeigeDeep, backgroundColor: '#fff' }} data-testid="ads-lang-switch">
      {(['fr', 'es'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
          style={{ backgroundColor: lang === l ? acq.ink : 'transparent', color: lang === l ? '#fff' : acq.muted }}
          data-testid={`ads-lang-${l}`}
        >
          {l === 'fr' ? 'FR' : 'ES'}
        </button>
      ))}
    </div>
  );
}

export function SourceTag({ kind }: { kind: 'invisible' | 'visuel' }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
      style={
        kind === 'invisible'
          ? { backgroundColor: acq.ink, color: '#FFFAF5' }
          : { backgroundColor: acq.terracottaSoft, color: acq.terracotta }
      }
    >
      {kind === 'invisible' ? 'Chiffre invisible' : 'Donnée visuelle'}
    </span>
  );
}
