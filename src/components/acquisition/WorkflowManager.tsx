'use client';

import { useMemo, useState, useEffect } from 'react';
import { Pencil, Play, Plus, Trash2 } from 'lucide-react';

import {
  WORKFLOW_ACTION_OPTIONS,
  WORKFLOW_TRIGGER_OPTIONS,
} from '@/lib/acquisition/config';
import type { AcqWorkflow, WorkflowActionSpec, WorkflowActionType } from '@/lib/acquisition/types';

import { Card } from './Card';
import { Chip } from './Chip';
import { JourneyBoard } from './JourneyParts';
import { acq } from './tokens';
import { WorkflowJourney } from './WorkflowJourney';

type SavePayload = {
  id?: string;
  name: string;
  enabled: boolean;
  triggerType: AcqWorkflow['triggerType'];
  triggerKeyword?: string;
  lifecycleIn?: string;
  actions: WorkflowActionSpec[];
};

type Props = {
  workflows: AcqWorkflow[];
  schemaReady: boolean;
  selectedConversationId: string | null;
  pending: boolean;
  onSaveWorkflow: (payload: SavePayload) => Promise<{ ok: boolean; id?: string; error?: string }>;
  onDeleteWorkflow: (workflowId: string) => Promise<{ ok: boolean; error?: string }>;
  onToggleWorkflow: (workflowId: string, enabled: boolean) => Promise<{ ok: boolean; error?: string }>;
  onRunWorkflow: (workflowId: string) => Promise<{ ok: boolean; detail: string }>;
  onTestAction: (actionType: WorkflowActionType) => Promise<{ ok: boolean; type: string; detail: string }>;
  onStatus: (message: string) => void;
};

type Draft = SavePayload & { editing: boolean };

function emptyDraft(): Draft {
  return {
    editing: true,
    name: 'Nouveau workflow',
    enabled: true,
    triggerType: 'ig_dm_inbound',
    triggerKeyword: '',
    lifecycleIn: '',
    actions: [{ type: 'send_message', config: { body: 'Bonjour ! Comment puis-je t’aider ?' } }],
  };
}

function draftFromWorkflow(wf: AcqWorkflow): Draft {
  const lifecycle = wf.conditions.lifecycle_in;
  return {
    editing: false,
    id: wf.id,
    name: wf.name,
    enabled: wf.enabled,
    triggerType: wf.triggerType,
    triggerKeyword: typeof wf.triggerConfig.keyword === 'string' ? wf.triggerConfig.keyword : '',
    lifecycleIn: Array.isArray(lifecycle) ? lifecycle.join(', ') : '',
    actions: wf.actions.length ? wf.actions : [{ type: 'send_message' }],
  };
}

function defaultConfigForAction(type: WorkflowActionType): Record<string, unknown> | undefined {
  switch (type) {
    case 'send_message':
      return { body: 'Message FitMangas — essai 7 jours en visio.' };
    case 'tag_contact':
      return { tag: 'interet_essai' };
    case 'set_lifecycle_stage':
      return { stage: 'qualified' };
    case 'book_session_intent':
      return { courseType: 'visio_collectif' };
    case 'schedule_followup':
      return { delayHours: 24 };
    case 'broadcast_optin':
      return { body: 'Actu FitMangas — essai 7 jours en visio avec correction en direct : fitmangas.com' };
    case 'mini_poll':
      return { question: 'Sur une échelle de 1 à 5, te sens-tu accompagnée cette semaine ?' };
    default:
      return undefined;
  }
}

