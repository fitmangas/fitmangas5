import { getMarketingSettings } from '@/lib/admin/marketing-settings';

import type { MetaPixelMetrics, SourceResult } from './types';

const PROVIDER = 'meta_pixel';

export async function fetchMetaPixelStatus(): Promise<SourceResult<MetaPixelMetrics>> {
  try {
    const settings = await getMarketingSettings();
    const pixelId = settings.meta_pixel_id?.trim() || null;
    return {
      ok: true,
      data: {
        pixelConfigured: Boolean(pixelId),
        pixelId,
        note: pixelId
          ? 'Pixel configuré dans Marketing — les conversions site passent par le pixel + GA4.'
          : 'meta_pixel_id absent dans admin_settings — configure-le dans Marketing.',
      },
    };
  } catch (e) {
    return {
      ok: false,
      provider: PROVIDER,
      error: e instanceof Error ? e.message : 'Erreur lecture pixel Meta',
    };
  }
}
