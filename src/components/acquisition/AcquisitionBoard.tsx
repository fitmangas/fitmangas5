'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BarChart3, MessageCircle, Workflow } from 'lucide-react';

import { ACQUISITION_CHANNELS, LIFECYCLE_LABELS } from '@/lib/acquisition/config';
import type {
  AcqConversation,
  AcqMessage,
  AcqWorkflow,
  AcquisitionChannel,
  AcquisitionOverview,
  WorkflowActionType,
} from '@/lib/acquisition/types';

import { AlejandraAvatar, AvatarBadge } from './AvatarBadge';
import { AvatarStack, type AvatarPerson } from './AvatarStack';
import { contactDisplayName, contactsWithRealHandles } from './avatar-guards';
import { Card } from './Card';
import { Chip, ChipRow } from './Chip';
import { FloatingCard } from './FloatingCard';
import { FunnelChart } from './FunnelChart';
import { KpiGrid } from './KpiGrid';
import { PerformanceHooksTable } from './PerformanceHooksTable';
import { acq } from './tokens';
import { JourneyActionCluster } from './JourneyActionCluster';
import { JourneyBoard } from './JourneyParts';
import { WorkflowManager } from './WorkflowManager';

type TabId = 'overview' | 'conversations' | 'workflows';

type Props = {
  overview: AcquisitionOverview;
  conversations: AcqConversation[];
  workflows: AcqWorkflow[];
  conversationsError: string | null;
  schemaReady: boolean;
  selectedConversationId: string | null;
  selectedMessages: AcqMessage[];
  detailError: string | null;
  sandboxLog: Array<{ at: string; provider: string; action: string; detail: string }>;
  onSendReply: (conversationId: string, body: string) => Promise<{ ok: boolean; error?: string }>;
  onSeedDemo: () => Promise<{ ok: boolean; error?: string; seeded?: boolean }>;
  onCreateThread: () => Promise<{ ok: boolean; conversationId?: string; error?: string }>;
  onRunWorkflowDemo: (workflowId: string, conversationId: string) => Promise<{ ok: boolean; detail: string }>;
  onSaveWorkflow: (payload: {
    id?: string;
    name: string;
    enabled: boolean;
    triggerType: AcqWorkflow['triggerType'];
    triggerKeyword?: string;
    lifecycleIn?: string;
    actions: AcqWorkflow['actions'];
  }) => Promise<{ ok: boolean; id?: string; error?: string }>;
  onDeleteWorkflow: (workflowId: string) => Promise<{ ok: boolean; error?: string }>;
  onToggleWorkflow: (workflowId: string, enabled: boolean) => Promise<{ ok: boolean; error?: string }>;
  onTestAction: (
    conversationId: string,
    actionType: WorkflowActionType,
  ) => Promise<{ ok: boolean; type: string; detail: string }>;
  /** Intégré dans /admin/croissance — masque en-tête et barre d’onglets internes. */
  embedded?: boolean;
  forcedTab?: TabId;
  routeBase?: string;
};

