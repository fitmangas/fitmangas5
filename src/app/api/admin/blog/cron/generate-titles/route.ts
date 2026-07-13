import { NextResponse } from 'next/server';

import { rewriteBlogTitlesBatch, type TitleRewriteResult } from '@/lib/blog/blog-automation';
import { insertBlogCronLog } from '@/lib/blog/cron-log';
import { verifyCronSecret } from '@/lib/blog/cron-secret';
import { createAdminClient } from '@/lib/supabase/admin';

const CRON_NAME = 'blog_generate_titles';

export async function GET(request: Request) {
  return handleGenerateTitles(request);
}

export async function POST(request: Request) {
  return handleGenerateTitles(request);
}

function buildCronMessage(result: TitleRewriteResult): string {
  if (result.errors.length > 0) {
    return `erreurs=${result.errors.length} processed=${result.processed} updated=${result.updated} pending_published=${result.pending_published}`;
  }
  if (result.processed === 0) {
    return 'aucun article au titre générique à traiter';
  }
  if (result.quota_exhausted && result.updated === 0) {
    return `quota IA épuisé — processed=${result.processed} updated=0 skipped=${result.skipped} pending_published=${result.pending_published}`;
  }
  if (result.ai_failures > 0 && result.updated === 0) {
    return `échec IA sans mise à jour — processed=${result.processed} ai_failures=${result.ai_failures} pending_published=${result.pending_published}`;
  }
  return `processed=${result.processed} updated=${result.updated} skipped=${result.skipped} pending_published=${result.pending_published}`;
}

function deriveCronStatus(result: TitleRewriteResult): 'ok' | 'error' {
  if (result.errors.length > 0) return 'error';
  if (result.quota_exhausted && result.updated === 0 && result.processed > 0) return 'error';
  if (result.ai_failures > 0 && result.updated === 0 && result.processed > 0) return 'error';
  return 'ok';
}

async function handleGenerateTitles(request: Request) {
  if (!verifyCronSecret(request)) {
    const secretConfigured = Boolean(process.env.CRON_SECRET?.trim());
    await insertBlogCronLog({
      cronName: CRON_NAME,
      status: 'error',
      message: secretConfigured
        ? 'rejeté: Authorization Bearer incorrect (CRON_SECRET)'
        : 'rejeté: CRON_SECRET absent sur le serveur',
      meta: { rejected: true },
    });
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await rewriteBlogTitlesBatch(admin);

    await insertBlogCronLog({
      cronName: CRON_NAME,
      status: deriveCronStatus(result),
      message: buildCronMessage(result),
      meta: result as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[cron blog generate-titles]', e);
    await insertBlogCronLog({
      cronName: CRON_NAME,
      status: 'error',
      message: e instanceof Error ? e.message : 'Erreur serveur',
      meta: { exception: true },
    });
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
