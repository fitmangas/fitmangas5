/**
 * Webhook Printful : secret partagé sans jamais l'afficher.
 *
 * L'API Printful v1 (celle du site) ne signe pas ses webhooks : le secret est passé dans l'URL enregistrée
 * chez Printful (`https://fitmangas.com/api/webhooks/printful?token=…`) et dans Vercel (`PRINTFUL_WEBHOOK_SECRET`).
 * La route le vérifie (src/lib/printful-webhook-auth.ts).
 *
 *   set -a && source .env.local; set +a
 *   npx tsx scripts/chantier-oct/setup-printful-webhook.ts            # lecture seule : état actuel
 *   npx tsx scripts/chantier-oct/setup-printful-webhook.ts --apply    # secret → Vercel (production) → Printful → .env.local
 *   npx tsx scripts/chantier-oct/setup-printful-webhook.ts --verify   # après déploiement : 401 sans jeton, 200 avec
 *
 * Le secret n'est jamais écrit dans la console. Aucun webhook n'est créé s'il n'en existe pas déjà un vers fitmangas.com.
 */
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE_HOST = 'fitmangas.com';
const ROUTE_PATH = '/api/webhooks/printful';
const ENV_FILE = join(process.cwd(), '.env.local');
const VERCEL_CLI = ['--yes', 'vercel@58.7.1'];

type WebhookConfig = { url: string | null; types: string[]; params?: Record<string, unknown> };

function printfulHeaders(): Record<string, string> {
  const token = process.env.PRINTFUL_API_TOKEN?.trim();
  if (!token) throw new Error('PRINTFUL_API_TOKEN manquant (charger .env.local).');
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const storeId = process.env.PRINTFUL_STORE_ID?.trim();
  if (storeId) headers['X-PF-Store-Id'] = storeId;
  return headers;
}

async function getConfig(): Promise<WebhookConfig> {
  const res = await fetch('https://api.printful.com/webhooks', { headers: printfulHeaders() });
  const json = (await res.json().catch(() => null)) as { code?: number; result?: WebhookConfig; error?: { message?: string } } | null;
  if (!res.ok || !json || json.code !== 200 || !json.result) {
    throw new Error(`Printful GET /webhooks : ${res.status} ${json?.error?.message ?? ''}`.trim());
  }
  return { url: json.result.url ?? null, types: json.result.types ?? [], params: json.result.params };
}

function describeUrl(url: string | null): string {
  if (!url) return '(aucune)';
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}${u.search ? ' (avec paramètres, masqués)' : ''}`;
  } catch {
    return '(URL illisible)';
  }
}

function pointsToSite(url: string | null): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return (u.host === SITE_HOST || u.host === `www.${SITE_HOST}`) && u.pathname === ROUTE_PATH;
  } catch {
    return false;
  }
}

function setVercelSecret(value: string) {
  const run = spawnSync(
    'npx',
    [...VERCEL_CLI, 'env', 'add', 'PRINTFUL_WEBHOOK_SECRET', 'production', '--sensitive', '--force'],
    { input: value, encoding: 'utf8', cwd: process.cwd() },
  );
  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`.split(value).join('***');
  if (run.status !== 0) {
    throw new Error(`Vercel CLI (env add) a échoué (code ${run.status}) :\n${output.slice(-1500)}`);
  }
}

function writeEnvLocal(value: string) {
  let content = '';
  try {
    content = readFileSync(ENV_FILE, 'utf8');
  } catch {
    content = '';
  }
  const line = `PRINTFUL_WEBHOOK_SECRET=${value}`;
  const next = /^PRINTFUL_WEBHOOK_SECRET=.*$/m.test(content)
    ? content.replace(/^PRINTFUL_WEBHOOK_SECRET=.*$/m, line)
    : `${content.replace(/\s*$/, '')}\n${line}\n`;
  writeFileSync(ENV_FILE, next, 'utf8');
}

