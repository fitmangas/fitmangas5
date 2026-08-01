/**
 * Diagnostic connexions API — LECTURE SEULE.
 * Usage : npx tsx scripts/diag-connections.ts
 * Ne log jamais la valeur d’un secret (au pire 4 derniers caractères).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

type Row = {
  integration: string;
  status: 'OK' | 'ÉCHEC' | 'SKIP' | 'PARTIEL';
  http: string;
  detail: string;
};

const rows: Row[] = [];

function loadEnvFile(file: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, 'utf8').split(/\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const root = resolve(process.cwd());
const env = {
  ...loadEnvFile(resolve(root, '.env')),
  ...loadEnvFile(resolve(root, '.env.local')),
  ...process.env,
};

function get(name: string): string | null {
  const v = env[name]?.trim();
  return v ? v : null;
}

function tail(v: string | null): string {
  if (!v) return '—';
  return v.length <= 4 ? '****' : `…${v.slice(-4)}`;
}

function push(row: Row) {
  rows.push(row);
}

async function pingGeminiText() {
  const key = get('GEMINI_API_KEY') || get('GOOGLE_GENAI_API_KEY') || get('GOOGLE_API_KEY');
  const model = get('GEMINI_MODEL') || 'gemini-2.0-flash';
  if (!key) {
    push({ integration: 'Gemini TEXTE', status: 'ÉCHEC', http: '—', detail: 'GEMINI_API_KEY absente' });
    return;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Réponds uniquement: OK' }] }],
        generationConfig: { maxOutputTokens: 8, temperature: 0 },
      }),
    });
    const body = await res.text();
    const snippet = body.replace(/\s+/g, ' ').slice(0, 280);
    push({
      integration: 'Gemini TEXTE',
      status: res.ok ? 'OK' : 'ÉCHEC',
      http: String(res.status),
      detail: `model=${model} key=${tail(key)} | ${snippet}`,
    });
  } catch (e) {
    push({
      integration: 'Gemini TEXTE',
      status: 'ÉCHEC',
      http: '—',
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function pingGeminiImage() {
  const key = get('GEMINI_API_KEY') || get('GOOGLE_GENAI_API_KEY') || get('GOOGLE_API_KEY');
  const models = [
    'gemini-3.1-flash-image-preview',
    'gemini-3.1-flash-image',
    'gemini-2.5-flash-image',
    'gemini-3-pro-image-preview',
  ];
  if (!key) {
    push({
      integration: 'Gemini IMAGE (Nano Banana)',
      status: 'ÉCHEC',
      http: '—',
      detail: 'GEMINI_API_KEY absente',
    });
    return;
  }

  const details: string[] = [];
  let anyOk = false;
  let lastHttp = '—';

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Generate a simple 4:5 editorial photo of a cream pilates mat on a beige floor. No people. No text.',
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: { aspectRatio: '4:5' },
          },
        }),
      });
      lastHttp = String(res.status);
      const data = (await res.json()) as Record<string, unknown>;
      const errObj = data.error as { message?: string; status?: string; code?: number } | undefined;
      const candidates = data.candidates as
        | Array<{ content?: { parts?: Array<Record<string, unknown>> } }>
        | undefined;
      let hasImage = false;
      for (const part of candidates?.[0]?.content?.parts ?? []) {
        const inline = part.inlineData as { data?: string } | undefined;
        if (inline?.data) hasImage = true;
      }
      if (res.ok && hasImage) {
        anyOk = true;
        details.push(`${model}: OK image bytes`);
        break;
      }
      if (res.ok && !hasImage) {
        details.push(
          `${model}: HTTP ${res.status} OK mais AUCUNE image dans candidates (keys=${Object.keys(data).join(',')})`,
        );
      } else {
        details.push(
          `${model}: HTTP ${res.status} ${errObj?.status || ''} — ${(errObj?.message || JSON.stringify(data).slice(0, 180)).replace(/\s+/g, ' ')}`,
        );
      }
    } catch (e) {
      details.push(`${model}: network ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  push({
    integration: 'Gemini IMAGE (Nano Banana)',
    status: anyOk ? 'OK' : 'ÉCHEC',
    http: lastHttp,
    detail: `key=${tail(key)} | ${details.join(' || ')}`,
  });
}

async function pingSupabase() {
  const url = get('NEXT_PUBLIC_SUPABASE_URL');
  const key = get('SUPABASE_SERVICE_ROLE_KEY') || get('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !key) {
    push({ integration: 'Supabase', status: 'ÉCHEC', http: '—', detail: 'URL ou clé absente' });
    return;
  }
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    push({
      integration: 'Supabase',
      status: res.ok || res.status === 200 || res.status === 404 ? 'OK' : 'ÉCHEC',
      http: String(res.status),
      detail: `url=${url.includes('supabase') ? 'supabase…' : 'custom'} key=${tail(key)}`,
    });
  } catch (e) {
    push({
      integration: 'Supabase',
      status: 'ÉCHEC',
      http: '—',
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function pingStripe() {
  const key = get('STRIPE_SECRET_KEY');
  if (!key) {
    push({ integration: 'Stripe', status: 'ÉCHEC', http: '—', detail: 'STRIPE_SECRET_KEY absente' });
    return;
  }
  try {
    const res = await fetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: `Bearer ${key}` },
    });
    const text = await res.text();
    push({
      integration: 'Stripe',
      status: res.ok ? 'OK' : 'ÉCHEC',
      http: String(res.status),
      detail: `key=${tail(key)} mode=${key.startsWith('sk_live') ? 'live' : key.startsWith('sk_test') ? 'test' : '?'} | ${text.replace(/\s+/g, ' ').slice(0, 160)}`,
    });
  } catch (e) {
    push({
      integration: 'Stripe',
      status: 'ÉCHEC',
      http: '—',
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function pingVimeo() {
  const token = get('VIMEO_ACCESS_TOKEN');
  if (!token) {
    push({ integration: 'Vimeo', status: 'ÉCHEC', http: '—', detail: 'VIMEO_ACCESS_TOKEN absente' });
    return;
  }
  try {
    const res = await fetch(
      'https://api.vimeo.com/me?fields=uri,name,account,upload_quota',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.vimeo.*+json;version=3.4',
        },
      },
    );
    const data = (await res.json()) as {
      name?: string;
      account?: string;
      upload_quota?: { space?: { free?: number; max?: number; used?: number; unit?: string } };
    };
    const q = data.upload_quota?.space;
    const quota =
      q && typeof q.free === 'number'
        ? `quota_free=${q.free}${q.unit || ''} max=${q.max ?? '?'} used=${q.used ?? '?'}`
        : 'quota=non exposé';
    push({
      integration: 'Vimeo',
      status: res.ok ? 'OK' : 'ÉCHEC',
      http: String(res.status),
      detail: `token=${tail(token)} name=${data.name || '?'} account=${data.account || '?'} | ${quota}`,
    });
  } catch (e) {
    push({
      integration: 'Vimeo',
      status: 'ÉCHEC',
      http: '—',
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function pingResend() {
  const key = get('RESEND_API_KEY');
  if (!key) {
    push({ integration: 'Resend', status: 'ÉCHEC', http: '—', detail: 'RESEND_API_KEY absente' });
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${key}` },
    });
    push({
      integration: 'Resend',
      status: res.ok ? 'OK' : 'ÉCHEC',
      http: String(res.status),
      detail: `key=${tail(key)} from=${get('NEWSLETTER_FROM_EMAIL') || '—'}`,
    });
  } catch (e) {
    push({
      integration: 'Resend',
      status: 'ÉCHEC',
      http: '—',
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function pingMeta() {
  const appId = get('META_APP_ID');
  const appSecret = get('META_APP_SECRET');
  if (!appId || !appSecret) {
    push({
      integration: 'Meta (IG/FB)',
      status: 'ÉCHEC',
      http: '—',
      detail: `META_APP_ID=${appId ? 'OUI' : 'NON'} META_APP_SECRET=${appSecret ? 'OUI' : 'NON'} (OAuth app non configurée en local)`,
    });
    return;
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(appId)}?access_token=${encodeURIComponent(`${appId}|${appSecret}`)}&fields=id,name`,
    );
    const text = await res.text();
    push({
      integration: 'Meta (IG/FB)',
      status: res.ok ? 'OK' : 'ÉCHEC',
      http: String(res.status),
      detail: `appId=${tail(appId)} | ${text.replace(/\s+/g, ' ').slice(0, 180)}`,
    });
  } catch (e) {
    push({
      integration: 'Meta (IG/FB)',
      status: 'ÉCHEC',
      http: '—',
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function pingPrintful() {
  const token = get('PRINTFUL_API_TOKEN');
  if (!token) {
    push({ integration: 'Printful', status: 'ÉCHEC', http: '—', detail: 'PRINTFUL_API_TOKEN absente' });
    return;
  }
  try {
    const res = await fetch('https://api.printful.com/stores', {
      headers: { Authorization: `Bearer ${token}` },
    });
    push({
      integration: 'Printful',
      status: res.ok ? 'OK' : 'ÉCHEC',
      http: String(res.status),
      detail: `token=${tail(token)} storeId=${get('PRINTFUL_STORE_ID') ? 'set' : 'absent'}`,
    });
  } catch (e) {
    push({
      integration: 'Printful',
      status: 'ÉCHEC',
      http: '—',
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function pingMistral() {
  const key = get('MISTRAL_API_KEY');
  if (!key) {
    push({ integration: 'Mistral', status: 'SKIP', http: '—', detail: 'MISTRAL_API_KEY absente' });
    return;
  }
  try {
    const res = await fetch('https://api.mistral.ai/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    push({
      integration: 'Mistral',
      status: res.ok ? 'OK' : 'ÉCHEC',
      http: String(res.status),
      detail: `key=${tail(key)} model=${get('MISTRAL_MODEL') || 'mistral-small-latest'}`,
    });
  } catch (e) {
    push({
      integration: 'Mistral',
      status: 'ÉCHEC',
      http: '—',
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function pingGroq() {
  const key = get('GROQ_API_KEY');
  if (!key) {
    push({ integration: 'Groq', status: 'SKIP', http: '—', detail: 'GROQ_API_KEY absente' });
    return;
  }
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    push({
      integration: 'Groq',
      status: res.ok ? 'OK' : 'ÉCHEC',
      http: String(res.status),
      detail: `key=${tail(key)} model=${get('GROQ_MODEL') || 'llama-3.3-70b-versatile'}`,
    });
  } catch (e) {
    push({
      integration: 'Groq',
      status: 'ÉCHEC',
      http: '—',
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function pingUnsplash() {
  const key = get('UNSPLASH_ACCESS_KEY');
  if (!key) {
    push({ integration: 'Unsplash', status: 'SKIP', http: '—', detail: 'UNSPLASH_ACCESS_KEY absente' });
    return;
  }
  try {
    const res = await fetch('https://api.unsplash.com/photos/random?orientation=portrait', {
      headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' },
    });
    push({
      integration: 'Unsplash',
      status: res.ok ? 'OK' : 'ÉCHEC',
      http: String(res.status),
      detail: `key=${tail(key)}`,
    });
  } catch (e) {
    push({
      integration: 'Unsplash',
      status: 'ÉCHEC',
      http: '—',
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function pingPollinations() {
  try {
    const res = await fetch('https://image.pollinations.ai/prompt/simple%20beige%20mat?width=64&height=64&nologo=true', {
      method: 'GET',
      signal: AbortSignal.timeout(60_000),
    });
    const buf = Buffer.from(await res.arrayBuffer());
    push({
      integration: 'Pollinations',
      status: res.ok && buf.length > 100 ? 'OK' : 'ÉCHEC',
      http: String(res.status),
      detail: `bytes=${buf.length} (pas de clé API — endpoint public)`,
    });
  } catch (e) {
    push({
      integration: 'Pollinations',
      status: 'ÉCHEC',
      http: '—',
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

function pingJitsi() {
  const appId = get('JITSI_APP_ID');
  const secret = get('JITSI_APP_SECRET');
  const domain = get('NEXT_PUBLIC_JITSI_DOMAIN');
  if (!appId || !secret || !domain) {
    push({
      integration: 'Jitsi/Jibri',
      status: 'ÉCHEC',
      http: '—',
      detail: `creds incomplets appId=${appId ? 'OUI' : 'NON'} secret=${secret ? 'OUI' : 'NON'} domain=${domain || 'NON'}`,
    });
    return;
  }
  push({
    integration: 'Jitsi/Jibri',
    status: 'PARTIEL',
    http: '—',
    detail: `creds locaux OK (pas de ping HTTP JWT ici) domain=${domain} appId=${tail(appId)}`,
  });
}

function pingAnthropic() {
  const key = get('ANTHROPIC_API_KEY') || get('CLAUDE_API_KEY');
  push({
    integration: 'Anthropic/Claude',
    status: key ? 'PARTIEL' : 'SKIP',
    http: '—',
    detail: key
      ? `clé présente ${tail(key)} (pas de ping réseau dans ce diag)`
      : 'ANTHROPIC_API_KEY / CLAUDE_API_KEY absentes — montage Reel auto Claude non dispo serveur',
  });
}

function pingGa4Gsc() {
  const ga4 = get('GA4_PROPERTY_ID');
  const sa = get('GOOGLE_SERVICE_ACCOUNT_JSON');
  const gsc = get('GSC_SITE_URL');
  push({
    integration: 'GA4',
    status: ga4 && sa ? 'PARTIEL' : 'ÉCHEC',
    http: '—',
    detail: `GA4_PROPERTY_ID=${ga4 ? 'OUI' : 'NON'} GOOGLE_SERVICE_ACCOUNT_JSON=${sa ? 'OUI' : 'NON'} (pas d’appel Data API dans ce diag)`,
  });
  push({
    integration: 'Search Console',
    status: sa ? (gsc ? 'PARTIEL' : 'PARTIEL') : 'ÉCHEC',
    http: '—',
    detail: `GSC_SITE_URL=${gsc || 'absent (défaut code possible)'} SA=${sa ? 'OUI' : 'NON'}`,
  });
}

function pingPhota() {
  const key = get('PHOTALABS_API_KEY') || get('PHOTA_API_KEY') || get('PHOTOLABS_API_KEY');
  push({
    integration: 'PHOTA/PhotoLabs',
    status: key ? 'PARTIEL' : 'SKIP',
    http: '—',
    detail: key ? `clé présente ${tail(key)} (standby produit)` : 'PHOTALABS_API_KEY absente',
  });
}

async function main() {
  console.log('=== FitMangas diag-connections (lecture seule) ===\n');
  await pingSupabase();
  await pingStripe();
  await pingVimeo();
  pingJitsi();
  await pingResend();
  await pingMeta();
  await pingPrintful();
  await pingGeminiText();
  await pingGeminiImage();
  await pingMistral();
  await pingGroq();
  pingAnthropic();
  pingGa4Gsc();
  await pingPollinations();
  await pingUnsplash();
  pingPhota();

  console.log('| Intégration | Statut | HTTP | Détail |');
  console.log('|---|---|---|---|');
  for (const r of rows) {
    console.log(`| ${r.integration} | ${r.status} | ${r.http} | ${r.detail.replace(/\|/g, '/')} |`);
  }

  // Machine-readable for the audit doc
  console.log('\n===JSON===');
  console.log(JSON.stringify(rows, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
