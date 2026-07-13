import { createAdminClient } from '@/lib/supabase/admin';

/** Écrit une ligne dans blog_cron_logs (best-effort — ne lève pas). */
export async function insertBlogCronLog(params: {
  cronName: string;
  status: 'ok' | 'error';
  message: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from('blog_cron_logs').insert({
      cron_name: params.cronName,
      status: params.status,
      message: params.message,
      meta: params.meta ?? {},
    });
  } catch (e) {
    console.error(`[blog cron log ${params.cronName}]`, e);
  }
}