async function check() {
  const config = await getConfig();
  console.log(`Webhook Printful configuré : ${config.url ? 'oui' : 'non'}`);
  console.log(`URL : ${describeUrl(config.url)}`);
  console.log(`Événements : ${config.types.length ? config.types.join(', ') : '(aucun)'}`);
  console.log(`Pointe vers ${SITE_HOST}${ROUTE_PATH} : ${pointsToSite(config.url) ? 'oui' : 'non'}`);
  console.log(`PRINTFUL_WEBHOOK_SECRET dans l'environnement local : ${process.env.PRINTFUL_WEBHOOK_SECRET?.trim() ? 'oui' : 'non'}`);
  return config;
}

async function apply() {
  const config = await check();
  if (!pointsToSite(config.url)) {
    console.log('\nAucun webhook Printful vers le site : rien n’est créé ni modifié chez Printful.');
    console.log('La route reste protégée (503 en production tant que PRINTFUL_WEBHOOK_SECRET manque, ce qui est sans effet sans webhook).');
    return;
  }
  const secret = randomBytes(32).toString('hex');

  // 1) Vercel d'abord : si cette étape échoue, Printful n'est pas touché (pas de décalage).
  setVercelSecret(secret);
  console.log('\n1/3 Vercel (production) : PRINTFUL_WEBHOOK_SECRET enregistré (valeur masquée).');

  // 2) Printful : même URL + jeton, mêmes événements.
  const url = new URL(config.url as string);
  url.searchParams.set('token', secret);
  const body: Record<string, unknown> = { url: url.toString(), types: config.types };
  if (config.params && Object.keys(config.params).length) body.params = config.params;
  const res = await fetch('https://api.printful.com/webhooks', {
    method: 'POST',
    headers: printfulHeaders(),
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => null)) as { code?: number; error?: { message?: string } } | null;
  if (!res.ok || json?.code !== 200) {
    throw new Error(`Printful POST /webhooks : ${res.status} ${json?.error?.message ?? ''} — Vercel a déjà le nouveau secret : relancer --apply.`);
  }
  const after = await getConfig();
  const tokenOk = (() => {
    try {
      return new URL(after.url ?? '').searchParams.get('token') === secret;
    } catch {
      return false;
    }
  })();
  console.log(`2/3 Printful : URL mise à jour avec le jeton (${tokenOk ? 'vérifié' : 'NON vérifié'}), événements : ${after.types.join(', ') || '(aucun)'}.`);
  if (!tokenOk) throw new Error('Le jeton relu chez Printful ne correspond pas.');

  // 3) .env.local (même valeur, jamais affichée).
  writeEnvLocal(secret);
  console.log('3/3 .env.local : PRINTFUL_WEBHOOK_SECRET mis à jour.');
  console.log('\nÀ faire ensuite : déployer, puis lancer --verify.');
}

async function verify() {
  const secret = process.env.PRINTFUL_WEBHOOK_SECRET?.trim();
  const endpoint = `https://${SITE_HOST}${ROUTE_PATH}`;
  const body = JSON.stringify({ type: 'ping', data: {} });
  const withoutToken = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  console.log(`Sans jeton : HTTP ${withoutToken.status} (attendu 401)`);
  if (!secret) {
    console.log('Pas de PRINTFUL_WEBHOOK_SECRET local : test avec jeton impossible.');
    return;
  }
  const withToken = await fetch(`${endpoint}?token=${encodeURIComponent(secret)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const json = (await withToken.json().catch(() => null)) as Record<string, unknown> | null;
  console.log(`Avec jeton : HTTP ${withToken.status} (attendu 200), réponse : ${JSON.stringify(json)}`);
}

async function main() {
  const mode = process.argv.includes('--apply') ? 'apply' : process.argv.includes('--verify') ? 'verify' : 'check';
  if (mode === 'apply') await apply();
  else if (mode === 'verify') await verify();
  else await check();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
