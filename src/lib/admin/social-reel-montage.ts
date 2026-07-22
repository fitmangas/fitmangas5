import { createAdminClient } from '@/lib/supabase/admin';
import type { SocialPost } from '@/lib/admin/social-comms';

export type ReelCaptionCue = {
  start: number;
  end: number;
  text: string;
};

export type ClaudeReelPlan = {
  hookTitle: string;
  durationSeconds: number;
  captions: ReelCaptionCue[];
};

const HEYGEN_BASE = 'https://api.heygen.com';

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** ZIP store (sans compression) — un seul fichier index.html. */
function zipStoreSingleFile(filename: string, content: string): Buffer {
  const name = Buffer.from(filename, 'utf8');
  const data = Buffer.from(content, 'utf8');
  const crc = crc32(data);
  const localHeader = Buffer.alloc(30 + name.length);
  localHeader.writeUInt32LE(0x04034b50, 0);
  localHeader.writeUInt16LE(20, 4);
  localHeader.writeUInt16LE(0, 6);
  localHeader.writeUInt16LE(0, 8);
  localHeader.writeUInt16LE(0, 10);
  localHeader.writeUInt16LE(0, 12);
  localHeader.writeUInt32LE(crc >>> 0, 14);
  localHeader.writeUInt32LE(data.length, 18);
  localHeader.writeUInt32LE(data.length, 22);
  localHeader.writeUInt16LE(name.length, 26);
  localHeader.writeUInt16LE(0, 28);
  name.copy(localHeader, 30);

  const central = Buffer.alloc(46 + name.length);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0, 8);
  central.writeUInt16LE(0, 10);
  central.writeUInt16LE(0, 12);
  central.writeUInt16LE(0, 14);
  central.writeUInt32LE(crc >>> 0, 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt16LE(0, 30);
  central.writeUInt16LE(0, 32);
  central.writeUInt16LE(0, 34);
  central.writeUInt16LE(0, 36);
  central.writeUInt32LE(0, 38);
  central.writeUInt32LE(0, 42);
  name.copy(central, 46);

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(localHeader.length + data.length, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([localHeader, data, central, end]);
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i]!;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Composition HyperFrames FitMangas (9:16) :
 * vidéo brute + gros titre 0–2.8s + sous-titres brûlés (GSAP).
 */
export function buildFitMangasHyperframesHtml(input: {
  hookTitle: string;
  videoSrc: string;
  durationSeconds: number;
  captions: ReelCaptionCue[];
}) {
  const duration = Math.max(4, Math.min(90, input.durationSeconds || 15));
  const hook = escapeHtml(input.hookTitle.trim().toUpperCase().slice(0, 90));
  const captionClips = input.captions
    .filter((c) => c.text.trim() && c.end > c.start)
    .map((c, i) => {
      const start = Math.max(0, c.start);
      const end = Math.min(duration, c.end);
      const dur = Math.max(0.4, end - start);
      return `      <div id="cap-${i}" class="clip subtitle" data-start="${start.toFixed(2)}" data-duration="${dur.toFixed(2)}" data-track-index="2">${escapeHtml(c.text.trim().slice(0, 90))}</div>`;
    })
    .join('\n');

  const gsapCaps = input.captions
    .map((_, i) => `tl.fromTo("#cap-${i}", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.25 }, ${Math.max(0, input.captions[i]!.start).toFixed(2)});`)
    .join('\n      ');

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        width: 1080px; height: 1920px; overflow: hidden; background: #000;
        font-family: "Inter", system-ui, sans-serif;
      }
      .clip {
        position: absolute; inset: 0; width: 100%; height: 100%;
        visibility: hidden; object-fit: cover;
      }
      .hook {
        top: 110px; left: 48px; right: 48px; height: auto; bottom: auto;
        color: #fff; font-size: 58px; font-weight: 800; line-height: 1.12;
        text-align: center; text-transform: uppercase; letter-spacing: 0.02em;
        text-shadow: 0 2px 0 #000, 0 0 14px rgba(0,0,0,.55);
      }
      .subtitle {
        top: auto; bottom: 260px; left: 56px; right: 56px; height: auto;
        color: #FFE566; font-size: 44px; font-weight: 700; text-align: center;
        text-shadow: 0 2px 0 #000, 0 0 10px rgba(0,0,0,.5);
      }
      .brand {
        position: absolute; top: 36px; left: 40px; color: #C45D3E;
        font-size: 22px; font-weight: 700; letter-spacing: 0.08em;
        text-transform: uppercase; z-index: 5; text-shadow: 0 1px 2px rgba(0,0,0,.4);
      }
    </style>
  </head>
  <body>
    <div class="brand">FitMangas</div>
    <div
      id="root"
      data-composition-id="fitmangas-reel"
      data-start="0"
      data-duration="${duration}"
      data-width="1080"
      data-height="1920"
    >
      <video
        id="a-roll"
        class="clip"
        src="${escapeHtml(input.videoSrc)}"
        muted
        playsinline
        crossorigin="anonymous"
        data-start="0"
        data-duration="${duration}"
        data-track-index="0"
      ></video>
      <audio
        id="a-roll-audio"
        src="${escapeHtml(input.videoSrc)}"
        data-start="0"
        data-duration="${duration}"
        data-track-index="3"
        data-volume="1"
      ></audio>
      <div id="hook" class="clip hook" data-start="0" data-duration="2.8" data-track-index="1">${hook}</div>
${captionClips}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      tl.fromTo("#hook", { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.35 }, 0);
      ${gsapCaps}
      window.__timelines["fitmangas-reel"] = tl;
    </script>
  </body>
</html>`;
}

function estimateDurationFromScript(script: string, shotList: string): number {
  const words = `${script} ${shotList}`.trim().split(/\s+/).filter(Boolean).length;
  // ~2.2 mots/s en FR parlée + marge
  return Math.max(8, Math.min(45, Math.round(words / 2.2) + 2));
}

function fallbackPlan(post: SocialPost): ClaudeReelPlan {
  const hookTitle = (post.hookTitle || post.title || 'FitMangas').trim().slice(0, 90);
  const durationSeconds = estimateDurationFromScript(post.reelScript, post.shotList);
  const raw = (post.reelScript || post.caption || hookTitle)
    .split(/[\n.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
    .slice(0, 8);
  const slice = durationSeconds / Math.max(1, raw.length);
  const captions = raw.map((text, i) => ({
    start: Number((2.5 + i * slice).toFixed(2)),
    end: Number((2.5 + (i + 1) * slice - 0.15).toFixed(2)),
    text: text.slice(0, 70),
  }));
  return { hookTitle, durationSeconds, captions };
}

/** Claude produit le plan de montage (hook + sous-titres timed) à partir du brief — pas de Whisper. */
export async function planReelWithClaude(post: SocialPost): Promise<ClaudeReelPlan> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim() || process.env.CLAUDE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY (Claude) manquant. Requis pour générer hook + sous-titres du montage Reel dans FitMangas.',
    );
  }

  const durationHint = estimateDurationFromScript(post.reelScript, post.shotList);
  const prompt = `Tu es le monteur vidéo FitMangas (Pilates premium, Alejandra).
À partir du BRIEF (pas d'audio), produis un plan de montage Reel Instagram 9:16.

BRIEF:
- titre: ${post.title}
- hookTitle actuel: ${post.hookTitle || '(vide)'}
- script / voix off: ${post.reelScript || '(vide)'}
- plan tournage: ${post.shotList || '(vide)'}
- légende: ${post.caption || ''}
- durée estimée: ~${durationHint}s

Règles:
- hookTitle: FR, punchy, MAJUSCULES, max 8 mots (affiché 0–2.8s)
- captions: phrases courtes (max ~8 mots) alignées sur le SCRIPT écrit (pas inventer hors script)
- timings start/end en secondes, non chevauchants, après 2.5s, avant durationSeconds
- durationSeconds entre 8 et 45

Réponds UNIQUEMENT JSON valide:
{"hookTitle":"...","durationSeconds":15,"captions":[{"start":2.5,"end":4.2,"text":"..."}]}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-5',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `Claude HTTP ${res.status}`);
  }

  const text = (data.content ?? [])
    .filter((c) => c.type === 'text' && c.text)
    .map((c) => c.text!)
    .join('\n');
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return fallbackPlan(post);

  try {
    const parsed = JSON.parse(match[0]) as Partial<ClaudeReelPlan>;
    const hookTitle = String(parsed.hookTitle || post.hookTitle || post.title).trim().slice(0, 90);
    const durationSeconds = Math.max(
      8,
      Math.min(45, Number(parsed.durationSeconds) || durationHint),
    );
    const captions = Array.isArray(parsed.captions)
      ? parsed.captions
          .map((c) => ({
            start: Number(c.start),
            end: Number(c.end),
            text: String(c.text || '').trim().slice(0, 90),
          }))
          .filter((c) => c.text && c.end > c.start)
      : [];
    if (!captions.length) return { ...fallbackPlan(post), hookTitle, durationSeconds };
    return { hookTitle, durationSeconds, captions };
  } catch {
    return fallbackPlan(post);
  }
}

