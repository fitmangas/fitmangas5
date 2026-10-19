import { NextResponse } from 'next/server';

import { assertWebhookRateLimit, clientIpFromRequest } from '@/lib/webhook-rate-limit';

/** Point de rapport de la CSP Report-Only : journalise, ne stocke rien. */
export async function POST(request: Request) {
  if (!assertWebhookRateLimit(`csp:${clientIpFromRequest(request)}`, 60, 60_000)) {
    return new NextResponse(null, { status: 204 });
  }
  try {
    const raw = await request.text();
    const json = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const report = (json['csp-report'] ?? json) as Record<string, unknown>;
    console.warn('[csp-report]', {
      directive: report['violated-directive'] ?? report['effective-directive'],
      blocked: report['blocked-uri'],
      page: typeof report['document-uri'] === 'string' ? String(report['document-uri']).split('?')[0] : undefined,
    });
  } catch {
    // rapport illisible : ignoré
  }
  return new NextResponse(null, { status: 204 });
}
