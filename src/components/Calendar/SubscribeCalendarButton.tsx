/**
 * Bouton « Ajouter à mon calendrier » — ABONNEMENT (flux vivant), pas un import ponctuel.
 *
 * - Apple (iPhone / iPad / Mac) : webcal://…/feed.ics?token=…
 *   → Calendrier s’abonne au flux ; les nouveaux cours apparaissent au prochain rafraîchissement.
 *   Sur iPhone, iOS peut afficher « Rechercher » une fois : c’est normal pour l’abonnement.
 *   (Ouvrir le .ics en https provoque « Tout ajouter » = import figé, PAS un abonnement.)
 * - Android / Chrome : abonnement Google Agenda via l’URL https du flux.
 */

'use client';

import { useState } from 'react';
import { CalendarPlus, Copy, Link2 } from 'lucide-react';

type Lang = 'fr' | 'en' | 'es';

type Props = {
  lang?: Lang;
  className?: string;
  tone?: 'primary' | 'ghost';
};

function copy(lang: Lang) {
  if (lang === 'en') {
    return {
      trigger: 'Add to my calendar',
      working: 'Opening…',
      fail: 'Unable to open calendar subscription. You can copy the link below.',
      copyLink: 'Copy calendar link',
      copied: 'Link copied',
      copyHint: 'Paste this HTTPS link in Calendar (New Calendar Subscription) or Google Calendar (From URL).',
      network: 'Network error. Try again in a moment.',
      noAccess: 'Calendar subscription needs an active course access.',
      iosHint:
        'On iPhone: tap “Search”, then confirm the subscription. New classes will then appear automatically — do not use “Add All” (that only copies today’s classes).',
    };
  }
  if (lang === 'es') {
    return {
      trigger: 'Añadir a mi calendario',
      working: 'Abriendo…',
      fail: 'No se pudo abrir la suscripción. Puedes copiar el enlace abajo.',
      copyLink: 'Copiar enlace del calendario',
      copied: 'Enlace copiado',
      copyHint: 'Pega este enlace HTTPS en Calendario o Google Calendar (Desde URL).',
      network: 'Error de red. Inténtalo en un momento.',
      noAccess: 'La suscripción necesita acceso activo a un curso.',
      iosHint:
        'En iPhone: toca «Buscar», luego confirma la suscripción. Los nuevos cursos aparecerán solos — no uses «Añadir todo» (eso solo copia los cursos de hoy).',
    };
  }
  return {
    trigger: 'Ajouter à mon calendrier',
    working: 'Ouverture…',
    fail: 'Impossible d’ouvrir l’abonnement calendrier. Tu peux copier le lien ci-dessous.',
    copyLink: 'Copier le lien du calendrier',
    copied: 'Lien copié',
    copyHint:
      'Colle ce lien HTTPS dans Apple Calendrier (Nouvel abonnement) ou Google Agenda (À partir de l’URL).',
    network: 'Erreur réseau. Réessaie dans un instant.',
    noAccess: 'L’abonnement calendrier nécessite un accès actif à un cours.',
    iosHint:
      'Sur iPhone : tape « Rechercher », puis confirme l’abonnement. Les nouveaux cours s’ajouteront alors tout seuls. N’utilise pas « Tout ajouter » (ça copie seulement les cours déjà prévus, sans mise à jour).',
  };
}

function isAppleDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMacSafari =
    /Macintosh/i.test(ua) &&
    /Safari/i.test(ua) &&
    !/Chrome|Chromium|CriOS|Edg|Firefox|OPR|Android/i.test(ua);
  return isIOS || isMacSafari;
}

