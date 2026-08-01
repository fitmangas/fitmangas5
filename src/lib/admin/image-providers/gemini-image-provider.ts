import type { ImageGenerateResult, ImageProvider, ImageSize } from '@/lib/admin/image-providers/types';

/** Nano Banana / Gemini Flash Image models (ordre de tentative). */
export const GEMINI_IMAGE_MODELS = [
  'gemini-3.1-flash-image-preview',
  'gemini-3.1-flash-image',
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
] as const;

export function resolveGeminiApiKey(): string | null {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENAI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    null
  );
}

async function extractImageBytes(data: Record<string, unknown>): Promise<Buffer | null> {
  const candidates = data.candidates as Array<{ content?: { parts?: Array<Record<string, unknown>> } }> | undefined;
  for (const part of candidates?.[0]?.content?.parts ?? []) {
    const inline = part.inlineData as { data?: string; mimeType?: string } | undefined;
    if (inline?.data) return Buffer.from(inline.data, 'base64');
  }
  return null;
}

function aspectRatioForSize(size: ImageSize): string {
  const ratio = size.width / Math.max(1, size.height);
  if (Math.abs(ratio - 4 / 5) < 0.08) return '4:5';
  if (Math.abs(ratio - 1) < 0.08) return '1:1';
  if (Math.abs(ratio - 9 / 16) < 0.08) return '9:16';
  return '4:5';
}

export class GeminiImageProvider implements ImageProvider {
  readonly name = 'gemini';

  isAvailable(): boolean {
    return Boolean(resolveGeminiApiKey());
  }

  async generate(
    prompt: string,
    size: ImageSize,
    opts?: { referenceImageBase64?: string; referenceMimeType?: string },
  ): Promise<ImageGenerateResult> {
    const apiKey = resolveGeminiApiKey();
    if (!apiKey) {
      return { error: 'GEMINI_API_KEY manquante — génération image Gemini indisponible.' };
    }

    const errors: string[] = [];
    for (const model of GEMINI_IMAGE_MODELS) {
      try {
        const parts: Array<Record<string, unknown>> = [{ text: prompt }];
        if (opts?.referenceImageBase64) {
          parts.unshift({
            inlineData: {
              mimeType: opts.referenceMimeType || 'image/jpeg',
              data: opts.referenceImageBase64,
            },
          });
        }
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: { aspectRatio: aspectRatioForSize(size) },
              },
            }),
          },
        );
        const data = (await res.json()) as Record<string, unknown>;
        if (!res.ok) {
          const msg = JSON.stringify(data).slice(0, 280);
          errors.push(`${model}: HTTP ${res.status} ${msg}`);
          continue;
        }
        const bytes = await extractImageBytes(data);
        if (bytes?.length) {
          return { buffer: bytes, mimeType: 'image/png', provider: this.name };
        }
        errors.push(`${model}: réponse sans image`);
      } catch (e) {
        errors.push(`${model}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return {
      error: `Gemini image échoué (quota ou modèle). ${errors.slice(0, 3).join(' · ')}`,
    };
  }
}
