/**
 * « Bac à sable » hors ligne de CROISSANCE_V2 : vraies conversations simulées de bout en bout dans l'orchestrateur,
 * avec les 43 règles du catalogue. Aucune base de données, aucun envoi Meta : les actions sont seulement enregistrées.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AcqContact, AcqConversation } from '@/lib/acquisition/types';

type Captured = { type: string; config: Record<string, unknown> };
const captured: Captured[] = [];
const cancelScheduled = vi.fn();
let contact: AcqContact;

vi.mock('./repository', () => ({
  getContact: vi.fn(async () => contact),
  listWorkflows: vi.fn(async () => ({ ok: true, items: [] })),
  tagContact: vi.fn(async (_id: string, tag: string) => {
    contact = { ...contact, tags: [...contact.tags, tag] };
  }),
  cancelScheduledFollowups: (...args: unknown[]) => cancelScheduled(...args),
  recordWorkflowRun: vi.fn(async () => undefined),
  wasWorkflowRunRecently: vi.fn(async () => false),
  patchContactExternalIds: vi.fn(async () => undefined),
}));

vi.mock('./actions', () => ({
  runWorkflowAction: vi.fn(async (spec: { type: string; config?: Record<string, unknown> }) => {
    captured.push({ type: spec.type, config: spec.config ?? {} });
    return { type: spec.type, ok: true, detail: 'simulé' };
  }),
  actionAskFollowGate: vi.fn(async () => {
    captured.push({ type: 'ask_follow_gate', config: {} });
    return { type: 'verify_follow_and_resume', ok: true, detail: 'simulé' };
  }),
}));

import { WORKFLOW_CATALOG } from './workflow-catalog';
import { runInboundTrigger } from './orchestrator';

const conversation: AcqConversation = {
  id: 'conv-test',
  contactId: 'contact-test',
  channel: 'instagram',
  status: 'open',
  lifecycleStage: 'new',
  subject: null,
  lastMessageAt: null,
  lastMessagePreview: null,
  assignedTo: null,
};

/** Messages envoyés à la personne (le reste : étiquettes, étape du parcours, alerte Alejandra, relance). */
const MESSAGE_TYPES = new Set([
  'send_message',
  'send_trial_link',
  'ask_follow_gate',
  'mini_poll',
  'capture_email_optin',
]);
const messages = () => captured.filter((c) => MESSAGE_TYPES.has(c.type));
const hasTrialLink = () =>
  captured.some(
    (c) =>
      c.type === 'send_trial_link' ||
      (c.type === 'send_message' && c.config.appendTrialLink === true) ||
      (c.type === 'schedule_followup' && String(c.config.actionType ?? 'send_trial_link') === 'send_trial_link'),
  );

async function dm(text: string, triggerType: 'ig_dm_inbound' | 'ig_story_reply' = 'ig_dm_inbound') {
  return runInboundTrigger({
    triggerType,
    conversation,
    contactId: contact.id,
    inboundText: text,
    market: 'fr',
    workflows: WORKFLOW_CATALOG,
  });
}

describe('CROISSANCE_V2 — conversations simulées (rien n’est envoyé)', () => {
  beforeEach(() => {
    process.env.CROISSANCE_V2 = '1';
    captured.length = 0;
    cancelScheduled.mockReset();
    contact = {
      id: 'contact-test',
      channel: 'instagram',
      handle: '@prospecte_test',
      email: null,
      optIn: false,
      lifecycleStage: 'new',
      tags: ['follow_verified'],
      sourceAttribution: null,
      createdAt: '2026-10-20T10:00:00Z',
    };
  });
  afterEach(() => {
    delete process.env.CROISSANCE_V2;
  });

  it('« C’est combien ? » : une seule réponse, pas deux', async () => {
    await dm('C’est combien ?');
    expect(messages()).toHaveLength(1);
  });

  it('« prix » (mot-clé du bouton) : une seule réponse', async () => {
    await dm('prix');
    expect(messages()).toHaveLength(1);
  });

  it('réponse à une story avec un émoji : un merci sans lien d’essai, sans relance, Alejandra prévenue', async () => {
    await dm('😍', 'ig_story_reply');
    expect(messages()).toHaveLength(1);
    expect(hasTrialLink()).toBe(false);
    expect(captured.some((c) => c.type === 'schedule_followup')).toBe(false);
    expect(captured.some((c) => c.type === 'escalate_human')).toBe(true);
    expect(cancelScheduled).toHaveBeenCalled();
  });

  it('demande pour Nantes : réponse personnelle (« je te réponds personnellement »), pas d’essai visio poussé', async () => {
    await dm('Bonjour, vous faites des cours à Nantes ?');
    // En V2, l'action Nantes envoie elle-même « Pour les cours à Nantes, je te réponds personnellement ici. »
    // (sans lien d'essai) puis prévient Alejandra.
    expect(captured.some((c) => c.type === 'book_session_intent' && c.config.courseType === 'nantes_presentiel')).toBe(
      true,
    );
    expect(hasTrialLink()).toBe(false);
  });

  it('objection « pas souple » : une réponse avec l’essai, et une seule relance au lieu de trois', async () => {
    await dm('Je ne suis pas souple');
    expect(messages()).toHaveLength(1);
    const followups = captured.filter((c) => c.type === 'schedule_followup');
    expect(followups).toHaveLength(1);
    expect(followups[0].config.style).toBe('reminder_j1');
  });

  it('drapeau éteint : comportement d’origine inchangé (3 relances J+2, J+5, J+7)', async () => {
    delete process.env.CROISSANCE_V2;
    await dm('Je ne suis pas souple');
    expect(captured.filter((c) => c.type === 'schedule_followup')).toHaveLength(3);
  });
});
