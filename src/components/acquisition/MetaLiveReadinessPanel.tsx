'use client';

import type { MetaLiveReadiness } from '@/lib/acquisition/providers/meta-live';

import { Card } from './Card';
import { Chip, ChipRow } from './Chip';
import { acq } from './tokens';

type Props = {
  status: MetaLiveReadiness;
};

export function MetaLiveReadinessPanel({ status }: Props) {
  const reviewLabel =
    status.appReviewMessaging === 'approved'
      ? 'Approuvée'
      : status.appReviewMessaging === 'pending'
        ? 'En attente'
        : 'Non vérifiée';

  return (
    <Card overlap padding="lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: acq.terracotta }}>
            Meta messaging — état réel
          </p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: acq.muted }}>
            {status.messagingMode === 'live'
              ? 'MESSAGING_MODE=live : les envois Instagram passent par l’API Meta. Cette fiche décrit ce qui est vraiment branché (pas un feu vert marketing).'
              : 'MESSAGING_MODE=sandbox : simulation. Passe en live seulement après App Review messaging OK.'}
          </p>
        </div>
        <ChipRow>
          <Chip
            label={status.messagingMode === 'live' ? 'LIVE (env)' : 'SANDBOX (env)'}
            tone={status.messagingMode === 'live' ? 'terracotta' : 'sandbox'}
          />
          {status.appReviewMessaging === 'approved' ? (
            <Chip label="App Review OK" tone="terracotta" />
          ) : (
            <Chip label={`App Review : ${reviewLabel}`} tone="sandbox" />
          )}
        </ChipRow>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <Item label="Webhook" value={status.webhookUrl} />
        <Item label="Verify token" value={status.verifyTokenConfigured ? 'Configuré' : 'Manquant'} />
        <Item label="App Meta" value={status.metaAppConfigured ? 'OK' : 'Manquant'} />
        <Item label="App Review messaging" value={reviewLabel} />
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
        <Item
          label="WhatsApp (n° public)"
          value={status.whatsapp?.displayPhone ? `+${status.whatsapp.displayPhone}` : '—'}
        />
        <Item
          label="WhatsApp Cloud"
          value={status.whatsapp?.cloudRegistered ? 'Enregistré' : 'Non enregistré / PENDING'}
        />
        <Item
          label="WhatsApp robot"
          value={status.whatsapp?.robotReady ? 'Branché' : 'Pas prêt'}
        />
      </dl>

      {status.whatsapp?.plainStatus ? (
        <p className="mt-4 text-sm leading-relaxed" style={{ color: acq.ink }}>
          {status.whatsapp.plainStatus}
        </p>
      ) : null}

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