function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function SubscribeCalendarButton({ lang = 'fr', className = '', tone = 'ghost' }: Props) {
  const t = copy(lang);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [iosHintVisible, setIosHintVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const buttonClass =
    tone === 'primary'
      ? 'btn-luxury-primary inline-flex items-center gap-2 px-4 py-2 text-[10px] tracking-[0.14em] disabled:opacity-60 md:px-5 md:py-2.5'
      : 'btn-luxury-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] tracking-[0.12em] disabled:opacity-60';

  async function handleSubscribe() {
    setBusy(true);
    setError(null);
    setFallbackUrl(null);
    setIosHintVisible(false);
    setCopied(false);

    const apple = isAppleDevice();
    const ios = isIOSDevice();

    try {
      const res = await fetch('/api/calendar/mobile-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        webcalUrl?: string | null;
        httpsUrl?: string | null;
        googleUrl?: string | null;
        error?: string;
      };

      if (!res.ok) {
        console.error('[SubscribeCalendarButton] mobile-sync', res.status, json);
        setError(typeof json.error === 'string' ? json.error : res.status === 403 ? t.noAccess : t.fail);
        if (typeof json.httpsUrl === 'string') setFallbackUrl(json.httpsUrl);
        return;
      }

      const httpsUrl = typeof json.httpsUrl === 'string' ? json.httpsUrl : null;
      const webcalUrl = typeof json.webcalUrl === 'string' ? json.webcalUrl : null;
      const googleUrl = typeof json.googleUrl === 'string' ? json.googleUrl : null;

      // Apple : TOUJOURS webcal:// = abonnement vivant (pas le https .ics = « Tout ajouter »)
      if (apple) {
        if (!webcalUrl || !webcalUrl.startsWith('webcal://')) {
          console.error('[SubscribeCalendarButton] webcalUrl manquant', json);
          setError(t.fail);
          if (httpsUrl) setFallbackUrl(httpsUrl);
          return;
        }
        if (ios) {
          setIosHintVisible(true);
          if (httpsUrl) setFallbackUrl(httpsUrl);
        }
        window.location.href = webcalUrl;
        return;
      }

      // Android / autres : abonnement Google Agenda
      if (!googleUrl) {
        setError(t.fail);
        if (httpsUrl) setFallbackUrl(httpsUrl);
        return;
      }
      const opened = window.open(googleUrl, '_blank', 'noopener,noreferrer');
      if (!opened) {
        window.location.assign(googleUrl);
      }
    } catch (e) {
      console.error('[SubscribeCalendarButton]', e);
      setError(t.network);
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!fallbackUrl) return;
    try {
      await navigator.clipboard.writeText(fallbackUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('[SubscribeCalendarButton] copy', e);
      setError(t.fail);
    }
  }

  return (
    <div className={className.trim()}>
      <button type="button" disabled={busy} onClick={() => void handleSubscribe()} className={buttonClass}>
        <CalendarPlus size={14} aria-hidden />
        {busy ? t.working : t.trigger}
      </button>

      {iosHintVisible ? (
        <p
          className={`mt-2 rounded-xl border px-3 py-2 text-[11px] leading-snug ${
            tone === 'primary'
              ? 'border-emerald-300/35 bg-emerald-500/15 text-emerald-50'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}
          role="status"
        >
          {t.iosHint}
        </p>
      ) : null}

      {error ? (
        <p
          className={`mt-2 rounded-xl border px-3 py-2 text-[11px] ${
            tone === 'primary'
              ? 'border-amber-300/40 bg-amber-500/15 text-amber-50'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {fallbackUrl && error ? (
        <div
          className={`mt-2 space-y-2 rounded-xl border px-3 py-2 text-[11px] ${
            tone === 'primary'
              ? 'border-white/20 bg-white/10 text-white/85'
              : 'border-brand-ink/10 bg-brand-sand/20 text-brand-ink/80'
          }`}
        >
          <p className="flex items-start gap-2 leading-snug">
            <Link2 size={14} className="mt-0.5 shrink-0" aria-hidden />
            <span>{t.copyHint}</span>
          </p>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
              tone === 'primary'
                ? 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                : 'border-brand-ink/15 bg-white text-brand-ink/80 hover:bg-brand-sand/40'
            }`}
          >
            <Copy size={12} aria-hidden />
            {copied ? t.copied : t.copyLink}
          </button>
        </div>
      ) : null}
    </div>
  );
}
