import { NextResponse } from 'next/server';
import { z } from 'zod';

import { pdfAppOrigin, renderUrlToPdf } from '@/lib/self-knowledge/render-report-pdf';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BodySchema = z.object({
  slug: z.enum(['big-five', 'attachement']),
  format: z.enum(['ipip-50', 'ipip-120']).optional(),
  locale: z.enum(['fr', 'es']).default('fr'),
  scores: z.record(z.string(), z.number()),
  balanced: z.boolean().optional(),
});

export async function POST(req: Request) {
  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Payload PDF invalide' }, { status: 400 });
  }

  const origin = pdfAppOrigin(req);
  const qs = new URLSearchParams({
    slug: parsed.slug,
    locale: parsed.locale,
    scores: JSON.stringify(parsed.scores),
  });
  if (parsed.format) qs.set('format', parsed.format);
  if (parsed.balanced) qs.set('balanced', '1');

  const url = `${origin}/quiz/print-report?${qs.toString()}`;

  try {
    const pdf = await renderUrlToPdf({
      url,
      waitForSelector: '[data-testid="self-test-report"][data-show-full="true"]',
      footerText: `${parsed.format ?? parsed.slug} · fitmangas.com`,
    });
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="fitmangas-${parsed.slug}-rapport.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error('[self-knowledge/pdf]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Échec génération PDF' },
      { status: 500 }
    );
  }
}
