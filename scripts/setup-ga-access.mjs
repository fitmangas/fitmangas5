#!/usr/bin/env node
/**
 * Diagnostic one-shot : vérifie l’accès du compte de service à GA4 (Data API),
 * puis liste les comptes accessibles via l’Admin API si le package est disponible.
 *
 * Usage : node scripts/setup-ga-access.mjs
 *
 * Credentials (dans cet ordre) :
 *   1. GOOGLE_SERVICE_ACCOUNT_JSON (contenu JSON brut)
 *   2. Fichier ~/Downloads/fitmangas-84d22a11609a.json
 */

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const PROPERTY_ID = process.env.GA4_PROPERTY_ID?.trim() || '537748245';
const SERVICE_ACCOUNT_EMAIL = 'fitmangas-analytics@fitmangas.iam.gserviceaccount.com';
const DOWNLOADS_JSON = 'fitmangas-84d22a11609a.json';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

function loadServiceAccountJson() {
  const fromEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (fromEnv && String(fromEnv).trim().length > 20) {
    try {
      return JSON.parse(fromEnv);
    } catch (e) {
      throw new Error(`GOOGLE_SERVICE_ACCOUNT_JSON : JSON invalide (${e.message})`);
    }
  }
  const path = join(homedir(), 'Downloads', DOWNLOADS_JSON);
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf8'));
  }
  throw new Error(
    `Aucune source de credentials : définissez GOOGLE_SERVICE_ACCOUNT_JSON ou placez le fichier dans ~/Downloads/${DOWNLOADS_JSON}`,
  );
}

function toClientCredentials(json) {
  const client_email = json.client_email;
  const private_key = json.private_key;
  if (!client_email || !private_key) {
    throw new Error('JSON de compte de service invalide : client_email ou private_key manquant.');
  }
  return { client_email, private_key };
}

function isPermissionDenied(err) {
  const msg = String(err?.message || err || '');
  const code = err?.code;
  return (
    code === 7 ||
    code === 'PERMISSION_DENIED' ||
    /PERMISSION_DENIED/i.test(msg) ||
    /403/.test(msg) ||
    /User does not have sufficient permissions/i.test(msg)
  );
}

async function ensureAdminPackage() {
  try {
    await import('@google-analytics/admin');
    return true;
  } catch {
    console.log('\n→ Package @google-analytics/admin absent. Installation (npm, sans modifier package.json)…\n');
    const r = spawnSync('npm', ['install', '@google-analytics/admin', '--no-save'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    if (r.status !== 0) {
      console.error('Échec de npm install @google-analytics/admin');
      return false;
    }
    return true;
  }
}

async function testDataApi(credentials) {
  const { BetaAnalyticsDataClient } = await import('@google-analytics/data');
  const client = new BetaAnalyticsDataClient({ credentials });
  const property = `properties/${PROPERTY_ID}`;
  const [response] = await client.runReport({
    property,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    metrics: [{ name: 'sessions' }],
  });
  const total = (response.rows ?? []).reduce((acc, row) => acc + Number(row.metricValues?.[0]?.value ?? 0), 0);
  return { total, rowCount: response.rows?.length ?? 0 };
}

async function listAdminAccounts(credentials) {
  const { AnalyticsAdminServiceClient } = await import('@google-analytics/admin');
  const admin = new AnalyticsAdminServiceClient({ credentials });
  const [summaries] = await admin.listAccountSummaries();
  return summaries ?? [];
}

function printAccountSummaries(summaries) {
  console.log(`\nRésumés de comptes visibles (${summaries.length}) :\n`);
  if (!summaries.length) {
    console.log('  (aucun — le compte de service n’a probablement aucun rôle sur un compte GA)\n');
    return;
  }
  for (const s of summaries) {
    const name = s.displayName || '(sans nom)';
    const acc = s.account || '';
    console.log(`  • Compte : ${name}`);
    console.log(`    ${acc}`);
    const props = s.propertySummaries || [];
    if (props.length === 0) {
      console.log('    (aucune propriété listée)');
    } else {
      for (const p of props) {
        console.log(`    — ${p.displayName || '?'}  (${p.property || ''})`);
      }
    }
    console.log('');
  }
}

function printManualInstructions() {
  console.log(`
────────────────────────────────────────────────────────────────
Ajouter manuellement le compte de service à la propriété GA4
────────────────────────────────────────────────────────────────
E-mail à ajouter (rôle « Lecteur » ou « Analyste ») :
  ${SERVICE_ACCOUNT_EMAIL}

Interface Google Analytics :
  1. https://analytics.google.com
  2. Admin (roue) → Propriété → Gestion des accès à la propriété
  3. « + » → Ajouter des utilisateurs → coller l’e-mail ci-dessus → Lecteur → Enregistrer

API Admin (programmatique) :
  Un utilisateur humain avec droits « Administrateur » sur la propriété doit appeler
  l’API Analytics Admin (création de liens utilisateur). Le compte de service seul ne
  peut pas s’auto-inviter sans ces droits.

gcloud :
  gcloud ne rattache pas directement un utilisateur à une propriété GA4. Utilisez
  plutôt la console Analytics ci-dessus, ou l’API Admin avec des identifiants OAuth
  d’un administrateur du compte Google Analytics.

Property ID utilisé par ce script : ${PROPERTY_ID}
────────────────────────────────────────────────────────────────
`);
}

async function main() {
  console.log('FitMangas — diagnostic accès GA4 (service account)\n');
  let json;
  try {
    json = loadServiceAccountJson();
  } catch (e) {
    console.error(String(e.message || e));
    process.exit(1);
  }

  const credentials = toClientCredentials(json);
  if (credentials.client_email !== SERVICE_ACCOUNT_EMAIL) {
    console.warn(
      `⚠️  client_email dans le JSON (${credentials.client_email}) ≠ attendu (${SERVICE_ACCOUNT_EMAIL}). Le test continue quand même.\n`,
    );
  }

  console.log(`Property : properties/${PROPERTY_ID}`);
  console.log(`Compte   : ${credentials.client_email}\n`);

  console.log('— Étape 1 : @google-analytics/data — runReport (sessions, 7 derniers jours) —');

  try {
    const { total, rowCount } = await testDataApi(credentials);
    console.log(`\n✅ Le service account a accès (Data API).\n   Lignes : ${rowCount}, sessions (agrégées sur la réponse) : ${total}\n`);
  } catch (err) {
    if (isPermissionDenied(err)) {
      console.log('\n❌ Erreur 403 : il faut ajouter l’accès manuellement (propriété GA4 → gestion des accès).\n');
      printManualInstructions();
    } else {
      console.error('\n❌ Erreur Data API :', err.message || err);
    }
  }

  console.log('— Étape 2 : @google-analytics/admin — listAccountSummaries —');

  const okAdmin = await ensureAdminPackage();
  if (!okAdmin) {
    console.log('Impossible de charger l’Admin API. Arrêt.');
    process.exit(1);
  }

  try {
    const summaries = await listAdminAccounts(credentials);
    printAccountSummaries(summaries);
  } catch (err) {
    if (isPermissionDenied(err)) {
      console.log('\n⚠️  Admin API : 403 / PERMISSION_DENIED — le SA n’a pas les scopes / rôles Admin sur les comptes listés.');
      printManualInstructions();
    } else {
      console.error('\n❌ Erreur Admin API :', err.message || err);
    }
  }

  console.log('Terminé.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
