'use client';

import type { MetaLiveReadiness } from '@/lib/acquisition/providers/meta-live';

import { Card } from './Card';
import { Chip, ChipRow } from './Chip';
import { acq } from './tokens';

type Props = {
  status: MetaLiveReadiness;
};

export function MetaLiveReadinessPanel({ status }: Props) {
  return (
    <Card overlap padding="lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: acq.terracotta }}>
            Meta LIVE — préparation
          </p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: acq.muted }}>
            Code prêt — ne pas passer <code className="text-xs">MESSAGING_MODE=live</code> avant checklist verte.
          </p>
        </div>
        <ChipRow>
          {status.readyForLive ? (
            <Chip label="Prêt techniquement" tone="terracotta" />
          ) : (
            <Chip label={`${status.blockers.length} blocage(s)`} tone="sandbox" />
          )}
          {status.messagingMode === 'live' ? <Chip label="LIVE actif" tone="terracotta" /> : null}
        </ChipRow>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <Item label="Webhook" value={status.webhookUrl} />
        <Item label="Verify token" value={status.verifyTokenConfigured ? 'Configuré' : 'Manquant'} />
        <Item label="App Meta" value={status.metaAppConfigured ? 'OK' : 'Manquant'} />
        <Item label="Page ID" value={status.pageId ?? '—'} />
        <Item label="IG User ID" value={status.igUserId ?? '—'} />
        <Item
          label="IDs distincts"
          value={status.idsDistinct ? 'Oui' : status.pageId && status.igUserId ? 'Non — corriger' : '—'}
        />
        <Item label="Token" value={status.tokenPresent ? (status.tokenExpired ? 'Expiré' : 'Présent') : 'Absent'} />
        <Item
          label="Connexion"
          value={
            status.acquisitionConnection
              ? 'acquisition_meta_connection'
              : status.cmConnectionFallback
                ? 'Secours CM (scopes à vérifier)'
                : 'Aucune'
          }
        />
      </dl>

      {status.blockers.length ? (
        <ul className="mt-6 space-y-2 text-sm" style={{ color: '#991B1B' }}>
          {status.blockers.map((b) => (
            <li key={b}>• {b}</li>
          ))}
        </ul>
      ) : null}

      {status.notes.length ? (
        <ul className="mt-4 space-y-2 text-sm" style={{ color: acq.muted }}>
          {status.notes.map((n) => (
            <li key={n}>• {n}</li>
          ))}
        </ul>
      ) : null}

      <p className="mt-6 text-xs leading-relaxed" style={{ color: acq.muted }}>
        Permissions App Review : instagram_manage_messages, pages_messaging, webhooks messages. Détail dans{' '}
        <span className="font-medium">ACQUISITION-SETUP.md</span>.
      </p>
    </Card>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] px-4 py-3" style={{ backgroundColor: acq.zoneInner }}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: acq.muted }}>
        {label}
      </dt>
      <dd className="mt-1 break-all text-sm font-medium" style={{ color: acq.ink }}>
        {value}
      </dd>
    </div>
  );
}
