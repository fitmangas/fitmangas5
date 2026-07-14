import { unstable_cache } from 'next/cache';

import { getAdminKpiDrilldowns, getAdminKpis, stripeCollectedCurrentMonthEur } from '@/lib/admin/kpis';

const REVALIDATE_SECONDS = 300;

export const getCachedAdminKpis = unstable_cache(async () => getAdminKpis(), ['admin-kpis-v2'], {
  revalidate: REVALIDATE_SECONDS,
});

export const getCachedAdminKpiDrilldowns = unstable_cache(
  async () => getAdminKpiDrilldowns(),
  ['admin-kpi-drilldowns-v2'],
  { revalidate: REVALIDATE_SECONDS },
);

export const getCachedStripeCollectedCurrentMonthEur = unstable_cache(
  async () => stripeCollectedCurrentMonthEur(),
  ['admin-stripe-month-v1'],
  { revalidate: REVALIDATE_SECONDS },
);
