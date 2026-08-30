/**
 * Test E2E module Acquisition (sans UI) — exécuter :
 * ACQUISITION_MODULE_ENABLED=true MESSAGING_MODE=sandbox npx tsx --env-file=.env.local scripts/test-acquisition-module.ts
 */
process.env.ACQUISITION_MODULE_ENABLED = process.env.ACQUISITION_MODULE_ENABLED ?? 'true';
process.env.MESSAGING_MODE = process.env.MESSAGING_MODE ?? 'sandbox';

import { WORKFLOW_ACTION_OPTIONS } from '../src/lib/acquisition/config';
import { buildAcquisitionOverview } from '../src/lib/acquisition/dashboard/build-overview';
import { resetAcquisitionSchemaCache } from '../src/lib/acquisition/db';
import { runWorkflowAction } from '../src/lib/acquisition/engine/actions';
import { runWorkflow } from '../src/lib/acquisition/engine/orchestrator';
import {
  createSandboxConversation,
  deleteWorkflow,
  getContact,
  getConversationWithMessages,
  insertOutboundMessage,
  listWorkflows,
  saveWorkflow,
  setWorkflowEnabled,
} from '../src/lib/acquisition/engine/repository';
import { applyConciergeResult } from '../src/lib/acquisition/ai/concierge-actions';
import { runConcierge } from '../src/lib/acquisition/ai/concierge';
import { getMetaLiveReadiness } from '../src/lib/acquisition/providers/meta-live';
import type { WorkflowActionType } from '../src/lib/acquisition/types';

type Check = { name: string; ok: boolean; detail: string };

const checks: Check[] = [];

function record(name: string, ok: boolean, detail: string) {
  checks.push({ name, ok, detail });
  const mark = ok ? '✓' : '✗';
  console.log(`${mark} ${name}: ${detail}`);
}

