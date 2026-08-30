'use client';

import { Star } from 'lucide-react';

import type { PerformanceHookRow } from '@/lib/acquisition/types';

import { Chip } from './Chip';
import { JourneyBoard } from './JourneyParts';
import { acq } from './tokens';

function hasMetricData(rows: PerformanceHookRow[]): boolean {
  return rows.some((r) => r.saves != null || r.reach != null || r.score != null);
}

function hasPilierOrFormat(rows: PerformanceHookRow[]): boolean {
  return rows.some((r) => Boolean(r.pilier?.trim()) || Boolean(r.format?.trim()));
}

export function PerformanceHooksTable({ rows }: { rows: PerformanceHookRow[] }) {
  if (!rows.length) {
    return (
      <JourneyBoard title="Boucle de performance" subtitle="Hooks gagnants — few-shot CM">
        <p className="text-sm leading-relaxed" style={{ color: acq.muted }}>
          Aucun hook scoré pour l’instant. Publie des posts CM et active la sync Insights Meta, ou alimente la banque
          hooks dans Com’ réseaux.
        </p>
      </JourneyBoard>
    );
  }

  const showMetrics = hasMetricData(rows);
  const showMetaCol = hasPilierOrFormat(rows);

  return (
    <JourneyBoard
      title="Boucle de performance"
      subtitle="Hooks prêts à réinjecter"
    >
      {!showMetrics ? (
        <p
          className="mb-4 rounded-[14px] px-4 py-3 text-xs leading-relaxed"
          style={{ backgroundColor: acq.cream, color: acq.muted }}
        >
          Métriques Saves / Reach disponibles après connexion Insights Meta (sync CM).
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-[18px]" style={{ backgroundColor: acq.zoneInner }}>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: acq.muted }}>
              <th className="px-4 py-4 font-bold" />
              <th className="px-4 py-4">Hook / titre</th>
              <th className="px-4 py-4">Statut</th>
              {showMetrics ? (
                <>
                  <th className="px-4 py-4">Saves</th>
                  <th className="px-4 py-4">Reach</th>
                </>
              ) : null}
              {showMetaCol ? <th className="px-4 py-4">Pilier / format</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id}
                className="border-t"
                style={{
                  borderColor: 'rgba(255,255,255,0.55)',
                  backgroundColor: i % 2 === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.72)',
                }}
              >
                <td className="px-4 py-4">
                  <Star
                    size={16}
                    className={
                      row.score != null && row.score > 0 ? 'fill-[#C45D3E] text-[#C45D3E]' : 'text-[#D6D3D1]'
                    }
                  />
                </td>
                <td className="max-w-[320px] px-4 py-4">
                  <p className="font-semibold leading-snug" style={{ color: acq.ink }}>
                    {row.hook}
                  </p>
                  <p className="mt-1 text-xs capitalize" style={{ color: acq.mutedLight }}>
                    {row.channel}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <Chip
                    label={
                      row.score != null && row.score > 0
                        ? 'Top performer'
                        : row.saves != null
                          ? 'Mesuré'
                          : 'En banque'
                    }
                    tone={row.score != null && row.score > 0 ? 'terracotta' : 'neutral'}
                  />
                </td>
                {showMetrics ? (
                  <>
                    <td className="px-4 py-4 tabular-nums font-medium" style={{ color: acq.ink }}>
                      {row.saves != null ? row.saves.toLocaleString('fr-FR') : ''}
                    </td>
                    <td className="px-4 py-4 tabular-nums font-medium" style={{ color: acq.ink }}>
                      {row.reach != null ? row.reach.toLocaleString('fr-FR') : ''}
                    </td>
                  </>
                ) : null}
                {showMetaCol ? (
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {row.pilier?.trim() ? <Chip label={row.pilier} tone="terracotta" /> : null}
                      {row.format?.trim() ? <Chip label={row.format} /> : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </JourneyBoard>
  );
}