async function heygenApiKey() {
  const key = process.env.HEYGEN_API_KEY?.trim();
  if (!key) {
    throw new Error(
      'HEYGEN_API_KEY manquant. Requis pour le rendu cloud HyperFrames (HeyGen) depuis FitMangas.',
    );
  }
  return key;
}

async function uploadHyperframesZip(zip: Buffer, postId: string): Promise<string> {
  const key = await heygenApiKey();
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(zip)], { type: 'application/zip' }), `fitmangas-reel-${postId}.zip`);
  const res = await fetch(`${HEYGEN_BASE}/v3/assets`, {
    method: 'POST',
    headers: { 'x-api-key': key },
    body: form,
  });
  const data = (await res.json()) as { data?: { asset_id?: string }; error?: { message?: string } };
  if (!res.ok || !data.data?.asset_id) {
    throw new Error(data.error?.message || `Upload asset HyperFrames HTTP ${res.status}`);
  }
  return data.data.asset_id;
}

async function submitHyperframesRender(assetId: string, title: string): Promise<string> {
  const key = await heygenApiKey();
  const res = await fetch(`${HEYGEN_BASE}/v3/hyperframes/renders`, {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      project: { type: 'asset_id', asset_id: assetId },
      fps: 30,
      quality: 'standard',
      format: 'mp4',
      resolution: '1080p',
      aspect_ratio: '9:16',
      composition: 'index.html',
      title: title.slice(0, 120),
    }),
  });
  const data = (await res.json()) as { data?: { render_id?: string }; error?: { message?: string } };
  if (!res.ok || !data.data?.render_id) {
    throw new Error(data.error?.message || `Submit HyperFrames render HTTP ${res.status}`);
  }
  return data.data.render_id;
}

