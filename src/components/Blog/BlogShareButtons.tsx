'use client';

import { useMemo, useState } from 'react';

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
          eyebrow: 'Compartir',
          title: 'Compartir este artículo',
          instagram: 'Story Instagram',
          facebook: 'Facebook',
          whatsapp: 'WhatsApp',
          copied: 'Enlace copiado. Puedes pegarlo en tu story Instagram.',
          fallback: 'Copia el enlace y pégalo en Instagram.',
          note: 'Instagram no permite publicar una story directamente desde una web: el botón usa el menú de compartir del teléfono o copia el enlace.',
        }
      : {
          eyebrow: 'Partager',
          title: 'Partager cet article',
          instagram: 'Story Instagram',
          facebook: 'Facebook',
          whatsapp: 'WhatsApp',
          copied: 'Lien copié. Tu peux le coller dans ta story Instagram.',
          fallback: 'Copie le lien et colle-le dans Instagram.',
          note: 'Instagram ne permet pas de publier une story directement depuis un site web : le bouton utilise le partage natif du téléphone ou copie le lien.',
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
    <section className="mb-10 rounded-[1.75rem] border border-white/50 bg-white/55 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{copy.eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-luxury-ink">{copy.title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => void shareToInstagramStory()}
          className="rounded-full border border-[#C45D3E]/25 bg-[#fffaf5] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7a2e1a] transition hover:bg-white"
        >
          {copy.instagram}
        </button>
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-blue-200 bg-blue-50 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-900 transition hover:bg-white"
        >
          {copy.facebook}
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-900 transition hover:bg-white"
        >
          {copy.whatsapp}
        </a>
      </div>
      <p className="mt-3 text-xs leading-5 text-luxury-muted">{message || copy.note}</p>
    </section>
  );
}
