'use client';

import { Download, Share2, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';

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
    subtitle: 'Aperçu — choisis une app, ou télécharge l’image.',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    facebook: 'Facebook',
    download: 'Télécharger',
    more: 'Autre',
    close: 'Fermer',
    igHint: 'Image enregistrée dans tes téléchargements. Ouvre Instagram → Nouvelle story / publication → choisis la photo.',
    fbHint: 'Image enregistrée. Ouvre Facebook → créer une publication → ajoute la photo depuis ta galerie.',
    waHint: 'Image enregistrée. Dans WhatsApp, joins la photo au message (ou envoie le texte prérempli).',
    preparing: 'Préparation de l’image…',
    error: 'Impossible de créer l’image. Réessaie.',
  },
  es: {
    title: 'Compartir tu perfil',
    subtitle: 'Vista previa — elige una app, o descarga la imagen.',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    facebook: 'Facebook',
    download: 'Descargar',
    more: 'Otro',
    close: 'Cerrar',
    igHint: 'Imagen guardada. Abre Instagram → Nueva story / publicación → elige la foto.',
    fbHint: 'Imagen guardada. Abre Facebook → crear publicación → añade la foto.',
    waHint: 'Imagen guardada. En WhatsApp, adjunta la foto al mensaje.',
    preparing: 'Preparando la imagen…',
    error: 'No se pudo crear la imagen. Inténtalo de nuevo.',
  },
} as const;

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

export function QuizShareModal({ open, onClose, shareText, ...cardArgs }: Props) {
  const locale: QuizLocale = cardArgs.locale;
  const t = COPY[locale];
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const letter = cardArgs.result.letter ?? 'D';
  const filename = `fitmangas-profil-${letter}.png`;
  const profileTitle = cardArgs.result.styleName?.[locale] ?? cardArgs.result.title[locale];
  const pageUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/quiz/profil-discipline`
      : 'https://fitmangas.com/quiz/profil-discipline';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [open]);

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

  if (!open || !mounted) return null;

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
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) window.location.href = 'instagram://story-camera';
    window.setTimeout(() => setHint(t.igHint), isMobile ? 600 : 0);
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

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label={t.close}
        className="absolute inset-0 bg-black/55 backdrop-blur-[6px]"
        onClick={onClose}
      />
      <div
        className="relative z-[1] flex max-h-[min(92vh,880px)] w-full max-w-[420px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-[#FFFAF5] shadow-[0_28px_80px_rgba(0,0,0,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-brand-ink/[0.06] px-5 py-4">
          <div>
            <h2 id={titleId} className="text-[1.1rem] font-semibold tracking-tight text-brand-ink">
              {t.title}
            </h2>
            <p className="mt-0.5 text-[12px] text-brand-ink/50">{t.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-brand-ink/45 transition hover:bg-brand-ink/[0.06] hover:text-brand-ink"
            aria-label={t.close}
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="flex justify-center">
            {busy ? (
              <p className="py-20 text-[13px] text-brand-ink/50">{t.preparing}</p>
            ) : previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt=""
                className="max-h-[42vh] w-auto rounded-[20px] object-contain shadow-[0_16px_40px_rgba(28,24,20,0.2)]"
              />
            ) : (
              <p className="py-12 text-[13px] text-[#c45d3e]" role="alert">
                {error ?? t.error}
              </p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
            <button
              type="button"
              disabled={!blob || busy}
              onClick={() => void onWhatsApp()}
              className="group flex flex-col items-center gap-2 disabled:opacity-40"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_20px_rgba(37,211,102,0.4)] transition group-hover:scale-105 group-hover:shadow-[0_12px_28px_rgba(37,211,102,0.5)]">
                <IconWhatsApp className="h-7 w-7" />
              </span>
              <span className="text-[11px] font-semibold text-brand-ink/70">{t.whatsapp}</span>
            </button>

            <button
              type="button"
              disabled={!blob || busy}
              onClick={() => void onInstagram()}
              className="group flex flex-col items-center gap-2 disabled:opacity-40"
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_20px_rgba(221,42,123,0.35)] transition group-hover:scale-105"
                style={{
                  background:
                    'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
                }}
              >
                <IconInstagram className="h-7 w-7" />
              </span>
              <span className="text-[11px] font-semibold text-brand-ink/70">{t.instagram}</span>
            </button>

            <button
              type="button"
              disabled={!blob || busy}
              onClick={() => void onFacebook()}
              className="group flex flex-col items-center gap-2 disabled:opacity-40"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-[0_8px_20px_rgba(24,119,242,0.4)] transition group-hover:scale-105">
                <IconFacebook className="h-7 w-7" />
              </span>
              <span className="text-[11px] font-semibold text-brand-ink/70">{t.facebook}</span>
            </button>

            <button
              type="button"
              disabled={!blob || busy}
              onClick={() => void onDownload()}
              className="group flex flex-col items-center gap-2 disabled:opacity-40"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-brand-ink/10 bg-white text-brand-ink shadow-[0_6px_16px_rgba(28,24,20,0.08)] transition group-hover:scale-105 group-hover:border-[#c45d3e]/40 group-hover:text-[#c45d3e]">
                <Download size={22} strokeWidth={2.2} />
              </span>
              <span className="text-[11px] font-semibold text-brand-ink/70">{t.download}</span>
            </button>

            <button
              type="button"
              disabled={!blob || busy}
              onClick={() => void onMore()}
              className="group flex flex-col items-center gap-2 disabled:opacity-40"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-brand-ink/10 bg-white text-brand-ink shadow-[0_6px_16px_rgba(28,24,20,0.08)] transition group-hover:scale-105 group-hover:border-[#c45d3e]/40 group-hover:text-[#c45d3e]">
                <Share2 size={22} strokeWidth={2.2} />
              </span>
              <span className="text-[11px] font-semibold text-brand-ink/70">{t.more}</span>
            </button>
          </div>

          {hint ? (
            <p className="mt-5 rounded-2xl border border-[#c45d3e]/15 bg-white px-4 py-3 text-[12px] leading-relaxed text-brand-ink/65">
              {hint}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
