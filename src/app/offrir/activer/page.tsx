import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { ActivateGiftClient } from '@/components/Gifts/ActivateGiftClient';
import { isGiftsEnabled } from '@/lib/gifts/flag';
import { isDevPreviewEnabled } from '@/lib/dev/preview-guard';
import { giftPageLang, loadGiftPageFacts } from '@/lib/gifts/page-facts';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Activer ma carte cadeau — FitMangas' },
  description: 'Active ta carte cadeau FitMangas : tes mois de Pilates & Barre en visio commencent tout de suite, sans carte bancaire.',
  robots: { index: false, follow: false },
};

export default async function ActiverCadeauPage({ searchParams }: { searchParams: Promise<{ code?: string; lang?: string }> }) {
  if (!isGiftsEnabled() && !isDevPreviewEnabled()) notFound();
  const q = await searchParams;
  const code = q.code?.trim().slice(0, 32) || undefined;
  const { lang: initialLang, fromUrl } = giftPageLang(q.lang, (await headers()).get('accept-language'));

  let session: { email: string } | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) session = { email: user.email };
  } catch {
    session = null;
  }

  const facts = await loadGiftPageFacts();

  return (
    <ActivateGiftClient
      initialCode={code}
      initialLang={initialLang}
      langFromUrl={fromUrl}
      session={session}
      facts={{ programmes: facts.programmes, libraryHours: facts.libraryHours }}
      monthlyPriceLabel={facts.monthlyPriceLabel}
    />
  );
}
