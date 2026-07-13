import { NextResponse } from 'next/server';

import { generateDraftArticlesBatch } from '@/lib/blog/blog-automation';
import { verifyCronSecret } from '@/lib/blog/cron-secret';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  return handleGenerateArticles(request);
}

export async function POST(request: Request) {
  return handleGenerateArticles(request);
}

async function handleGenerateArticles(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await generateDraftArticlesBatch(admin);

    await admin.from('blog_cron_logs').insert({
      cron_name: 'blog_generate_articles',
      status: result.errors.length > 0 ? 'error' : 'ok',
      message: `created=${result.created}`,
      meta: result,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[cron blog generate-articles]', e);
    try {
      const admin = createAdminClient();
      await admin.from('blog_cron_logs').insert({
        cron_name: 'blog_generate_articles',
        status: 'error',
        message: e instanceof Error ? e.message : 'Erreur serveur',
      });
    } catch {
      // ignore secondary logging failure
    }
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
