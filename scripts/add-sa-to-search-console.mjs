#!/usr/bin/env node
/**
 * Vérification DNS de fitmangas.com via Google Site Verification API (compte de service).
 *
 * Usage : node scripts/add-sa-to-search-console.mjs
 *
 * Prérequis :
 * - GOOGLE_SERVICE_ACCOUNT_JSON (recommandé) ou fichier *fitmangas*.json à la racine du projet
 * - API « Google Site Verification API » activée sur le projet Google Cloud
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

import { google } from 'googleapis';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

const VERIFICATION_METHOD = 'DNS';

function resolveSiteConfig() {
  const raw = process.env.GSC_SITE_URL?.trim();
  if (!raw) {
    return { identifier: 'https://fitmangas.com/', type: 'SITE' };
  }
  if (raw.startsWith('sc-domain:')) {
    return { identifier: raw.slice('sc-domain:'.length), type: 'INET_DOMAIN' };
  }
  return { identifier: raw, type: 'SITE' };
}

const { identifier: SITE_IDENTIFIER, type: SITE_TYPE } = resolveSiteConfig();

const SCOPES = [
  'https://www.googleapis.com/auth/siteverification',
  'https://www.googleapis.com/auth/siteverification.verify_only',
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
    console.log('→ Credentials lus depuis GOOGLE_SERVICE_ACCOUNT_JSON\n');
    return parseServiceAccountJson(fromEnv);
  }

  const filePath = findFitmangasJsonInProject(PROJECT_ROOT);
  if (filePath) {
    console.log(`→ Credentials lus depuis le fichier : ${filePath}\n`);
    return parseServiceAccountJson(readFileSync(filePath, 'utf8'));
  }

  throw new Error(
    'Aucune credential trouvée. Définissez GOOGLE_SERVICE_ACCOUNT_JSON ou placez un fichier *fitmangas*.json à la racine du projet.',
  );
}

function createAuth(credentials) {
  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES,
  });
}

function formatTxtValue(token) {
  const t = String(token ?? '').trim();
  if (!t) return '';
  if (t.toLowerCase().startsWith('google-site-verification=')) return t;
  return `google-site-verification=${t}`;
}

function waitForEnter(message) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(' FitMangas — Vérification Search Console (Site Verification API)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const credentials = loadCredentials();
  console.log(`Compte de service : ${credentials.client_email}`);
  console.log(`Site cible        : ${SITE_IDENTIFIER} (type ${SITE_TYPE})`);
  console.log(`Méthode           : ${VERIFICATION_METHOD}\n`);

  console.log('Étape 1/4 — Authentification JWT (compte de service)…');
  const auth = createAuth(credentials);
  await auth.authorize();
  console.log('✅ Authentification réussie.\n');

  const siteVerification = google.siteVerification({ version: 'v1', auth });

  const sitePayload = {
    site: {
      type: SITE_TYPE,
      identifier: SITE_IDENTIFIER,
    },
    verificationMethod: VERIFICATION_METHOD,
  };

  console.log('Étape 2/4 — Obtention du token DNS (webResource.getToken)…');
  let tokenResponse;
  try {
    const { data } = await siteVerification.webResource.getToken({
      requestBody: sitePayload,
    });
    tokenResponse = data;
  } catch (e) {
    const detail = e?.response?.data ? JSON.stringify(e.response.data, null, 2) : e.message;
    console.error('❌ Échec getToken :\n', detail);
    console.error(
      '\nNote : pour une URL (SITE), Google n’accepte parfois que FILE ou META. Pour du DNS pur, essayez GSC_SITE_URL=sc-domain:fitmangas.com avec type INET_DOMAIN.',
    );
    process.exit(1);
  }

  const txtValue = formatTxtValue(tokenResponse?.token);
  if (!txtValue) {
    console.error('❌ Aucun token retourné par l’API.');
    process.exit(1);
  }

  console.log('✅ Token obtenu.\n');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(' Étape 3/4 — Enregistrement DNS TXT à ajouter chez votre hébergeur');
  console.log('───────────────────────────────────────────────────────────────\n');
  console.log('  Type      : TXT');
  console.log('  Nom/Host  : @   (racine du domaine)');
  console.log('            ou  fitmangas.com');
  console.log(`  Valeur    : ${txtValue}`);
  console.log('\n  (Méthode API : ' + (tokenResponse?.method ?? VERIFICATION_METHOD) + ')');
  console.log('\nAttendez la propagation DNS (souvent 5 à 30 minutes, parfois plus).');
  console.log('───────────────────────────────────────────────────────────────\n');

  await waitForEnter('Quand le record TXT est en place, appuyez sur Entrée pour lancer la vérification… ');

  console.log('\nÉtape 4/4 — Finalisation (webResource.insert)…');
  try {
    const { data } = await siteVerification.webResource.insert({
      verificationMethod: VERIFICATION_METHOD,
      requestBody: {
        site: {
          type: SITE_TYPE,
          identifier: SITE_IDENTIFIER,
        },
      },
    });

    console.log('\n✅ Succès : le site est vérifié pour le compte de service.');
    console.log(`   Site     : ${SITE_IDENTIFIER}`);
    console.log(`   Propriétaire : ${credentials.client_email}`);
    if (data?.id) console.log(`   ID ressource : ${data.id}`);
    if (data?.owners?.length) {
      console.log(`   Propriétaires enregistrés : ${data.owners.join(', ')}`);
    }
    console.log(
      '\nProchaine étape : dans Google Search Console → Paramètres → Utilisateurs,',
    );
    console.log('vous pouvez aussi ajouter ce même e-mail de compte de service si besoin pour l’API GSC.');
  } catch (e) {
    const detail = e?.response?.data ? JSON.stringify(e.response.data, null, 2) : e.message;
    console.error('\n❌ Échec insert (vérification non confirmée) :\n', detail);
    console.error(
      '\nVérifiez que le TXT est bien propagé (dig TXT fitmangas.com) puis relancez le script.',
    );
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('\n❌ Erreur fatale :', e.message || e);
  process.exit(1);
});
