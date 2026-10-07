'use client';

import { Flame } from 'lucide-react';

import { LIFECYCLE_LABELS } from '@/lib/acquisition/config';
import type { HotLeadRow } from '@/lib/acquisition/types';

import { AvatarBadge } from './AvatarBadge';
import { Card } from './Card';
import { Chip, ChipRow } from './Chip';
import { JourneyBoard } from './JourneyParts';
import { acq } from './tokens';

type Props = {
  leads: HotLeadRow[];
  error: string | null;
  selectedConversationId: string | null;
  onOpenConversation: (conversationId: string) => void;
};

function formatWhen(iso: string | null): string {
  if (!iso) return 'Pas de message';
  try {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

export function HotLeadsPanel({ leads, error, selectedConversationId, onOpenConversation }: Props) {
  return (
    <JourneyBoard
      title="Leads chauds"
      subtitle="Score ≥40 — à relancer à la main en complément des workflows"
      headerExtra={
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: acq.warmBeigeDeep, color: acq.ink }}
        >
          <Flame size={14} style={{ color: acq.terracotta }} />
          {leads.length}
        </span>
      }
    >
      {error ? <p className="mb-3 text-sm font-medium text-red-700">{error}</p> : null}

      {!error && !leads.length ? (
        <Card padding="md">
          <p className="text-sm" style={{ color: acq.muted }}>
            Aucun lead actionnable (score ≥40). Les comptes démo, @meta_ et l’équipe sont exclus.
          </p>
        </Card>
      ) : null}

      {leads.length ? (
        <div className="space-y-2 rounded-[20px] p-3" style={{ backgroundColor: acq.zoneInner }}>
          {leads.map((lead, i) => {
            const selected =
              Boolean(lead.conversationId) && lead.conversationId === selectedConversationId;
            const label = lead.handle ?? 'Contact';
            const canOpen = Boolean(lead.conversationId);
            return (
              <button
                key={lead.contactId}
                type="button"
                disabled={!canOpen}
                onClick={() => {
                  if (lead.conversationId) onOpenConversation(lead.conversationId);
                }}
                className={`block w-full text-left ${i > 0 ? '-mt-1' : ''} disabled:cursor-not-allowed`}
              >
                <div
                  className="rounded-[16px] px-3 py-3 transition"
                  style={{
                    backgroundColor: selected ? acq.active : '#FFFFFF',
                    color: selected ? '#FFFFFF' : acq.ink,
                    boxShadow: selected ? '0 16px 40px rgba(26,26,26,0.2)' : acq.shadowCard,
                    opacity: canOpen ? 1 : 0.65,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <AvatarBadge name={label} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{label}</p>
                        <p
                          className="shrink-0 text-[11px] font-semibold"
                          style={{ color: selected ? 'rgba(255,255,255,0.85)' : acq.terracotta }}
                        >
                          Score {lead.leadScore}
                        </p>
                      </div>
                      <p
                        className="mt-1 truncate text-xs"
                        style={{ color: selected ? 'rgba(255,255,255,0.7)' : acq.muted }}
                      >
                        {lead.lastMessagePreview ??
                          (canOpen ? 'Ouvrir le fil' : 'Pas de conversation — crée un fil si besoin')}
                      </p>
                      <ChipRow className="mt-2">
                        <Chip label={lead.channel} tone={selected ? 'onDark' : 'neutral'} />
                        <Chip
                          label={LIFECYCLE_LABELS[lead.lifecycleStage] ?? lead.lifecycleStage}
                          tone={selected ? 'onDark' : 'neutral'}
                        />
                        <Chip
                          label={formatWhen(lead.lastMessageAt)}
                          tone={selected ? 'onDark' : 'sandbox'}
                        />
                        {lead.email ? (
                          <Chip label="E-mail" tone={selected ? 'onDark' : 'terracotta'} />
                        ) : null}
                      </ChipRow>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </JourneyBoard>
  );
}