export function AcquisitionBoard({
  overview,
  conversations,
  workflows,
  conversationsError,
  schemaReady,
  selectedConversationId,
  selectedMessages,
  detailError,
  sandboxLog,
  onSendReply,
  onSeedDemo,
  onCreateThread,
  onRunWorkflowDemo,
  onSaveWorkflow,
  onDeleteWorkflow,
  onToggleWorkflow,
  onTestAction,
  embedded = false,
  forcedTab = 'overview',
  routeBase = '/admin/acquisition',
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabId>(forcedTab);
  const activeTab = embedded ? forcedTab : tab;
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const tabs = useMemo(
    () =>
      [
        { id: 'overview' as const, label: 'Vue d’ensemble', icon: BarChart3 },
        { id: 'conversations' as const, label: 'Conversations', icon: MessageCircle },
        { id: 'workflows' as const, label: 'Workflows', icon: Workflow },
      ] as const,
    [],
  );

  const realContacts = contactsWithRealHandles(conversations);
  const inboxPeople: AvatarPerson[] = realContacts.slice(0, 8).map((c) => ({
    id: c.id,
    name: contactDisplayName(c)!,
    imageUrl: null,
  }));

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  function pushQuery(next: Record<string, string | undefined>) {
    const q = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) q.set(k, v);
      else q.delete(k);
    }
    if (embedded) q.set('tab', activeTab);
    router.push(`${routeBase}?${q.toString()}`);
  }

  function handleChannelChange(ch: AcquisitionChannel | 'all') {
    pushQuery({ channel: ch === 'all' ? undefined : ch });
  }

  function handleSelectConversation(id: string) {
    if (embedded) {
      const q = new URLSearchParams(searchParams.toString());
      q.set('tab', 'conversations');
      q.set('conversation', id);
      router.push(`${routeBase}?${q.toString()}`);
      return;
    }
    pushQuery({ conversation: id });
    setTab('conversations');
  }

  function handleCreateThread() {
    startTransition(async () => {
      const r = await onCreateThread();
      if (r.ok && r.conversationId) {
        if (embedded) {
          const q = new URLSearchParams(searchParams.toString());
          q.set('tab', 'conversations');
          q.set('conversation', r.conversationId);
          router.push(`${routeBase}?${q.toString()}`);
        } else {
          pushQuery({ conversation: r.conversationId });
          setTab('conversations');
        }
        setStatus('Nouveau fil sandbox créé.');
      } else {
        setStatus(r.error ?? 'Impossible de créer le fil.');
      }
    });
  }

  function handleSend() {
    if (!selectedConversationId || !reply.trim()) return;
    startTransition(async () => {
      const r = await onSendReply(selectedConversationId, reply.trim());
      setStatus(r.ok ? 'Message enregistré (sandbox si actif).' : (r.error ?? 'Échec envoi'));
      if (r.ok) setReply('');
    });
  }

  const shellClass = embedded
    ? 'relative'
    : 'relative min-h-screen px-4 pb-28 pt-4 sm:px-8 sm:pt-6';

  return (
    <div className={shellClass} style={embedded ? undefined : { background: acq.pageGradient }}>
      <div className={embedded ? undefined : 'mx-auto max-w-[1440px]'}>
        {!embedded ? (
          <>
            {/* En-tête Stratus */}
            <header className="mb-8 flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.24em]"
                  style={{ color: acq.terracotta }}
                >
                  Admin · Acquisition
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: acq.ink }}>
                  Parcours cliente
                </h1>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: acq.muted }}>
                  Entonnoir, inbox unifiée et workflows — module séparé du Community Manager publication.
                </p>
              </div>

              <div className="flex flex-col items-end gap-4">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {overview.messagingMode === 'sandbox' ? (
                    <Chip label="Mode SANDBOX" tone="sandbox" />
                  ) : (
                    <Chip label="Mode LIVE" tone="terracotta" />
                  )}
                  {!schemaReady ? <Chip label="Migration §9" /> : null}
                </div>
                <div className="flex items-center gap-3">
                  {inboxPeople.length > 0 ? <AvatarStack people={inboxPeople} max={6} size="md" /> : null}
                </div>
              </div>
            </header>

            {/* Onglets pilule noire Stratus */}
            <nav
              className="mb-8 inline-flex flex-wrap gap-1 rounded-full p-1.5"
              style={{ backgroundColor: 'rgba(255,255,255,0.75)', boxShadow: acq.shadowCard }}
            >
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition"
                  style={
                    activeTab === id
                      ? { backgroundColor: acq.active, color: '#FFFFFF' }
                      : { color: acq.muted }
                  }
                >
                  <Icon size={16} strokeWidth={2} />
                  {label}
                </button>
              ))}
            </nav>
          </>
        ) : (
          <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
            {overview.messagingMode === 'sandbox' ? (
              <Chip label="Mode SANDBOX" tone="sandbox" />
            ) : (
              <Chip label="Mode LIVE" tone="terracotta" />
            )}
            {!schemaReady ? <Chip label="Migration §9" /> : null}
          </div>
        )}

        {/* Erreurs sources */}
        {activeTab === 'overview' && overview.sourceErrors.length ? (
          <FloatingCard title="Sources indisponibles" className="mb-8 border border-[#FCD34D]/60 bg-[#FFFBEB]/80">
            <ul className="space-y-2 text-sm" style={{ color: '#78350F' }}>
              {overview.sourceErrors.map((e) => (
                <li key={e.provider}>
                  <strong>{e.provider}</strong> — {e.error}
                </li>
              ))}
            </ul>
          </FloatingCard>
        ) : null}

        {activeTab === 'overview' ? (
          <div className="space-y-8">
            <div className="px-1">
              <ChipRow>
                {ACQUISITION_CHANNELS.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.label}
                    active={overview.channel === c.id}
                    onClick={() => handleChannelChange(c.id as AcquisitionChannel | 'all')}
                  />
                ))}
              </ChipRow>
            </div>
            <FunnelChart steps={overview.funnel} conversations={conversations} />
            <KpiGrid kpis={overview.kpis} />
            <PerformanceHooksTable rows={overview.performanceHooks} />
          </div>
        ) : null}

        {activeTab === 'conversations' ? (
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <JourneyBoard
              title="Inbox unifiée"
              subtitle="Instagram · Messenger · WhatsApp · Email"
              action={
                <JourneyActionCluster
                  variant="create-thread"
                  onPrimary={handleCreateThread}
                  busy={pending}
                  disabled={!schemaReady}
                />
              }
              headerExtra={inboxPeople.length > 0 ? <AvatarStack people={inboxPeople} max={7} size="md" /> : null}
              className="lg:max-h-[820px] lg:overflow-y-auto"
            >
              {conversationsError ? (
                <p className="mb-4 text-sm font-medium text-red-700">{conversationsError}</p>
              ) : null}
              {!schemaReady ? (
                <Card className="mb-4" padding="md">
                  <p className="text-sm" style={{ color: acq.muted }}>
                    Applique la migration §9, puis crée un fil démo.
                  </p>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const r = await onSeedDemo();
                        setStatus(
                          r.ok
                            ? r.seeded
                              ? 'Fil démo créé.'
                              : 'Données déjà présentes.'
                            : (r.error ?? 'Seed impossible'),
                        );
                      })
                    }
                    className="mt-4 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
                    style={{ backgroundColor: acq.terracotta }}
                  >
                    Créer fil sandbox démo
                  </button>
                </Card>
              ) : null}

              <div
                className="space-y-2 rounded-[20px] p-3"
                style={{ backgroundColor: acq.zoneInner }}
              >
                {conversations.map((c, i) => {
                  const selected = selectedConversationId === c.id;
                  const avatarName = contactDisplayName(c);
                  const displayName = avatarName ?? c.subject ?? c.contactHandle ?? 'Sans nom';
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectConversation(c.id)}
                      className={`block w-full text-left ${i > 0 ? '-mt-1' : ''}`}
                    >
                      <div
                        className="rounded-[16px] px-3 py-3 transition"
                        style={{
                          backgroundColor: selected ? acq.active : '#FFFFFF',
                          color: selected ? '#FFFFFF' : acq.ink,
                          boxShadow: selected ? '0 16px 40px rgba(26,26,26,0.2)' : acq.shadowCard,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {avatarName ? <AvatarBadge name={avatarName} size="md" /> : null}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{displayName}</p>
                            <p
                              className="mt-1 truncate text-xs"
                              style={{ color: selected ? 'rgba(255,255,255,0.7)' : acq.muted }}
                            >
                              {c.lastMessagePreview ?? 'Aucun message'}
                            </p>
                            <ChipRow className="mt-2">
                              <Chip label={c.channel} tone={selected ? 'onDark' : 'neutral'} />
                              <Chip
                                label={LIFECYCLE_LABELS[c.lifecycleStage] ?? c.lifecycleStage}
                                tone={selected ? 'onDark' : 'neutral'}
                              />
                            </ChipRow>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {!conversations.length && schemaReady ? (
                  <p className="px-2 py-4 text-sm" style={{ color: acq.muted }}>
                    Aucun fil — crée un fil démo ou branche les webhooks Meta.
                  </p>
                ) : null}
              </div>
            </JourneyBoard>

            <JourneyBoard
              title="Détail du fil"
              subtitle="Historique + réponse humaine"
              action={
                <JourneyActionCluster
                  variant="send-message"
                  onPrimary={handleSend}
                  busy={pending}
                  disabled={!selectedConversationId || !reply.trim()}
                />
              }
            >
              {detailError ? <p className="mb-4 text-sm font-medium text-red-700">{detailError}</p> : null}
              {!selectedConversationId ? (
                <Card>
                  <p className="text-sm" style={{ color: acq.muted }}>
                    Sélectionne un fil à gauche.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  <Card overlap>
                    <div className="flex items-center gap-3">
                      {selectedConversation && contactDisplayName(selectedConversation) ? (
                        <AvatarBadge name={contactDisplayName(selectedConversation)!} size="lg" />
                      ) : null}
                      <div>
                        <p className="font-bold" style={{ color: acq.ink }}>
                          {selectedConversation?.contactHandle ??
                            selectedConversation?.subject ??
                            'Contact'}
                        </p>
                        <ChipRow className="mt-2">
                          <Chip label={selectedConversation?.channel ?? '—'} tone="terracotta" />
                          <Chip
                            label={
                              LIFECYCLE_LABELS[selectedConversation?.lifecycleStage ?? 'new'] ??
                              selectedConversation?.lifecycleStage ??
                              '—'
                            }
                          />
                        </ChipRow>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wide" style={{ color: acq.muted }}>
                          Escalade
                        </span>
                        <AlejandraAvatar size="md" />
                      </div>
                    </div>
                  </Card>

                  <Card className="max-h-[420px] overflow-y-auto">
                    <div className="space-y-3">
                      {selectedMessages.map((m) => (
                        <div
                          key={m.id}
                          className={`max-w-[88%] rounded-[18px] px-4 py-3 text-sm ${
                            m.direction === 'outbound'
                              ? 'ml-auto'
                              : m.direction === 'system'
                                ? 'mx-auto text-center text-xs'
                                : ''
                          }`}
                          style={{
                            backgroundColor:
                              m.direction === 'outbound'
                                ? acq.terracotta
                                : m.direction === 'system'
                                  ? acq.warmBeige
                                  : '#FFFFFF',
                            color:
                              m.direction === 'outbound'
                                ? '#FFFFFF'
                                : acq.ink,
                            boxShadow: m.direction === 'inbound' ? acq.shadowCard : undefined,
                          }}
                        >
                          {m.sandbox ? (
                            <span className="mb-1 block text-[10px] font-bold uppercase opacity-70">
                              Sandbox
                            </span>
                          ) : null}
                          {m.body}
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card overlap>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="flex items-center gap-2 sm:w-32 sm:shrink-0">
                        <AlejandraAvatar size="sm" />
                        <span className="text-xs font-medium" style={{ color: acq.muted }}>
                          Réponse
                        </span>
                      </div>
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        rows={3}
                        placeholder="Réponse humaine…"
                        className="flex-1 rounded-[18px] border px-4 py-3 text-sm"
                        style={{ borderColor: acq.warmBeigeDeep, backgroundColor: acq.cream }}
                      />
                      <button
                        type="button"
                        disabled={pending || !reply.trim()}
                        onClick={handleSend}
                        className="rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: acq.active }}
                      >
                        Envoyer
                      </button>
                    </div>
                  </Card>
                </div>
              )}
            </JourneyBoard>
          </div>
        ) : null}

        {activeTab === 'workflows' ? (
          <div className="space-y-8">
            <WorkflowManager
              workflows={workflows}
              schemaReady={schemaReady}
              selectedConversationId={selectedConversationId}
              pending={pending}
              onStatus={setStatus}
              onSaveWorkflow={onSaveWorkflow}
              onDeleteWorkflow={onDeleteWorkflow}
              onToggleWorkflow={onToggleWorkflow}
              onRunWorkflow={(id) =>
                new Promise((resolve) => {
                  if (!selectedConversationId) {
                    resolve({ ok: false, detail: 'Sélectionne un fil.' });
                    return;
                  }
                  startTransition(async () => {
                    const r = await onRunWorkflowDemo(id, selectedConversationId);
                    setStatus(r.detail);
                    resolve(r);
                  });
                })
              }
              onTestAction={(actionType) =>
                new Promise((resolve) => {
                  if (!selectedConversationId) {
                    resolve({ ok: false, type: actionType, detail: 'Sélectionne un fil.' });
                    return;
                  }
                  startTransition(async () => {
                    const r = await onTestAction(selectedConversationId, actionType);
                    resolve(r);
                  });
                })
              }
            />

            {sandboxLog.length ? (
              <JourneyBoard title="Journal sandbox" subtitle="Envois simulés — jamais silencieux">
                <div
                  className="space-y-2 rounded-[20px] p-3"
                  style={{ backgroundColor: acq.zoneInner }}
                >
                  {sandboxLog.map((line, i) => (
                    <Card key={`${line.at}-${i}`} overlap={i > 0} padding="md">
                      <p className="font-mono text-xs leading-relaxed" style={{ color: acq.muted }}>
                        {line.detail}
                      </p>
                    </Card>
                  ))}
                </div>
              </JourneyBoard>
            ) : null}
          </div>
        ) : null}
      </div>

      {status ? (
        <p
          className="fixed bottom-6 right-6 z-50 max-w-sm rounded-[18px] px-5 py-3 text-sm text-white"
          style={{ backgroundColor: acq.active, boxShadow: acq.shadowFloat }}
        >
          {status}
        </p>
      ) : null}
    </div>
  );
}
