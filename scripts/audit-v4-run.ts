/**
 * AUDIT v4 — tests image/texte/meta/biblio (lecture seule app, écrit /tmp/audit-images + stdout JSON)
 * Usage: npx tsx scripts/audit-v4-run.ts
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';
import { execSync } from 'node:child_process';

const OUT_DIR = '/tmp/audit-images';
const ROOT = process.cwd();
mkdirSync(OUT_DIR, { recursive: true });

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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}

const env = { ...loadEnvFile(resolve(ROOT, '.env')), ...loadEnvFile(resolve(ROOT, '.env.local')), ...process.env };
const get = (k: string) => (env[k]?.trim() ? env[k]!.trim() : null);
const tail = (v: string | null) => (!v ? '—' : v.length <= 4 ? '****' : `…${v.slice(-4)}`);

const REF_PROMPT =
  'Editorial lifestyle photograph, 4:5 portrait format. A Pilates instructor\'s hands and forearm entering the frame from the left edge, gently adjusting the shoulder alignment of a woman lying on a cream Pilates mat. The student is in profile, eyes closed, serene relaxed expression, natural skin texture, mid-30s. Close-medium framing showing head and shoulders. Background: warm off-white textured plaster wall, softly blurred, shallow depth of field (50mm f/2 look). Soft natural side light from a window, gentle shadows, no flash. Single color accent: a terracotta clay-colored towel or top, everything else in cream, warm beige and natural skin tones. Muted desaturated palette, subtle film grain, premium wellness editorial style, not stock photography. Large negative space in the upper third of the frame. No text, no logo, no watermark.';

type ImgResult = {
  provider: string;
  model: string;
  status: string;
  http: string;
  detail: string;
  path: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  ms: number;
  costHint: string;
};

const imageResults: ImgResult[] = [];

function probeImageSize(buf: Buffer): { width: number | null; height: number | null } {
  // PNG
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // JPEG SOF
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1]!;
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      const len = buf.readUInt16BE(i + 2);
      i += 2 + len;
    }
  }
  return { width: null, height: null };
}

function saveBuf(name: string, buf: Buffer): { path: string; width: number | null; height: number | null; bytes: number } {
  const isPng = buf[0] === 0x89;
  const path = join(OUT_DIR, `${name}${isPng ? '.png' : '.jpg'}`);
  writeFileSync(path, buf);
  const dim = probeImageSize(buf);
  return { path, ...dim, bytes: buf.length };
}

async function geminiGenerateImage(model: string, prompt: string, fileTag: string): Promise<ImgResult> {
  const key = get('GEMINI_API_KEY');
  const t0 = Date.now();
  if (!key) {
    return {
      provider: 'gemini-api',
      model,
      status: 'ÉCHEC',
      http: '—',
      detail: 'no key',
      path: null,
      width: null,
      height: null,
      bytes: null,
      ms: 0,
      costHint: '—',
    };
  }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio: '4:5' },
        },
      }),
    });
    const ms = Date.now() - t0;
    const data = (await res.json()) as Record<string, unknown>;
    const err = data.error as { message?: string; status?: string } | undefined;
    const candidates = data.candidates as Array<{ content?: { parts?: Array<Record<string, unknown>> } }> | undefined;
    let b64: string | null = null;
    let mime = 'image/png';
    for (const part of candidates?.[0]?.content?.parts ?? []) {
      const inline = (part.inlineData || part.inline_data) as { data?: string; mimeType?: string; mime_type?: string } | undefined;
      if (inline?.data) {
        b64 = inline.data;
        mime = inline.mimeType || inline.mime_type || mime;
      }
    }
    if (res.ok && b64) {
      const buf = Buffer.from(b64, 'base64');
      const saved = saveBuf(`gemini-api-${fileTag}`, buf);
      return {
        provider: 'gemini-api',
        model,
        status: 'OK',
        http: String(res.status),
        detail: `mime=${mime}`,
        path: saved.path,
        width: saved.width,
        height: saved.height,
        bytes: saved.bytes,
        ms,
        costHint: model.includes('pro') ? '~paid' : 'free-tier-or-paid',
      };
    }
    return {
      provider: 'gemini-api',
      model,
      status: 'ÉCHEC',
      http: String(res.status),
      detail: (err?.message || JSON.stringify(data).slice(0, 400)).replace(/\s+/g, ' '),
      path: null,
      width: null,
      height: null,
      bytes: null,
      ms,
      costHint: '—',
    };
  } catch (e) {
    return {
      provider: 'gemini-api',
      model,
      status: 'ÉCHEC',
      http: '—',
      detail: e instanceof Error ? e.message : String(e),
      path: null,
      width: null,
      height: null,
      bytes: null,
      ms: Date.now() - t0,
      costHint: '—',
    };
  }
}

async function imagenPredict(model: string, prompt: string, fileTag: string): Promise<ImgResult> {
  const key = get('GEMINI_API_KEY');
  const t0 = Date.now();
  if (!key) {
    return {
      provider: 'imagen-predict',
      model,
      status: 'ÉCHEC',
      http: '—',
      detail: 'no key',
      path: null,
      width: null,
      height: null,
      bytes: null,
      ms: 0,
      costHint: '—',
    };
  }
  // Google AI Studio / generativelanguage Imagen predict endpoint
  const urls = [
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:predict?key=${encodeURIComponent(key)}`,
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateImages?key=${encodeURIComponent(key)}`,
  ];
  let lastDetail = '';
  let lastHttp = '—';
  for (const url of urls) {
    try {
      const body =
        url.includes(':predict')
          ? {
              instances: [{ prompt }],
              parameters: { sampleCount: 1, aspectRatio: '3:4' },
            }
          : {
              prompt,
              config: { numberOfImages: 1, aspectRatio: '3:4' },
            };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      lastHttp = String(res.status);
      const data = (await res.json()) as Record<string, unknown>;
      const err = data.error as { message?: string } | undefined;
      lastDetail = (err?.message || JSON.stringify(data).slice(0, 350)).replace(/\s+/g, ' ');

      // predict predictions[].bytesBase64Encoded or generatedImages
      const predictions = data.predictions as Array<Record<string, unknown>> | undefined;
      const gen = data.generatedImages as Array<{ image?: { imageBytes?: string } }> | undefined;
      let b64: string | null = null;
      if (predictions?.[0]?.bytesBase64Encoded) b64 = String(predictions[0].bytesBase64Encoded);
      if (predictions?.[0]?.bytesBase64Encoded === undefined && predictions?.[0]?.image) {
        const img = predictions[0].image as { bytesBase64Encoded?: string };
        b64 = img.bytesBase64Encoded || null;
      }
      if (!b64 && gen?.[0]?.image?.imageBytes) b64 = gen[0].image.imageBytes;
      // nested
      const nested = JSON.stringify(data);
      const m = nested.match(/"bytesBase64Encoded"\s*:\s*"([A-Za-z0-9+/=]{200,})"/);
      if (!b64 && m?.[1]) b64 = m[1];

      if (res.ok && b64) {
        const buf = Buffer.from(b64, 'base64');
        const saved = saveBuf(`imagen-${fileTag}`, buf);
        return {
          provider: 'imagen-predict',
          model,
          status: 'OK',
          http: lastHttp,
          detail: `endpoint=${url.includes(':predict') ? 'predict' : 'generateImages'}`,
          path: saved.path,
          width: saved.width,
          height: saved.height,
          bytes: saved.bytes,
          ms: Date.now() - t0,
          costHint: 'imagen quota séparée',
        };
      }
    } catch (e) {
      lastDetail = e instanceof Error ? e.message : String(e);
    }
  }
  return {
    provider: 'imagen-predict',
    model,
    status: 'ÉCHEC',
    http: lastHttp,
    detail: lastDetail,
    path: null,
    width: null,
    height: null,
    bytes: null,
    ms: Date.now() - t0,
    costHint: '—',
  };
}

async function vertexExpressImage(model: string, prompt: string, fileTag: string): Promise<ImgResult> {
  const t0 = Date.now();
  // Try Express Mode / API key for Vertex if GOOGLE_API_KEY style, or SA
  const apiKey = get('GEMINI_API_KEY') || get('GOOGLE_API_KEY');
  let projectId: string | null = get('GOOGLE_CLOUD_PROJECT') || get('GCLOUD_PROJECT') || get('GCP_PROJECT');
  try {
    const sa = JSON.parse(get('GOOGLE_SERVICE_ACCOUNT_JSON') || '{}') as { project_id?: string };
    if (!projectId && sa.project_id) projectId = sa.project_id;
  } catch {
    /* ignore */
  }
  if (!projectId || !apiKey) {
    return {
      provider: 'vertex',
      model,
      status: 'SKIP',
      http: '—',
      detail: `project=${projectId || 'ABSENT'} key=${apiKey ? 'OUI' : 'NON'} — Express Mode non confirmé sans projet Gemini dédié`,
      path: null,
      width: null,
      height: null,
      bytes: null,
      ms: 0,
      costHint: '—',
    };
  }
  // Vertex Generative AI with API key (Express) — regional endpoint
  const locations = ['us-central1', 'global'];
  let last = '';
  let lastHttp = '—';
  for (const loc of locations) {
    const host = loc === 'global' ? 'aiplatform.googleapis.com' : `${loc}-aiplatform.googleapis.com`;
    const url = `https://${host}/v1/projects/${projectId}/locations/${loc}/publishers/google/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      });
      lastHttp = String(res.status);
      const data = (await res.json()) as Record<string, unknown>;
      const err = data.error as { message?: string } | undefined;
      last = (err?.message || JSON.stringify(data).slice(0, 300)).replace(/\s+/g, ' ');
      const candidates = data.candidates as Array<{ content?: { parts?: Array<Record<string, unknown>> } }> | undefined;
      let b64: string | null = null;
      for (const part of candidates?.[0]?.content?.parts ?? []) {
        const inline = (part.inlineData || part.inline_data) as { data?: string } | undefined;
        if (inline?.data) b64 = inline.data;
      }
      if (res.ok && b64) {
        const saved = saveBuf(`vertex-${fileTag}`, Buffer.from(b64, 'base64'));
        return {
          provider: 'vertex',
          model,
          status: 'OK',
          http: lastHttp,
          detail: `loc=${loc} project=${projectId}`,
          path: saved.path,
          width: saved.width,
          height: saved.height,
          bytes: saved.bytes,
          ms: Date.now() - t0,
          costHint: 'vertex free/express?',
        };
      }
    } catch (e) {
      last = e instanceof Error ? e.message : String(e);
    }
  }
  return {
    provider: 'vertex',
    model,
    status: 'ÉCHEC',
    http: lastHttp,
    detail: `project=${projectId} | ${last}`,
    path: null,
    width: null,
    height: null,
    bytes: null,
    ms: Date.now() - t0,
    costHint: '—',
  };
}

async function cloudflareFlux(prompt: string): Promise<ImgResult> {
  const account = get('CLOUDFLARE_ACCOUNT_ID');
  const token = get('CLOUDFLARE_API_TOKEN');
  const t0 = Date.now();
  if (!account || !token) {
    return {
      provider: 'cloudflare',
      model: '@cf/black-forest-labs/flux-1-schnell',
      status: 'SKIP',
      http: '—',
      detail: 'CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN absents',
      path: null,
      width: null,
      height: null,
      bytes: null,
      ms: 0,
      costHint: '10k neurons/jour si configuré',
    };
  }
  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/@cf/black-forest-labs/flux-1-schnell`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, width: 1024, height: 1280 }),
    });
    const ms = Date.now() - t0;
    if (!res.ok) {
      const t = await res.text();
      return {
        provider: 'cloudflare',
        model: '@cf/black-forest-labs/flux-1-schnell',
        status: 'ÉCHEC',
        http: String(res.status),
        detail: t.slice(0, 300),
        path: null,
        width: null,
        height: null,
        bytes: null,
        ms,
        costHint: '—',
      };
    }
    const ctype = res.headers.get('content-type') || '';
    let buf: Buffer;
    if (ctype.includes('json')) {
      const data = (await res.json()) as { result?: { image?: string } };
      const b64 = data.result?.image;
      if (!b64) {
        return {
          provider: 'cloudflare',
          model: '@cf/black-forest-labs/flux-1-schnell',
          status: 'ÉCHEC',
          http: String(res.status),
          detail: 'JSON sans image',
          path: null,
          width: null,
          height: null,
          bytes: null,
          ms,
          costHint: '—',
        };
      }
      buf = Buffer.from(b64, 'base64');
    } else {
      buf = Buffer.from(await res.arrayBuffer());
    }
    const saved = saveBuf('cloudflare-flux-1-schnell', buf);
    return {
      provider: 'cloudflare',
      model: '@cf/black-forest-labs/flux-1-schnell',
      status: 'OK',
      http: String(res.status),
      detail: '1024x1280 demandé',
      path: saved.path,
      width: saved.width,
      height: saved.height,
      bytes: saved.bytes,
      ms,
      costHint: 'Workers AI neurons',
    };
  } catch (e) {
    return {
      provider: 'cloudflare',
      model: '@cf/black-forest-labs/flux-1-schnell',
      status: 'ÉCHEC',
      http: '—',
      detail: e instanceof Error ? e.message : String(e),
      path: null,
      width: null,
      height: null,
      bytes: null,
      ms: Date.now() - t0,
      costHint: '—',
    };
  }
}

