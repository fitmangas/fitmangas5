/**
 * Crée le template marketing WhatsApp `quiz_essai_fitmangas` (corps statique, sans {{vars}}).
 * Prérequis : WABA avec moyen de paiement OK (sinon Graph refuse / health BLOCKED).
 *
 * Usage : npx tsx scripts/create-wa-template-quiz-essai.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      const key = m[1]!;
      let val = m[2]!.trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* ignore */
  }
}

loadEnvLocal();

const WABA = process.env.WHATSAPP_WABA_ID?.trim();
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN?.trim();

const BODY_FR =
  'Salut ! Tu as terminé ton test FitMangas ✨\n\n' +
  'Tu peux démarrer l’essai gratuit 7 jours des cours collectifs en visio avec Alejandra — sans engagement.\n\n' +
  'Réserve ta place : fitmangas.com/?offer=v-coll\n\n' +
  'Réponds à ce message si tu as une question.';

async function main() {
  if (!WABA || !TOKEN) {
    console.error('WHATSAPP_WABA_ID / WHATSAPP_ACCESS_TOKEN manquants.');
    process.exit(1);
  }

  const listRes = await fetch(
    `https://graph.facebook.com/v21.0/${WABA}/message_templates?name=quiz_essai_fitmangas&access_token=${encodeURIComponent(TOKEN)}`,
  );
  const listJ = (await listRes.json()) as { data?: unknown[]; error?: { message?: string } };
  if (listJ.error) {
    console.error('List templates error:', listJ.error.message);
    process.exit(1);
  }
  if (Array.isArray(listJ.data) && listJ.data.length > 0) {
    console.log('Template quiz_essai_fitmangas existe déjà.');
    console.log(JSON.stringify(listJ.data[0], null, 2));
    return;
  }

  const payload = {
    name: 'quiz_essai_fitmangas',
    language: 'fr',
    category: 'MARKETING',
    components: [
      {
        type: 'BODY',
        text: BODY_FR,
      },
    ],
  };

  const createRes = await fetch(
    `https://graph.facebook.com/v21.0/${WABA}/message_templates`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );
  const createJ = await createRes.json();
  console.log('HTTP', createRes.status);
  console.log(JSON.stringify(createJ, null, 2));
  if (!createRes.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
