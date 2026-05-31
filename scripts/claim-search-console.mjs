#!/usr/bin/env node
/**
 * Revendique une propriété Search Console pour le compte de service (sites.add).
 *
 * Usage : node scripts/claim-search-console.mjs
 *         node --env-file=.env.local scripts/claim-search-console.mjs
 *
 * Optionnel : GSC_SITE_URL=sc-domain:fitmangas.com
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { google } from 'googleapis';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

const SCOPES = [
  'https://www.googleapis.com/auth/webmasters',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/siteverification',
];

const SITE_URL = process.env.GSC_SITE_URL?.trim() || 'sc-domain:fitmangas.com';

const SKIP_DIRS = new Set(['node_modules', '.next', '.next-dev', '.git', 'dist', '.vercel']);

function parseServiceAccountJson(raw) {
  const parsed = JSON.parse(raw);
  const client_email = typeof parsed.client_email === 'string' ? parsed.client_email : '';
  const private_key = typeof parsed.private_key === 'string' ? parsed.private_key : '';
  if (!client_email || !private_key) {
    throw new Error('JSON invalide : client_email ou private_key manquant.');
  }
  return { client_email, private_key };
}

function findFitmangasJsonInProject(root) {
  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return null;
    }
    for (const name of entries) {
      if (SKIP_DIRS.has(name)) continue;
      const full = join(dir, name);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        const found = walk(full);
        if (found) return found;
      } else if (name.toLowerCase().includes('fitmangas') && name.endsWith('.json')) {
        return full;
      }
    }
    return null;
  }
  return walk(root);
}

function loadCredentials() {
  const fromEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (fromEnv && String(fromEnv).trim().length > 20) {
    console.log('→ Credentials : GOOGLE_SERVICE_ACCOUNT_JSON\n');
    return parseServiceAccountJson(fromEnv);
  }
  const filePath = findFitmangasJsonInProject(PROJECT_ROOT);
  if (filePath) {
    console.log(`→ Credentials : ${filePath}\n`);
    return parseServiceAccountJson(readFileSync(filePath, 'utf8'));
  }
  throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON manquant.');
}

function formatApiError(e) {
  if (e?.response?.data) return JSON.stringify(e.response.data, null, 2);
  return e?.message || String(e);
}

async function listAllSites(searchconsole) {
  const entries = [];
  let pageToken;
  do {
    const { data } = await searchconsole.sites.list({ pageToken });
    entries.push(...(data.siteEntry ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);
  return entries;
}

function siteIsListed(entries, siteUrl) {
  return entries.some((e) => e.siteUrl === siteUrl);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log(' Revendication Search Console (sites.add)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const credentials = loadCredentials();
  console.log(`Compte de service : ${credentials.client_email}`);
  console.log(`Site cible         : ${SITE_URL}\n`);

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES,
  });
  await auth.authorize();
  console.log('✅ Authentification JWT réussie.\n');

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  console.log('Étape 1/3 — sites.add (équivalent webmasters.sites.add)…');
  try {
    await searchconsole.sites.add({ siteUrl: SITE_URL });
    console.log(`✅ sites.add OK pour ${SITE_URL}\n`);
  } catch (e) {
    const msg = formatApiError(e);
    const already =
      e?.code === 409 ||
      String(msg).includes('already exists') ||
      String(msg).includes('already own') ||
      String(msg).includes('ALREADY_EXISTS');
    if (already) {
      console.log(`ℹ️  Le site est déjà présent ou déjà revendiqué :\n${msg}\n`);
    } else {
      console.error(`❌ sites.add a échoué :\n${msg}\n`);
      console.error(
        'Le compte de service doit souvent être propriétaire vérifié (Site Verification) ou invité manuellement dans GSC.',
      );
      process.exit(1);
    }
  }

  console.log('Étape 2/3 — sites.list (confirmation)…\n');
  const entries = await listAllSites(searchconsole);
  if (entries.length === 0) {
    console.log('  (aucune propriété listée)\n');
  } else {
    for (const entry of entries) {
      console.log(`  · ${entry.siteUrl}  [${entry.permissionLevel ?? '?'}]`);
    }
    console.log('');
  }

  if (!siteIsListed(entries, SITE_URL)) {
    console.error(`❌ ${SITE_URL} n’apparaît pas dans sites.list après sites.add.`);
    console.error('Vérifiez la propriété dans l’interface Search Console ou les droits du compte de service.');
    process.exit(1);
  }

  console.log(`✅ ${SITE_URL} est visible dans Search Console pour ce compte.\n`);

  console.log('Étape 3/3 — Test searchanalytics.query (7 derniers jours)…\n');
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  try {
    const { data } = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        dimensions: ['query'],
        rowLimit: 15,
      },
    });
    const rows = data.rows ?? [];
    if (rows.length === 0) {
      console.log('  Aucune donnée (pas de requêtes ou délai de traitement Google).\n');
    } else {
      for (const row of rows) {
        console.log(
          `  ${row.keys?.[0] ?? '?'} — clics: ${row.clicks ?? 0}, impressions: ${row.impressions ?? 0}, position: ${row.position ?? '—'}`,
        );
      }
      console.log('');
    }
    console.log('✅ Succès : le compte de service peut interroger l’API Search Console pour ce site.');
  } catch (e) {
    console.error('❌ searchanalytics.query a échoué :\n', formatApiError(e));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('\n❌ Erreur fatale :', e.message || e);
  process.exit(1);
});