async function geminiText(prompt: string, model = 'gemini-2.5-flash'): Promise<string> {
  const key = get('GEMINI_API_KEY')!;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 1200 },
    }),
  });
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
}

async function claudeText(prompt: string): Promise<string | null> {
  const key = get('ANTHROPIC_API_KEY') || get('CLAUDE_API_KEY');
  if (!key) return null;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: get('ANTHROPIC_MODEL') || 'claude-sonnet-4-5',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = (await res.json()) as { content?: Array<{ text?: string }>; error?: { message?: string } };
  if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
  return data.content?.map((c) => c.text || '').join('') || '';
}

async function billingProbe() {
  const key = get('GEMINI_API_KEY');
  const out: Record<string, unknown> = {
    geminiKeyTail: tail(key),
    geminiModelEnv: get('GEMINI_MODEL'),
    cloudflare: Boolean(get('CLOUDFLARE_ACCOUNT_ID') && get('CLOUDFLARE_API_TOKEN')),
    anthropic: Boolean(get('ANTHROPIC_API_KEY') || get('CLAUDE_API_KEY')),
  };
  try {
    const sa = JSON.parse(get('GOOGLE_SERVICE_ACCOUNT_JSON') || '{}') as { project_id?: string; client_email?: string };
    out.saProjectId = sa.project_id || null;
    out.saEmailDomain = sa.client_email?.split('@')[1] || null;
  } catch {
    out.saProjectId = null;
  }
  // List models — see which image models appear for this key
  if (key) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}&pageSize=200`);
      const data = (await res.json()) as { models?: Array<{ name?: string; supportedGenerationMethods?: string[] }> };
      const names = (data.models || []).map((m) => (m.name || '').replace('models/', ''));
      out.listModelsHttp = res.status;
      out.imageishModels = names.filter((n) => /image|imagen/i.test(n)).slice(0, 40);
      out.totalModels = names.length;
    } catch (e) {
      out.listModelsError = e instanceof Error ? e.message : String(e);
    }
  }
  // Note: billing account cannot be read from AI Studio API key alone
  out.billingNote =
    'Le compte de facturation Google Cloud n’est PAS exposé via GEMINI_API_KEY (AI Studio). Seul un projet Cloud lié / console Billing peut le confirmer. Les 429 free_tier limit:0 indiquent palier gratuit sans quota image.';
  return out;
}

async function metaProbe() {
  // Read admin_settings via supabase service role
  const url = get('NEXT_PUBLIC_SUPABASE_URL');
  const key = get('SUPABASE_SERVICE_ROLE_KEY');
  const result: Record<string, unknown> = {};
  if (!url || !key) {
    result.error = 'Supabase creds manquantes';
    return result;
  }
  const res = await fetch(
    `${url.replace(/\/$/, '')}/rest/v1/admin_settings?key=eq.meta_social_connection&select=value`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  result.settingsHttp = res.status;
  if (!res.ok) {
    result.settingsBody = (await res.text()).slice(0, 200);
    return result;
  }
  const rows = (await res.json()) as Array<{ value?: string }>;
  if (!rows[0]?.value) {
    result.stored = false;
    return result;
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(String(rows[0].value));
  } catch {
    result.parseError = true;
    return result;
  }
  const pageId = String(parsed.pageId || '');
  const igUserId = String(parsed.igUserId || '');
  const token = String(parsed.accessToken || '');
  result.stored = true;
  result.connected = Boolean(parsed.connected);
  result.pageId = pageId || null;
  result.igUserId = igUserId || null;
  result.idsIdentical = pageId && igUserId ? pageId === igUserId : null;
  result.pageName = parsed.pageName || null;
  result.igUsername = parsed.igUsername || null;
  result.tokenPresent = Boolean(token);
  result.tokenTail = tail(token);
  result.tokenExpiresAt = parsed.tokenExpiresAt || null;

  if (token) {
    // debug token
    try {
      const dbg = await fetch(
        `https://graph.facebook.com/v21.0/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`,
      );
      const dbgData = (await dbg.json()) as { data?: { is_valid?: boolean; expires_at?: number; scopes?: string[]; type?: string }; error?: { message?: string } };
      result.debugTokenHttp = dbg.status;
      result.tokenValid = dbgData.data?.is_valid ?? null;
      result.tokenType = dbgData.data?.type ?? null;
      result.tokenExpiresUnix = dbgData.data?.expires_at ?? null;
      result.tokenScopes = dbgData.data?.scopes ?? null;
      result.debugError = dbgData.error?.message ?? null;
    } catch (e) {
      result.debugError = e instanceof Error ? e.message : String(e);
    }
    try {
      const me = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`,
      );
      const meData = (await me.json()) as { data?: unknown; error?: { message?: string } };
      result.meAccountsHttp = me.status;
      result.meAccounts = meData.data ?? null;
      result.meAccountsError = meData.error?.message ?? null;
    } catch (e) {
      result.meAccountsError = e instanceof Error ? e.message : String(e);
    }
    if (pageId) {
      try {
        const page = await fetch(
          `https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}?fields=id,name,instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`,
        );
        const pageData = (await page.json()) as Record<string, unknown>;
        result.pageHttp = page.status;
        result.pagePayload = pageData;
      } catch (e) {
        result.pageError = e instanceof Error ? e.message : String(e);
      }
    }
  }
  return result;
}

function libraryInventory() {
  const lib = resolve(ROOT, 'public/library');
  const out: Record<string, unknown> = { rootExists: existsSync(lib), folders: {} as Record<string, unknown> };
  if (!existsSync(lib)) return out;
  const walk = (dir: string): Array<{ file: string; w: number | null; h: number | null; bytes: number }> => {
    const items: Array<{ file: string; w: number | null; h: number | null; bytes: number }> = [];
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) continue;
      const ext = extname(name).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;
      const buf = readFileSync(p);
      const dim = probeImageSize(buf);
      items.push({ file: name, w: dim.width, h: dim.height, bytes: st.size });
    }
    return items;
  };
  const folders: Record<string, unknown> = {};
  let total = 0;
  for (const name of readdirSync(lib)) {
    const p = join(lib, name);
    if (!statSync(p).isDirectory()) continue;
    // recursive one level of subdirs
    const files = walk(p);
    // also nested
    for (const sub of readdirSync(p)) {
      const sp = join(p, sub);
      if (statSync(sp).isDirectory()) files.push(...walk(sp).map((f) => ({ ...f, file: `${sub}/${f.file}` })));
    }
    total += files.length;
    const usable11 = files.filter((f) => f.w && f.h && Math.abs(f.w / f.h - 1) < 0.08);
    const usable45 = files.filter((f) => f.w && f.h && Math.abs(f.w / f.h - 0.8) < 0.08);
    folders[name] = {
      count: files.length,
      files: files.map((f) => ({
        file: f.file,
        dims: f.w && f.h ? `${f.w}x${f.h}` : '?',
        ratio: f.w && f.h ? Number((f.w / f.h).toFixed(3)) : null,
        ok1x1: Boolean(f.w && f.h && Math.abs(f.w / f.h - 1) < 0.08),
        ok4x5: Boolean(f.w && f.h && Math.abs(f.w / f.h - 0.8) < 0.08),
        minSide: f.w && f.h ? Math.min(f.w, f.h) : null,
      })),
      usable1x1: usable11.length,
      usable4x5: usable45.length,
    };
  }
  // also root-level alejandra in public/
  out.folders = folders;
  out.totalInLibraryTree = total;
  // public root photos matching alejandra
  const pub = resolve(ROOT, 'public');
  const rootPhotos = readdirSync(pub)
    .filter((n) => /\.(jpg|jpeg|png|webp)$/i.test(n))
    .map((n) => {
      const buf = readFileSync(join(pub, n));
      const dim = probeImageSize(buf);
      return { file: n, dims: dim.width && dim.height ? `${dim.width}x${dim.height}` : '?' };
    });
  out.publicRootImages = rootPhotos;
  return out;
}

async function main() {
  console.log('=== AUDIT V4 RUN ===');
  const billing = await billingProbe();
  console.log('\n--- BILLING/PROJECT ---');
  console.log(JSON.stringify(billing, null, 2));

  const flashModels = [
    'gemini-2.5-flash-image',
    'gemini-3.1-flash-image',
    'gemini-2.0-flash-preview-image-generation',
  ];
  const proModels = ['gemini-3-pro-image-preview', 'gemini-3-pro-image'];
  const imagenModels = [
    'imagen-3.0-generate-002',
    'imagen-3.0-generate-001',
    'imagen-4.0-generate-001',
    'imagen-4.0-fast-generate-001',
  ];

  console.log('\n--- FLASH IMAGE ---');
  for (const m of flashModels) {
    const r = await geminiGenerateImage(m, REF_PROMPT, m.replace(/[^a-z0-9.-]/gi, '_'));
    imageResults.push(r);
    console.log(JSON.stringify(r));
  }
  console.log('\n--- PRO IMAGE ---');
  for (const m of proModels) {
    const r = await geminiGenerateImage(m, REF_PROMPT, m.replace(/[^a-z0-9.-]/gi, '_'));
    imageResults.push(r);
    console.log(JSON.stringify(r));
  }
  console.log('\n--- IMAGEN PREDICT ---');
  for (const m of imagenModels) {
    const r = await imagenPredict(m, REF_PROMPT, m.replace(/[^a-z0-9.-]/gi, '_'));
    imageResults.push(r);
    console.log(JSON.stringify(r));
  }
  console.log('\n--- VERTEX ---');
  for (const m of ['gemini-2.5-flash-image', 'gemini-2.0-flash-preview-image-generation']) {
    const r = await vertexExpressImage(m, REF_PROMPT, `vertex-${m.replace(/[^a-z0-9.-]/gi, '_')}`);
    imageResults.push(r);
    console.log(JSON.stringify(r));
  }
  console.log('\n--- CLOUDFLARE ---');
  const cf = await cloudflareFlux(REF_PROMPT);
  imageResults.push(cf);
  console.log(JSON.stringify(cf));

  // Anatomy variants on best OK provider
  const best = imageResults.find((r) => r.status === 'OK');
  const anatomy: ImgResult[] = [];
  if (best) {
    console.log('\n--- ANATOMY on', best.provider, best.model);
    const a = await geminiGenerateImage(
      best.model,
      'Editorial lifestyle photograph, 4:5 portrait format. Full body wide shot of a woman in a Pilates plank position on a cream mat, natural skin texture, mid-30s, soft window light, cream beige room, muted desaturated palette, not stock photography. No text, no logo.',
      'anatomy-full-plank',
    );
    const b = await geminiGenerateImage(
      best.model,
      'Editorial lifestyle photograph, 4:5 portrait format. Close-up of hands only on a cream Pilates mat, gentle adjustment gesture, soft natural side light, warm off-white plaster wall blurred, terracotta accent towel edge, muted desaturated palette, shallow depth of field 50mm f/2. Large negative space upper third. No text, no logo.',
      'anatomy-hands-only',
    );
    anatomy.push(a, b);
    imageResults.push(a, b);
    console.log(JSON.stringify(a));
    console.log(JSON.stringify(b));
  } else {
    console.log('\n--- ANATOMY SKIPPED (no successful provider) ---');
  }

  // Titles blind
  const titleBrief = `FitMangas = Pilates/Barre en visio (Alejandra), femmes 30-55.
