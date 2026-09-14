'use client';

import type { MetaLiveReadiness } from '@/lib/acquisition/providers/meta-live';

import { Card } from './Card';
import { Chip, ChipRow } from './Chip';
import { acq } from './tokens';

type Props = {
  messagingMode: 'sandbox' | 'live';
  schemaReady: boolean;
  conversationCount: number;
  upcomingFollowups: number;
  metaLive?: MetaLiveReadiness | null;
  pending: boolean;
  onSeedDemo: () => void;
  onRunFollowups: () => void;
  onEnsureMeta: () => void;
  onSyncInsights: () => void;
  onCheckLive: () => void;
};

export function AcquisitionOpsPanel({
  messagingMode,
  schemaReady,
  conversationCount,
  upcomingFollowups,
  metaLive,
  pending,
  onSeedDemo,
  onRunFollowups,
  onEnsureMeta,
  onSyncInsights,
  onCheckLive,
}: Props) {
  const steps = [
    {
      ok: schemaReady,
      label: 'Tables CRM prêtes',
    },
    {
      ok: conversationCount > 0,
      label: 'Au moins 1 fil dans Conversations',
    },
    {
      ok: messagingMode === 'sandbox' || messagingMode === 'live',
      label: messagingMode === 'live' ? 'Mode LIVE messages' : 'Mode SANDBOX (simulation OK pour tester)',
    },
    {
      ok: Boolean(metaLive?.verifyTokenConfigured),
      label: 'Verify token webhook configuré',
    },
    {
      ok: Boolean(metaLive?.tokenPresent && !metaLive?.tokenExpired && metaLive?.idsDistinct),
      label: 'Token Meta + Page ID ≠ IG User ID',
    },
    {
      ok: Boolean(metaLive?.readyForLive),
      label: 'Checklist LIVE messaging verte',
    },
  ];

  return (
    <Card overlap padding="lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: acq.terracotta }}>
            Validation & passage LIVE
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: acq.muted }}>
            1) Tester Conversations + relances en simulation. 2) Préparer Meta messaging. 3) Passer LIVE
            seulement quand la checklist est verte (permissions messaging Meta approuvées).
          </p>
        </div>
        <ChipRow>
          <Chip label={messagingMode === 'live' ? 'LIVE' : 'SANDBOX'} tone={messagingMode === 'live' ? 'terracotta' : 'sandbox'} />
          <Chip label={`${upcomingFollowups} relance(s)`} />
        </ChipRow>
      </div>

      <ul className="mt-6 space-y-2">
        {steps.map((s) => (
          <li key={s.label} className="flex items-start gap-2 text-sm" style={{ color: acq.ink }}>
            <span aria-hidden>{s.ok ? '✓' : '○'}</span>
            <span style={{ color: s.ok ? acq.ink : acq.muted }}>{s.label}</span>
          </li>
        ))}
      </ul>

      {metaLive?.blockers?.length ? (
        <ul className="mt-4 space-y-1 text-sm" style={{ color: '#991B1B' }}>
          {metaLive.blockers.map((b) => (
            <li key={b}>• {b}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={onSeedDemo}
          className="rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-50"
          style={{ backgroundColor: acq.warmBeigeDeep, color: acq.ink }}
        >
          Charger fil démo
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onRunFollowups}
          className="rounded-full px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: acq.active }}
        >
          Exécuter relances dues
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onEnsureMeta}
          className="rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-50"
          style={{ backgroundColor: acq.warmBeigeDeep, color: acq.ink }}
        >
          Préparer token messaging
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onSyncInsights}
          className="rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-50"
          style={{ backgroundColor: acq.warmBeigeDeep, color: acq.ink }}
        >
          Sync Insights → hooks
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onCheckLive}
          className="rounded-full px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: acq.terracotta }}
        >
          Recalculer checklist LIVE
        </button>
      </div>

      {metaLive?.webhookUrl ? (
        <p className="mt-4 text-xs leading-relaxed" style={{ color: acq.muted }}>
          Webhook à coller dans Meta Developers →{' '}
          <code className="text-[11px]">{metaLive.webhookUrl}</code>
        </p>
      ) : null}
    </Card>
  );
}