async function pollHyperframesRender(renderId: string): Promise<string> {
  const key = await heygenApiKey();
  const started = Date.now();
  while (Date.now() - started < 4 * 60 * 1000) {
    const res = await fetch(`${HEYGEN_BASE}/v3/hyperframes/renders/${renderId}`, {
      headers: { 'x-api-key': key },
    });
    const data = (await res.json()) as {
      data?: {
        status?: string;
        video_url?: string;
        failure_message?: string;
      };
      error?: { message?: string };
    };
    if (!res.ok) {
      throw new Error(data.error?.message || `Poll HyperFrames HTTP ${res.status}`);
    }
    const status = data.data?.status;
    if (status === 'completed' && data.data?.video_url) return data.data.video_url;
    if (status === 'failed') {
      throw new Error(data.data?.failure_message || 'Rendu HyperFrames échoué.');
    }
    await new Promise((r) => setTimeout(r, 4000));
  }
  throw new Error('Timeout rendu HyperFrames (>4 min).');
}

/**
 * Pipeline Reel FitMangas (dans l’admin) :
 * Claude (plan hook + sous-titres depuis le brief) → composition HyperFrames →
 * rendu cloud HeyGen → MP4 stocké FitMangas.
 * Pas de Whisper / OpenAI.
 */
export async function renderFitMangasReelMontage(post: SocialPost): Promise<{
  editedVideoPath: string;
  hyperframesHtmlPath: string;
  segmentCount: number;
  heygenRenderId?: string;
}> {
  if (!post.rawVideoPath) throw new Error('Upload d’abord une vidéo brute.');

  const plan = await planReelWithClaude(post);
  const html = buildFitMangasHyperframesHtml({
    hookTitle: plan.hookTitle,
    videoSrc: post.rawVideoPath,
    durationSeconds: plan.durationSeconds,
    captions: plan.captions,
  });

  const admin = createAdminClient();
  const htmlPath = `social/reels/${post.id}-hyperframes.html`;
  const { error: htmlErr } = await admin.storage.from('avatars').upload(htmlPath, Buffer.from(html, 'utf8'), {
    contentType: 'text/html',
    upsert: true,
  });
  if (htmlErr) throw new Error(`Upload template HyperFrames : ${htmlErr.message}`);
  const { data: htmlPublic } = admin.storage.from('avatars').getPublicUrl(htmlPath);

  const zip = zipStoreSingleFile('index.html', html);
  const assetId = await uploadHyperframesZip(zip, post.id);
  const renderId = await submitHyperframesRender(assetId, `FitMangas · ${plan.hookTitle}`);
  const heygenVideoUrl = await pollHyperframesRender(renderId);

  const videoRes = await fetch(heygenVideoUrl);
  if (!videoRes.ok) throw new Error(`Téléchargement MP4 HeyGen échoué (${videoRes.status}).`);
  const outBuf = Buffer.from(await videoRes.arrayBuffer());
  const videoStoragePath = `social/reels/${post.id}-edited-${Date.now()}.mp4`;
  const { error: upErr } = await admin.storage.from('avatars').upload(videoStoragePath, outBuf, {
    contentType: 'video/mp4',
    upsert: true,
  });
  if (upErr) throw new Error(`Upload MP4 monté : ${upErr.message}`);
  const { data: videoPublic } = admin.storage.from('avatars').getPublicUrl(videoStoragePath);

  return {
    editedVideoPath: videoPublic.publicUrl,
    hyperframesHtmlPath: htmlPublic.publicUrl,
    segmentCount: plan.captions.length,
    heygenRenderId: renderId,
  };
}
