'use client';

import { useEffect, useId, useState } from 'react';

import {
  buildShareCardPng,
  downloadShareBlob,
  shareFileNative,
  type ShareCardArgs,
} from '@/lib/quiz/build-share-card';
import type { QuizLocale } from '@/lib/quiz/types';

type Props = ShareCardArgs & {
  open: boolean;
  onClose: () => void;
  shareText: string;
};

const COPY = {
  fr: {
    title: 'Partager ton profil',
    subtitle: 'Aperçu de l’image — choisis où l’envoyer.',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    facebook: 'Facebook',
    download: 'Télécharger',
    more: 'Autre…',
    close: 'Fermer',
    igHint: 'Image enregistrée. Ouvre Instagram → Stories ou publication → ajoute la photo depuis ta galerie.',
    fbHint: 'Image enregistrée. Ouvre Facebook et publie la photo depuis ta galerie.',
    waHint: 'Image enregistrée. Joins-la dans WhatsApp, ou envoie le message prérempli.',
    preparing: 'Préparation de l’image…',
    error: 'Impossible de créer l’image. Réessaie.',
  },
  es: {
    title: 'Compartir tu perfil',
    subtitle: 'Vista previa — elige dónde enviarla.',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    facebook: 'Facebook',
    download: 'Descargar',
    more: 'Otro…',
    close: 'Cerrar',
    igHint: 'Imagen guardada. Abre Instagram → Stories o publicación → elige la foto de tu galería.',
    fbHint: 'Imagen guardada. Abre Facebook y publica la foto desde tu galería.',
    waHint: 'Imagen guardada. Adjúntala en WhatsApp, o envía el mensaje precargado.',
    preparing: 'Preparando la imagen…',
    error: 'No se pudo crear la imagen. Inténtalo de nuevo.',
  },
} as const;

export function QuizShareModal({ open, onClose, shareText, ...cardArgs }: Props) {
  const locale: QuizLocale = cardArgs.locale;
  const t = COPY[locale];
  const titleId = useId();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const letter = cardArgs.result.letter ?? 'D';
  const filename = `fitmangas-profil-${letter}.png`;
  const profileTitle =
    cardArgs.result.styleName?.[locale] ?? cardArgs.result.title[locale];
  const pageUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/quiz/profil-discipline` : 'https://fitmangas.com/quiz/profil-discipline';

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    setBusy(true);
    setError(null);
    setHint(null);
    setPreviewUrl(null);
    setBlob(null);

    void (async () => {
      try {
        const png = await buildShareCardPng(cardArgs);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(png);
        setBlob(png);
        setPreviewUrl(objectUrl);
      } catch {
        if (!cancelled) setError(t.error);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cardArgs.result.id, cardArgs.locale, cardArgs.score.resultId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function withFile(action: (file: File) => Promise<void>) {
    if (!blob) return;
    const file = new File([blob], filename, { type: 'image/png' });
    await action(file);
  }

  async function onWhatsApp() {
    setHint(null);
    await withFile(async (file) => {
      const shared = await shareFileNative(file, `${shareText}\n${pageUrl}`, profileTitle).catch(() => false);
      if (shared) return;
      downloadShareBlob(blob!, filename);
      window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${pageUrl}`)}`, '_blank', 'noopener');
      setHint(t.waHint);
    });
  }

  async function onInstagram() {
    setHint(null);
    if (!blob) return;
    downloadShareBlob(blob, filename);
    // Deep link Stories (mobile) — fallback galerie
    window.location.href = 'instagram://story-camera';
    window.setTimeout(() => setHint(t.igHint), 600);
  }

  async function onFacebook() {
    setHint(null);
    if (!blob) return;
    downloadShareBlob(blob, filename);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}&quote=${encodeURIComponent(shareText)}`,
      '_blank',
      'noopener',
    );
    setHint(t.fbHint);
  }

  async function onDownload() {
    if (!blob) return;
    downloadShareBlob(blob, filename);
  }

  async function onMore() {
    setHint(null);
    await withFile(async (file) => {
      const shared = await shareFileNative(file, `${shareText}\n${pageUrl}`, profileTitle).catch(() => false);
      if (!shared) {
        downloadShareBlob(blob!, filename);
        try {
          await navigator.clipboard.writeText(`${shareText}\n${pageUrl}`);
        } catch {
          /* ignore */
        }
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-[400] flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="glass-card relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_64px_rgba(28,24,20,0.28)] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-[1.15rem] font-semibold tracking-tight text-brand-ink">
              {t.title}
            </h2>
            <p className="mt-1 text-[13px] text-brand-ink/55">{t.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-[12px] font-medium text-brand-ink/45 hover:bg-brand-ink/[0.05] hover:text-brand-ink/70"
          >
            {t.close}
          </button>
        </div>

        <div className="mt-5 flex justify-center">
          {busy ? (
            <p className="py-16 text-[13px] text-brand-ink/50">{t.preparing}</p>
          ) : previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="max-h-[46vh] w-auto rounded-[22px] object-contain shadow-[0_18px_40px_rgba(28,24,20,0.22)]"
            />
          ) : (
            <p className="py-12 text-[13px] text-[#c45d3e]" role="alert">
              {error ?? t.error}
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={!blob || busy}
            onClick={() => void onWhatsApp()}
            className="inline-flex min-w-[130px] flex-1 items-center justify-center rounded-full bg-[#25D366] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_10px_24px_rgba(37,211,102,0.35)] transition hover:-translate-y-0.5 disabled:opacity-40"
          >
            {t.whatsapp}
          </button>
          <button
            type="button"
            disabled={!blob || busy}
            onClick={() => void onInstagram()}
            className="inline-flex min-w-[130px] flex-1 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f58529,#dd2a7b,#8134af)] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_10px_24px_rgba(221,42,123,0.3)] transition hover:-translate-y-0.5 disabled:opacity-40"
          >
            {t.instagram}
          </button>
          <button
            type="button"
            disabled={!blob || busy}
            onClick={() => void onFacebook()}
            className="inline-flex min-w-[130px] flex-1 items-center justify-center rounded-full bg-[#1877F2] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_10px_24px_rgba(24,119,242,0.3)] transition hover:-translate-y-0.5 disabled:opacity-40"
          >
            {t.facebook}
          </button>
          <button
            type="button"
            disabled={!blob || busy}
            onClick={() => void onDownload()}
            className="inline-flex min-w-[130px] flex-1 items-center justify-center rounded-full border-2 border-brand-ink/12 bg-white px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-ink/70 transition hover:-translate-y-0.5 hover:border-[#c45d3e] hover:text-[#c45d3e] disabled:opacity-40"
          >
            {t.download}
          </button>
          <button
            type="button"
            disabled={!blob || busy}
            onClick={() => void onMore()}
            className="inline-flex min-w-[130px] flex-1 items-center justify-center rounded-full border-2 border-brand-ink/12 bg-white px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-ink/70 transition hover:-translate-y-0.5 hover:border-[#c45d3e] hover:text-[#c45d3e] disabled:opacity-40"
          >
            {t.more}
          </button>
        </div>

        {hint ? (
          <p className="mt-4 rounded-2xl bg-[#FFFAF5] px-4 py-3 text-[13px] leading-relaxed text-brand-ink/65">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
