import { notFound } from 'next/navigation';

import { ActivateGiftClient } from '@/components/Gifts/ActivateGiftClient';
import { isGiftsEnabled } from '@/lib/gifts/flag';
import { isDevPreviewEnabled } from '@/lib/dev/preview-guard';

export default async function ActiverCadeauPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  if (!isGiftsEnabled() && !isDevPreviewEnabled()) notFound();
  const q = await searchParams;
  const code = q.code?.trim();
  return <ActivateGiftClient initialCode={code} />;
}
