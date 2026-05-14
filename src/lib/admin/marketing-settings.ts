import { createAdminClient } from '@/lib/supabase/admin';

export type MarketingSettings = {
  google_analytics_id?: string;
  search_console_code?: string;
  meta_pixel_id?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
};

const MARKETING_SETTING_KEYS = [
  'google_analytics_id',
  'search_console_code',
  'meta_pixel_id',
  'instagram_handle',
  'tiktok_handle',
] as const;

export const marketingSettingKeys = MARKETING_SETTING_KEYS;

export async function getMarketingSettings(): Promise<MarketingSettings> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('admin_settings')
      .select('key,value')
      .in('key', [...MARKETING_SETTING_KEYS]);

    if (error) return {};

    return (data ?? []).reduce<MarketingSettings>((acc, row) => {
      if (MARKETING_SETTING_KEYS.includes(row.key as (typeof MARKETING_SETTING_KEYS)[number]) && row.value) {
        acc[row.key as keyof MarketingSettings] = String(row.value);
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}
