'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import { marketingSettingKeys } from '@/lib/admin/marketing-settings';
import { createAdminClient } from '@/lib/supabase/admin';

function cleanSetting(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim().slice(0, 300) : '';
}

export async function saveMarketingSettings(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const rows = marketingSettingKeys.map((key) => ({
    key,
    value: cleanSetting(formData.get(key)) || null,
  }));

  await admin.from('admin_settings').upsert(rows, { onConflict: 'key' });
  revalidatePath('/admin/marketing');
  revalidatePath('/');
}

export async function toggleMarketingChecklist(formData: FormData) {
  await requireAdmin();
  const key = cleanSetting(formData.get('key'));
  const completed = formData.get('completed') === 'true';
  if (!key) return;

  const admin = createAdminClient();
  await admin
    .from('admin_marketing_checklist')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('key', key);

  revalidatePath('/admin/marketing');
}