export function WorkflowManager({
  workflows,
  schemaReady,
  selectedConversationId,
  pending,
  onSaveWorkflow,
  onDeleteWorkflow,
  onToggleWorkflow,
  onRunWorkflow,
  onTestAction,
  onStatus,
}: Props) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(workflows.map((wf) => [wf.id, draftFromWorkflow(wf)])),
  );
  const [creating, setCreating] = useState(false);
  const [newDraft, setNewDraft] = useState<Draft>(emptyDraft);
  const [labResult, setLabResult] = useState<{ ok: boolean; label: string; detail: string } | null>(
    null,
  );

  const workflowList = useMemo(() => workflows, [workflows]);

  useEffect(() => {
    setDrafts(Object.fromEntries(workflows.map((wf) => [wf.id, draftFromWorkflow(wf)])));
  }, [workflows]);

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id]!, ...patch, editing: true },
    }));
  }

  async function handleSave(draft: Draft) {
    const r = await onSaveWorkflow({
      id: draft.id,
      name: draft.name,
      enabled: draft.enabled,
      triggerType: draft.triggerType,
      triggerKeyword: draft.triggerKeyword,
      lifecycleIn: draft.lifecycleIn,
      actions: draft.actions,
    });
    if (r.ok) {
      onStatus(draft.id ? 'Workflow enregistré.' : 'Workflow créé.');
      setCreating(false);
    } else {
      onStatus(r.error ?? 'Enregistrement impossible.');
    }
  }

  async function handleDelete(id: string) {
    const r = await onDeleteWorkflow(id);
    onStatus(r.ok ? 'Workflow supprimé.' : (r.error ?? 'Suppression impossible.'));
  }

  async function handleToggle(id: string, enabled: boolean) {
    const r = await onToggleWorkflow(id, enabled);
    if (r.ok) updateDraft(id, { enabled });
    onStatus(r.ok ? (enabled ? 'Workflow activé.' : 'Workflow désactivé.') : (r.error ?? 'Erreur.'));
  }

  async function handleRun(id: string) {
    if (!selectedConversationId) {
      onStatus('Sélectionne d’abord un fil (onglet Conversations).');
      return;
    }
    const r = await onRunWorkflow(id);
    onStatus(r.detail);
  }

  async function handleTestAction(type: WorkflowActionType, label: string) {
    if (!selectedConversationId) {
      onStatus('Sélectionne d’abord un fil sandbox (onglet Conversations).');
      return;
    }
    const r = await onTestAction(type);
    setLabResult({ ok: r.ok, label, detail: r.detail });
    onStatus(`${label} : ${r.detail}`);
  }

  function renderActionEditor(
    actions: WorkflowActionSpec[],
    onChange: (next: WorkflowActionSpec[]) => void,
  ) {
    return (
      <div className="space-y-2">
        {actions.map((action, idx) => (
          <div key={`${action.type}-${idx}`} className="flex flex-wrap items-center gap-2 rounded-[14px] bg-white/80 p-2">
            <select
              value={action.type}
              onChange={(e) => {
                const type = e.target.value as WorkflowActionType;
                const next = [...actions];
                next[idx] = { type, config: defaultConfigForAction(type) };
                onChange(next);
              }}
              className="min-w-[180px] rounded-lg border px-2 py-1.5 text-xs"
              style={{ borderColor: acq.warmBeigeDeep }}
            >
              {WORKFLOW_ACTION_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            {action.type === 'send_message' ? (
              <input
                type="text"
                value={String(action.config?.body ?? '')}
                onChange={(e) => {
                  const next = [...actions];
                  next[idx] = { ...action, config: { ...action.config, body: e.target.value } };
                  onChange(next);
                }}
                placeholder="Texte du message"
                className="min-w-[200px] flex-1 rounded-lg border px-2 py-1.5 text-xs"
                style={{ borderColor: acq.warmBeigeDeep }}
              />
            ) : null}
            <button
              type="button"
              onClick={() => onChange(actions.filter((_, i) => i !== idx))}
              className="rounded-lg px-2 py-1 text-xs text-red-700 hover:bg-red-50"
            >
              Retirer
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange([...actions, { type: 'send_message', config: defaultConfigForAction('send_message') }])
          }
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{ backgroundColor: acq.cream, color: acq.ink }}
        >
          <Plus size={12} /> Ajouter une action
        </button>
      </div>
    );
  }

  function renderDraftForm(draft: Draft, onPatch: (p: Partial<Draft>) => void, onSaveClick: () => void) {
    return (
      <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: acq.warmBeigeDeep }}>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          className="w-full rounded-[14px] border px-3 py-2 text-sm font-semibold"
          style={{ borderColor: acq.warmBeigeDeep }}
          placeholder="Nom du workflow"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs">
            <span style={{ color: acq.muted }}>Déclencheur</span>
            <select
              value={draft.triggerType}
              onChange={(e) => onPatch({ triggerType: e.target.value as AcqWorkflow['triggerType'] })}
              className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
              style={{ borderColor: acq.warmBeigeDeep }}
            >
              {WORKFLOW_TRIGGER_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          {draft.triggerType === 'ig_comment_keyword' ? (
            <label className="block text-xs">
              <span style={{ color: acq.muted }}>Mot-clé (ex. essai)</span>
              <input
                type="text"
                value={draft.triggerKeyword ?? ''}
                onChange={(e) => onPatch({ triggerKeyword: e.target.value })}
                className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
                style={{ borderColor: acq.warmBeigeDeep }}
              />
            </label>
          ) : (
            <label className="block text-xs">
              <span style={{ color: acq.muted }}>Conditions (étapes, ex. qualified, trial)</span>
              <input
                type="text"
                value={draft.lifecycleIn ?? ''}
                onChange={(e) => onPatch({ lifecycleIn: e.target.value })}
                className="mt-1 w-full rounded-lg border px-2 py-2 text-sm"
                style={{ borderColor: acq.warmBeigeDeep }}
                placeholder="qualified, trial"
              />
            </label>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: acq.muted }}>
            Actions (dans l’ordre)
          </p>
          {renderActionEditor(draft.actions, (actions) => onPatch({ actions }))}
        </div>
        <button
          type="button"
          disabled={pending || !schemaReady}
          onClick={onSaveClick}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: acq.terracotta }}
        >
          Enregistrer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <WorkflowJourney
        workflows={workflows}
        selectedConversationId={selectedConversationId}
        pending={pending}
        onRunDemo={handleRun}
      />

      <JourneyBoard title="Gérer les workflows" subtitle="Créer, modifier, activer ou désactiver">
        {!schemaReady ? (
          <p className="text-sm text-red-700">Migration §9 requise — tables acq_* absentes.</p>
        ) : null}

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setNewDraft(emptyDraft());
            }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: acq.active }}
          >
            <Plus size={16} /> Nouveau workflow
          </button>
        </div>

        {creating ? (
          <Card className="mb-4" padding="md">
            <p className="text-sm font-semibold" style={{ color: acq.ink }}>
              Nouveau workflow
            </p>
            {renderDraftForm(newDraft, (p) => setNewDraft({ ...newDraft, ...p, editing: true }), () =>
              void handleSave(newDraft),
            )}
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="mt-3 text-xs underline"
              style={{ color: acq.muted }}
            >
              Annuler
            </button>
          </Card>
        ) : null}

        <div className="space-y-3">
          {workflowList.map((wf) => {
            const draft = drafts[wf.id] ?? draftFromWorkflow(wf);
            const expanded = draft.editing;
            return (
              <Card key={wf.id} overlap padding="md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold" style={{ color: acq.ink }}>
                      {wf.name}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: acq.muted }}>
                      {WORKFLOW_TRIGGER_OPTIONS.find((t) => t.id === wf.triggerType)?.label ?? wf.triggerType}
                      {' · '}
                      {wf.actions.length} action{wf.actions.length > 1 ? 's' : ''}
                    </p>
                    <Chip
                      label={wf.enabled ? 'Actif' : 'Désactivé'}
                      tone={wf.enabled ? 'terracotta' : 'neutral'}
                      className="mt-2"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleToggle(wf.id, !wf.enabled)}
                      className="rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{
                        backgroundColor: wf.enabled ? acq.warmBeigeDeep : acq.terracottaSoft,
                        color: acq.ink,
                      }}
                    >
                      {wf.enabled ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => updateDraft(wf.id, { ...draftFromWorkflow(wf), editing: !expanded })}
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ backgroundColor: acq.cream }}
                      title="Modifier"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={pending || !selectedConversationId}
                      onClick={() => void handleRun(wf.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: acq.terracotta }}
                      title="Tester le workflow complet"
                    >
                      <Play size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void handleDelete(wf.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-red-700"
                      style={{ backgroundColor: '#FEE2E2' }}
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {expanded
                  ? renderDraftForm(draft, (p) => updateDraft(wf.id, p), () => void handleSave({ ...draft, id: wf.id }))
                  : null}
              </Card>
            );
          })}
        </div>
      </JourneyBoard>

      <JourneyBoard title="Laboratoire sandbox" subtitle="Tester chaque action sur le fil sélectionné">
        {!selectedConversationId ? (
          <p className="text-sm" style={{ color: acq.muted }}>
            Ouvre l’onglet Conversations, sélectionne ou crée un fil, puis reviens ici.
          </p>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {WORKFLOW_ACTION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={pending}
                  onClick={() => void handleTestAction(opt.id, opt.label)}
                  className="rounded-[14px] px-3 py-3 text-left text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#FFFFFF', boxShadow: acq.shadowCard, color: acq.ink }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {labResult ? (
              <Card className="mt-4" padding="md">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: acq.muted }}>
                  Dernier test — {labResult.label}
                </p>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: labResult.ok ? acq.ink : '#B91C1C' }}
                >
                  {labResult.ok ? '✓ ' : '✗ '}
                  {labResult.detail}
                </p>
              </Card>
            ) : null}
          </>
        )}
      </JourneyBoard>
    </div>
  );
}
