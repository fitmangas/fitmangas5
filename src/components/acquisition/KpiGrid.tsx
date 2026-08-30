'use client';

import type { AcquisitionKpi } from '@/lib/acquisition/types';

import { Card } from './Card';
import { Chip } from './Chip';
import { DonutStat } from './DonutStat';
import { JourneyActionCluster } from './JourneyActionCluster';
import { JourneyBoard } from './JourneyParts';
import { acq } from './tokens';

const toneValue: Record<NonNullable<AcquisitionKpi['tone']>, string> = {
  neutral: acq.ink,
  good: acq.terracotta,
  watch: '#B45309',
  bad: '#B91C1C',
};

function parseNumeric(value: string): number | null {
  const n = parseInt(value.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

export function KpiGrid({ kpis }: { kpis: AcquisitionKpi[] }) {
  const trials = kpis.find((k) => k.id === 'trials');
  const paid = kpis.find((k) => k.id === 'paid');
  const trialNum = trials ? parseNumeric(trials.value) : null;
  const paidNum = paid ? parseNumeric(paid.value) : null;
  const total = (trialNum ?? 0) + (paidNum ?? 0);
  const trialPct = total > 0 && trialNum != null ? Math.round((trialNum / total) * 100) : 45;
  const paidPct = total > 0 && paidNum != null ? Math.round((paidNum / total) * 100) : 55;

  return (
    <JourneyBoard title="Indicateurs clés" subtitle="Lecture seule — GA4, GSC, Stripe, Supabase" action={<JourneyActionCluster />}>
      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {kpis.map((kpi, i) => (
            <Card key={kpi.id} overlap={i > 0} className={i % 2 === 1 ? '-mt-2 sm:ml-3' : ''} padding="md">
              <Chip label={kpi.label} tone={kpi.tone === 'good' ? 'terracotta' : 'neutral'} />
              <p
                className="mt-4 text-2xl font-bold tabular-nums tracking-tight"
                style={{ color: toneValue[kpi.tone ?? 'neutral'] }}
              >
                {kpi.value}
              </p>
              {kpi.hint ? (
                <p className="mt-2 text-xs leading-relaxed" style={{ color: acq.mutedLight }}>
                  {kpi.hint}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-[22px] px-3 py-5 sm:flex-row sm:justify-around"
          style={{ backgroundColor: acq.zoneInner }}
        >
          <DonutStat
            label="Essais actifs"
            value={trials?.value ?? '0'}
            sublabel="En cours"
            fillPercent={trialPct}
            accent
          />
          <DonutStat
            label="Payantes"
            value={paid?.value ?? '0'}
            sublabel="Actives"
            fillPercent={paidPct}
          />
        </div>
      </div>
    </JourneyBoard>
  );
}
