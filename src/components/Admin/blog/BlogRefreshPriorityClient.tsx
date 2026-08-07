'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';

import {
  enrichPublishedArticleAction,
  enrichPublishedArticlesBatchAction,
} from '@/app/admin/blog/actions-enrich-article';
import type { BlogRefreshPriorityItem } from '@/lib/blog/seo-refresh-priority';
import { BLOG_SHORT_WORDS_THRESHOLD, BLOG_TARGET_WORDS_MAX, BLOG_TARGET_WORDS_MIN } from '@/lib/blog/blog-content-guards';

type Props = {
  items: BlogRefreshPriorityItem[];
  gscAvailable: boolean;
};

function zoneBadge(zone: BlogRefreshPriorityItem['lengthZone']) {
  if (zone === 'too_short') return 'bg-[#f4d4c8] text-[#7a2e1a]';
  if (zone === 'below_ideal') return 'bg-amber-100 text-amber-950';
  if (zone === 'ideal') return 'bg-emerald-50 text-emerald-900';
  return 'bg-stone-100 text-stone-700';
}

function zoneLabel(zone: BlogRefreshPriorityItem['lengthZone']) {
  if (zone === 'too_short') return 'Trop court';
  if (zone === 'below_ideal') return 'Sous idéal';
  if (zone === 'ideal') return 'Zone idéale';
  return 'Long';
}

export function BlogRefreshPriorityClient({ items, gscAvailable }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [batchSize, setBatchSize] = useState(3);
  const [log, setLog] = useState<string[]>([]);
  const [pending, start] = useTransition();

  const topUrgent = useMemo(() => items.slice(0, batchSize).map((item) => item.id), [items, batchSize]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 5)));
  }

  function selectTopN() {
    setSelected(topUrgent);
  }

  function runUnit(id: string) {
    start(async () => {
      const result = await enrichPublishedArticleAction(id);
      if (result.ok) {
        setLog((prev) => [
          `OK ${id.slice(0, 8)}… : ${result.wordsBefore}→${result.wordsAfter} mots, réécriture ${(result.rewriteRatio * 100).toFixed(0)}% (${result.provider}/${result.model})`,
          ...prev,
        ]);
      } else {
        setLog((prev) => [
          `ÉCHEC ${id.slice(0, 8)}… : ${result.error}${result.rewriteRatio != null ? ` (Δ ${(result.rewriteRatio * 100).toFixed(0)}%)` : ''}`,
          ...prev,
        ]);
      }
    });
  }

  function runBatch() {
    const ids = selected.length > 0 ? selected : topUrgent;
    start(async () => {
      const result = await enrichPublishedArticlesBatchAction({ articleIds: ids, limit: batchSize });
      const lines = result.results.map((row) => {
        if (row.ok) {
          return `OK ${row.articleId.slice(0, 8)}… : ${row.wordsBefore}→${row.wordsAfter} mots, Δ ${(row.rewriteRatio * 100).toFixed(0)}%`;
        }
        return `ÉCHEC ${row.articleId?.slice(0, 8) ?? '?'}… : ${row.error}`;
      });
      setLog((prev) => [`— Lot de ${result.processed} —`, ...lines, ...prev]);
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-[#C45D3E]/20 bg-[#FFFAF5]/95 p-5">
        <p className="text-sm leading-6 text-luxury-muted">
          Cible longueur : <strong className="text-luxury-ink">{BLOG_TARGET_WORDS_MIN}–{BLOG_TARGET_WORDS_MAX} mots</strong> de
          contenu réel. Badge « trop court » sous {BLOG_SHORT_WORDS_THRESHOLD} mots. Lots de{' '}
          <strong className="text-luxury-ink">3 à 5</strong> max — jamais les 25 d’un coup. Vérifie chaque lot avant le
          suivant. Espace les MàJ dans le temps.
        </p>
        {!gscAvailable ? (
          <p className="mt-3 text-xs text-amber-900">
            Search Console indisponible ici : priorisation surtout par longueur. Les impressions/clics GSC s’ajouteront dès
            que GSC répond.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-luxury-soft">
            Taille du lot
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="ml-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm normal-case tracking-normal text-luxury-ink"
            >
              {[3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="rounded-full border border-[#C45D3E]/30 bg-white px-4 py-2 text-xs font-semibold text-[#C45D3E]"
            onClick={selectTopN}
          >
            Sélectionner les {batchSize} plus urgents
          </button>
          <button
            type="button"
            className="btn-luxury-primary px-4 py-2 text-xs"
            disabled={pending}
            onClick={() => runBatch()}
          >
            {pending ? 'MàJ en cours…' : `Lancer le lot (${Math.min(batchSize, selected.length || batchSize)})`}
          </button>
        </div>
      </div>

      {log.length > 0 ? (
        <div className="rounded-2xl border border-black/10 bg-white/80 p-4 font-mono text-xs leading-5 text-luxury-muted">
          {log.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[1.5rem] border border-white/60 bg-white/70 shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/5 text-[10px] uppercase tracking-[0.14em] text-luxury-soft">
            <tr>
              <th className="px-3 py-3">#</th>
              <th className="px-3 py-3">Lot</th>
              <th className="px-3 py-3">Article</th>
              <th className="px-3 py-3">Mots</th>
              <th className="px-3 py-3">GSC 28j</th>
              <th className="px-3 py-3">Pourquoi</th>
              <th className="px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b border-black/5 align-top">
                <td className="px-3 py-3 text-xs text-luxury-soft">{index + 1}</td>
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => toggle(item.id)}
                    disabled={!selected.includes(item.id) && selected.length >= 5}
                    aria-label={`Sélectionner ${item.title_fr}`}
                  />
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium text-luxury-ink">{item.title_fr}</p>
                  <p className="mt-1 font-mono text-[11px] text-luxury-soft">/blog/{item.slug_fr}</p>
                  <Link
                    href={`/admin/blog/articles/${item.id}/edit`}
                    className="mt-1 inline-block text-[11px] font-semibold text-[#C45D3E] hover:underline"
                  >
                    Éditer
                  </Link>
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${zoneBadge(item.lengthZone)}`}>
                    {zoneLabel(item.lengthZone)} · {item.wordCount}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-luxury-muted">
                  {item.gscImpressions > 0
                    ? `${item.gscImpressions} impr. / ${item.gscClicks} clics${
                        item.gscCtr != null ? ` · CTR ${(item.gscCtr * 100).toFixed(1)}%` : ''
                      }`
                    : '—'}
                </td>
                <td className="px-3 py-3 text-xs leading-5 text-luxury-muted">
                  <ul className="list-disc pl-4">
                    {item.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-semibold text-luxury-ink disabled:opacity-50"
                    disabled={pending}
                    onClick={() => runUnit(item.id)}
                  >
                    Mettre à jour
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
