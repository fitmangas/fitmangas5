#!/usr/bin/env node
/**
 * Diagnostic Search Console — sites accessibles par le compte de service.
 * Usage : node scripts/debug-search-console.mjs
 *         node --env-file=.env.local scripts/debug-search-console.mjs
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { google } from 'googleapis';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

const SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/webmasters',
  'https://www.googleapis.com/auth/siteverification',
];

const TARGET_DOMAIN = 'sc-domain:fitmangas.com';
const FALLBACK_SITES = [
  'https://fitmangas.com/',
  'http://fitmangas.com/',
  'https://www.fitmangas.com/',
];

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

async function trySearchAnalytics(client, siteUrl) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  const { data } = await client.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      dimensions: ['query'],
      rowLimit: 10,
    },
  });
  return data;
}

async function probeSite(client, siteUrl) {
  try {
    const data = await trySearchAnalytics(client, siteUrl);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: formatApiError(e) };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log(' Debug Search Console — compte de service');
  console.log('═══════════════════════════════════════════════════════════\n');

  const credentials = loadCredentials();
  console.log(`Compte de service : ${credentials.client_email}`);
  console.log('Scopes JWT :');
  for (const s of SCOPES) console.log(`  · ${s}`);
  console.log('');

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES,
  });
  await auth.authorize();
  console.log('✅ JWT autorisé.\n');

  const searchconsole = google.searchconsole({ version: 'v1', auth });

  console.log('— sites.list() —\n');
  let siteEntries = [];
  let pageToken;
  do {
    const { data } = await searchconsole.sites.list({ pageToken });
    siteEntries.push(...(data.siteEntry ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  if (siteEntries.length === 0) {
    console.log('  (aucun site — le compte de service n’a aucune propriété Search Console)\n');
  } else {
    for (const entry of siteEntries) {
      console.log(`  · ${entry.siteUrl ?? '(sans URL)'}  [permissionLevel: ${entry.permissionLevel ?? '?'}]`);
    }
    console.log('');
  }

  const siteUrls = new Set(siteEntries.map((e) => e.siteUrl).filter(Boolean));
  const hasTarget = siteUrls.has(TARGET_DOMAIN);

  if (hasTarget) {
    console.log(`✅ ${TARGET_DOMAIN} est dans la liste.\n`);
    console.log('— searchanalytics.query (7 jours) —\n');
    try {
      const data = await trySearchAnalytics(searchconsole, TARGET_DOMAIN);
      const rows = data.rows ?? [];
      if (rows.length === 0) {
        console.log('  Aucune ligne (pas de trafic ou délai de données).\n');
      } else {
        for (const row of rows) {
          console.log(
            `  ${row.keys?.[0] ?? '?'} — clics: ${row.clicks ?? 0}, impressions: ${row.impressions ?? 0}`,
          );
        }
        console.log('');
      }
    } catch (e) {
      console.error('❌ searchanalytics.query a échoué malgré la présence dans sites.list :\n', formatApiError(e));
    }
  } else {
    console.log(`❌ ${TARGET_DOMAIN} n’est PAS dans sites.list.\n`);
    console.log('— Test searchanalytics sur d’autres URLs —\n');
    for (const url of FALLBACK_SITES) {
      const inList = siteUrls.has(url);
      console.log(`  ${url}`);
      console.log(`    Dans sites.list : ${inList ? 'oui' : 'non'}`);
      const result = await probeSite(searchconsole, url);
      if (result.ok) {
        console.log('    searchanalytics.query : ✅ OK');
        const rows = result.data.rows ?? [];
        if (rows.length > 0) {
          console.log(`    (${rows.length} ligne(s) — ex. « ${rows[0].keys?.[0]} »)`);
        }
      } else {
        console.log('    searchanalytics.query : ❌');
        console.log(`    ${result.error.split('\n').join('\n    ')}`);
      }
      console.log('');
    }
    console.log(
      'Conseil : la Site Verification API ne donne pas automatiquement l’accès Search Console.',
    );
    console.log(
      'Ajoutez manuellement le compte de service dans GSC → Paramètres → Utilisateurs et autorisations (rôle Complet ou Restreint).',
    );
  }
}

main().catch((e) => {
  console.error('\n❌ Erreur :', e.message || e);
  process.exit(1);
});
