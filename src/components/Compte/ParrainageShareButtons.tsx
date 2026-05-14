'use client';

import { useState } from 'react';

type Props = {
  shareUrl: string;
  whatsappText: string;
};

export function ParrainageShareButtons({ shareUrl, whatsappText }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <button type="button" onClick={() => void copy()} className="btn-luxury-primary min-h-[44px] px-4 text-sm">
        {copied ? 'Copié ✓' : 'Copier le lien'}
      </button>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-emerald-600/40 bg-emerald-50 px-4 text-sm font-semibold text-emerald-900"
      >
        Partager sur WhatsApp
      </a>
    </div>
  );
}
