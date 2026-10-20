import { unstable_cache } from 'next/cache';

import { loadOfferFacts } from '@/lib/landing/home-data';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPriceShort, stripeClient, visioMonthlyCents } from './cards';
import { loadGiftPrices, type GiftPrice } from './prices';

/**
 * Chiffres des pages publiques des cartes cadeaux (C01, C04) : nombre de programmes publiés,
 * heures de vidéos (arrondies à 5 h en dessous), prix mensuel du Visio collectif et prix des cartes.
 * Tout est lu en base ou dans Stripe, puis gardé en cache (10 minutes) pour ne pas interroger Stripe à chaque visite.
 */
export type GiftPageFacts = {
  programmes: number;
  libraryHours: number | null;
  monthlyPriceLabel: string;
  prices: GiftPrice[];
};

export const loadGiftPageFacts = unstable_cache(
  async (): Promise<GiftPageFacts> => {
    let programmes = 0;
    let libraryHours: number | null = null;
    try {
      const facts = await loadOfferFacts(createAdminClient());
      programmes = facts.programmesCount;
      libraryHours = facts.libraryHours != null && facts.libraryHours >= 10 ? Math.floor(facts.libraryHours / 5) * 5 : null;
    } catch {
      /* chiffres masqués */
    }
    const [monthly, prices] = await Promise.all([visioMonthlyCents(stripeClient()), loadGiftPrices()]);
    return { programmes, libraryHours, monthlyPriceLabel: formatPriceShort(monthly.cents, monthly.currency), prices };
  },
  ['gift-page-facts-v1'],
  { revalidate: 600 },
);

export { giftPageLang } from './page-lang';