async function main() {
  resetAcquisitionSchemaCache();

  // 1. Vue d'ensemble
  const overview = await buildAcquisitionOverview('all');
  record(
    'Overview funnel',
    overview.funnel.length === 5 && overview.funnel.every((s) => typeof s.value === 'number'),
    `${overview.funnel.length} étapes, KPIs ${overview.kpis.length}`,
  );
  record('Overview KPIs', overview.kpis.length >= 6, overview.kpis.map((k) => k.label).join(', '));
  record('Meta LIVE readiness', Boolean(overview.metaLiveReadiness), overview.metaLiveReadiness?.webhookUrl ?? '—');

  const meta = await getMetaLiveReadiness();
  record('Meta webhook URL', meta.webhookUrl.includes('/api/acquisition/webhooks/meta'), meta.webhookUrl);

  if (!overview.schemaReady) {
    record('Schema acq_*', false, 'Migration §9 absente — arrêt tests DB.');
    summarize();
    process.exit(1);
  }
  record('Schema acq_*', true, 'Tables présentes');

  // 2. Conversations
  const thread = await createSandboxConversation();
  record('Créer fil sandbox', thread.ok && Boolean(thread.conversationId), thread.error ?? thread.conversationId ?? '');
  if (!thread.ok || !thread.conversationId) {
    summarize();
    process.exit(1);
  }
  const convId = thread.conversationId;

  const detail = await getConversationWithMessages(convId);
  record('Lire fil', detail.ok, detail.ok ? `${detail.messages.length} msg(s)` : detail.error);

  const contact = detail.ok ? await getContact(detail.conversation.contactId) : null;
  record('Contact fil', Boolean(contact), contact?.handle ?? 'absent');

  if (detail.ok && contact) {
    const send = await runWorkflowAction(
      { type: 'send_message', config: { body: 'Test E2E manuel sandbox.' } },
      { conversation: detail.conversation, contact, market: 'fr' },
    );
    record('Envoyer message', send.ok, send.detail);

    const concierge = await runConcierge({
      inboundText: 'Bonjour, je veux essayer l essai gratuit FitMangas',
      market: 'fr',
    });
    record(
      'Concierge (Claude ou fallback)',
      concierge.ok,
      concierge.ok ? `${concierge.provider} / ${concierge.intent}` : (concierge as { error: string }).error,
    );

    // Fallback explicite sans clé API
    const prevKey = process.env.ANTHROPIC_API_KEY;
    const prevClaude = process.env.CLAUDE_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.CLAUDE_API_KEY;
    const fallback = await runConcierge({
      inboundText: 'Bonjour, quel est le prix ?',
      market: 'fr',
    });
    if (prevKey) process.env.ANTHROPIC_API_KEY = prevKey;
    if (prevClaude) process.env.CLAUDE_API_KEY = prevClaude;
    record(
      'Concierge fallback sans clé',
      fallback.ok && fallback.provider === 'fallback',
      fallback.ok ? `${fallback.provider} / ${fallback.intent}` : 'erreur',
    );

    if (concierge.ok) {
      const applied = await applyConciergeResult(concierge, {
        conversation: detail.conversation,
        contact,
        inboundText: 'Bonjour, je veux essayer l essai gratuit FitMangas',
        market: 'fr',
      });
      record(
        'Concierge actions',
        applied.actions.some((a) => a.ok),
        `${applied.actions.length} action(s)`,
      );
    }
  }

  // 3. Workflows CRUD
  const saved = await saveWorkflow({
    name: `E2E test ${Date.now()}`,
    enabled: true,
    triggerType: 'ig_dm_inbound',
    triggerConfig: {},
    conditions: {},
    actions: [
      { type: 'send_message', config: { body: 'Workflow E2E test.' } },
      { type: 'send_trial_link' },
    ],
  });
  record('Créer workflow', saved.ok && Boolean(saved.id), saved.error ?? saved.id ?? '');

  const wfId = saved.id;
  if (!wfId) {
    summarize();
    process.exit(1);
  }

  const toggled = await setWorkflowEnabled(wfId, false);
  record('Désactiver workflow', toggled.ok, toggled.error ?? 'OK');
  const toggledOn = await setWorkflowEnabled(wfId, true);
  record('Activer workflow', toggledOn.ok, toggledOn.error ?? 'OK');

  const updated = await saveWorkflow({
    id: wfId,
    name: `E2E test modifié ${Date.now()}`,
    enabled: true,
    triggerType: 'ig_dm_inbound',
    triggerConfig: {},
    conditions: { lifecycle_in: ['qualified'] },
    actions: [{ type: 'tag_contact', config: { tag: 'e2e_test' } }],
  });
  record('Modifier workflow', updated.ok, updated.error ?? updated.id ?? '');

  if (detail.ok && contact) {
    const wfs = await listWorkflows();
    const wf = wfs.ok ? wfs.items.find((w) => w.id === wfId) : null;
    if (wf) {
      const run = await runWorkflow(wf, {
        conversation: detail.conversation,
        contactId: detail.conversation.contactId,
        inboundText: 'Test workflow complet',
      });
      record('Exécuter workflow', run.ok, run.steps.map((s) => s.detail).join(' · '));
    }
  }

  // 4. Laboratoire — 10 actions
  const defaultConfig: Partial<Record<WorkflowActionType, Record<string, unknown>>> = {
    send_message: { body: 'Lab sandbox message.' },
    tag_contact: { tag: 'lab_test' },
    set_lifecycle_stage: { stage: 'qualified' },
    book_session_intent: { courseType: 'visio_collectif' },
    schedule_followup: { delayHours: 24 },
  };

  if (detail.ok && contact) {
    let contactForLab = contact;
    for (const opt of WORKFLOW_ACTION_OPTIONS) {
      if (opt.id === 'escalate_human' && contactForLab.lifecycleStage === 'new') {
        await runWorkflowAction({ type: 'set_lifecycle_stage', config: { stage: 'qualified' } }, {
          conversation: detail.conversation,
          contact: contactForLab,
        });
        contactForLab = (await getContact(contact.id)) ?? contactForLab;
      }
      if (opt.id === 'broadcast_optin' && !contactForLab.optIn) {
        const { setContactOptIn } = await import('../src/lib/acquisition/engine/repository');
        await setContactOptIn(contactForLab.id, true);
        contactForLab = (await getContact(contact.id)) ?? contactForLab;
      }

      const result = await runWorkflowAction(
        { type: opt.id, config: defaultConfig[opt.id] },
        {
          conversation: detail.conversation,
          contact: contactForLab,
          inboundText: 'Bonjour, je veux essayer FitMangas en visio.',
          market: 'fr',
        },
      );
      record(`Lab: ${opt.label}`, result.ok, result.detail);
    }
  }

  const deleted = await deleteWorkflow(wfId);
  record('Supprimer workflow', deleted.ok, deleted.error ?? 'OK');

  summarize();
  const failed = checks.filter((c) => !c.ok);
  process.exit(failed.length ? 1 : 0);
}

function summarize() {
  const failed = checks.filter((c) => !c.ok);
  console.log('\n---');
  console.log(`Total: ${checks.length} | OK: ${checks.length - failed.length} | Échecs: ${failed.length}`);
  if (failed.length) {
    console.log('Échecs:');
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