Génère exactement 5 titres FR puis 5 titres ES pour Instagram Reels.
Structure: situation précise + tension + promesse courte.
Interdit: noms d'exercice en tête, filler (doux/suave/un geste qui/en douceur).
Référence FR: "À 15h ton dos te lâche ? Ce n'est (presque) jamais les abdos."
Réponds en liste numérotée:
FR1..FR5
ES1..ES5
Rien d'autre.`;

  let seriesA = '';
  let seriesB: string | null = null;
  let seriesALabel = 'Gemini';
  let seriesBLabel = 'Claude';
  try {
    seriesA = await geminiText(titleBrief);
  } catch (e) {
    seriesA = `ERREUR Gemini: ${e instanceof Error ? e.message : String(e)}`;
  }
  try {
    seriesB = await claudeText(titleBrief);
  } catch (e) {
    seriesB = `ERREUR Claude: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Shuffle labels for blind display: randomly assign left/right
  const swap = Math.random() < 0.5;
  const left = swap ? seriesB : seriesA;
  const right = swap ? seriesA : seriesB;
  const leftWho = swap ? seriesBLabel : seriesALabel;
  const rightWho = swap ? seriesALabel : seriesBLabel;

  const meta = await metaProbe();
  console.log('\n--- META ---');
  console.log(JSON.stringify(meta, null, 2));

  const library = libraryInventory();
  console.log('\n--- LIBRARY counts ---');
  console.log(JSON.stringify({ total: library.totalInLibraryTree, folders: Object.fromEntries(Object.entries(library.folders as object).map(([k, v]) => [k, (v as { count: number }).count])) }));

  const report = {
    billing,
    imageResults,
    anatomy,
    titlesBlind: {
      note: 'Les labels A/B sont mélangés pour lecture humaine; mapping secret en keyMap.',
      serieA: left,
      serieB: right,
      keyMap: { serieA: leftWho, serieB: rightWho }, // for AUDIT doc only — user display without labels
    },
    meta,
    library,
  };
  writeFileSync('/tmp/audit-images/audit-v4-raw.json', JSON.stringify(report, null, 2));
  console.log('\nWrote /tmp/audit-images/audit-v4-raw.json');
  console.log('Images dir:', OUT_DIR);
  try {
    console.log(execSync('ls -la /tmp/audit-images').toString());
  } catch {
    /* ignore */
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
