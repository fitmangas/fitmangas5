'use client';

import { useMemo, useState } from 'react';
import { Facebook, Instagram, MessageCircle } from 'lucide-react';

type Props = {
  title: string;
  path: string;
  lang: 'fr' | 'es';
};

function absoluteUrl(path: string) {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL || 'https://fitmangas.com').replace(/\/$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function BlogShareButtons({ title, path, lang }: Props) {
  const [message, setMessage] = useState('');
  const url = useMemo(() => absoluteUrl(path), [path]);
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${title} — FitMangas`);
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
  const copy =
    lang === 'es'
      ? {
          label: 'Compartir:',
          instagram: 'Compartir o copiar para Instagram',
          facebook: 'Compartir en Facebook',
          whatsapp: 'Compartir en WhatsApp',
          copied: 'Enlace copiado. Puedes pegarlo en tu story Instagram.',
          fallback: 'Copia el enlace y pégalo en Instagram.',
        }
      : {
          label: 'Partager :',
          instagram: 'Partager ou copier pour Instagram',
          facebook: 'Partager sur Facebook',
          whatsapp: 'Partager sur WhatsApp',
          copied: 'Lien copié. Tu peux le coller dans ta story Instagram.',
          fallback: 'Copie le lien et colle-le dans Instagram.',
        };

  async function shareToInstagramStory() {
    setMessage('');
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `${title} — FitMangas`,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setMessage(copy.copied);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setMessage(copy.copied);
      } catch {
        setMessage(copy.fallback);
      }
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-luxury-muted">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-luxury-soft">{copy.label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void shareToInstagramStory()}
          title={copy.instagram}
          aria-label={copy.instagram}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#C45D3E]/25 bg-[#fffaf5] text-[#7a2e1a] transition hover:bg-white hover:shadow-sm"
        >
          <Instagram size={15} aria-hidden />
        </button>
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={copy.facebook}
          aria-label={copy.facebook}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-900 transition hover:bg-white hover:shadow-sm"
        >
          <Facebook size={15} aria-hidden />
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={copy.whatsapp}
          aria-label={copy.whatsapp}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-900 transition hover:bg-white hover:shadow-sm"
        >
          <MessageCircle size={15} aria-hidden />
        </a>
      </div>
      {message ? <span className="basis-full text-xs text-luxury-muted sm:basis-auto">{message}</span> : null}
    </div>
  );
}
