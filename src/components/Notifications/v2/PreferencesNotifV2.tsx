'use client';

import Link from 'next/link';
import { Check, ChevronLeft, Lock, Minus, Radio, Route, Smartphone } from 'lucide-react';
import { useState, useTransition } from 'react';

import { savePreferenceToggleV2 } from '@/app/compte/preferences/v2-actions';
import { PushOptIn } from '@/components/Notifications/PushOptIn';
import type { PrefKey } from '@/lib/notifications/v2/preference-keys';

type Lang = 'fr' | 'es';

const COPY = {
  fr: {
    back: 'Profil',
    title: 'Mes préférences',
    subtitle: 'Choisis comment et quand FitMangas te contacte.',
    email: 'Email',
    app: 'Appli',
    phone: 'Tél.',
    appLong: 'Espace client',
    phoneLong: 'Téléphone',
    livesTitle: 'Rappels des lives',
    livesBody: 'Chaque live du planning compte pour toi : pas besoin de t’inscrire. On te prévient la veille et 1 heure avant.',
    eve: 'La veille',
    eveHint: 'Envoyé à partir de 18:00 (ton heure), la veille du live.',
    hour: '1 heure avant',
    hourHint: 'Le lien est déjà ouvert : connecte-toi 10 minutes avant.',
    other: 'Recevoir aussi les rappels des lives en espagnol',
    otherHint: 'Tes rappels suivent ta langue (français). Les lives en espagnol restent ouverts pour toi dans le planning.',
    phoneLine: 'Téléphone = notification sur ton téléphone (jamais de SMS).',
    phoneActivate: 'Active-les',
    phoneLineEnd: 'sur cet appareil pour cocher cette colonne.',
    programTitle: 'Ton programme',
    programReminder: 'rappel',
    programEdit: 'Modifier',
    session: 'Ta séance du jour',
    sessionHint: 'Les jours que tu as choisis, à l’heure choisie.',
    nudge: 'Relance douce',
    nudgeHint: 'Si tu n’as fait aucune séance depuis 4 jours (au plus une fois par semaine).',
    restTitle: 'Le reste',
    restBody: 'Regroupé : jamais plus d’un email par jour pour ces sujets.',
    replays: 'Nouveaux replays et vidéos',
    replaysHint: '1 récapitulatif par jour maximum.',
    blog: 'Nouveaux articles du blog',
    community: 'Communauté',
    communityHint: 'Anniversaire, parrainage.',
    weekTitle: '« Ta semaine »',
    weekBody: 'Le plan de ta semaine, le dimanche à 18:00.',
    silenceTitle: 'Mode silence',
    silenceBody: 'Rien entre 21:00 et 08:00, sauf les rappels de lives, les annulations et ta séance du jour.',
    marketingTitle: 'Offres et nouveautés FitMangas',
    marketingBody: 'Newsletter, offres spéciales. Désactivé par défaut.',
    alwaysTitle: 'Toujours envoyés',
    alwaysBody: 'Paiement, sécurité du compte, suivi de commande boutique, annulation d’un live. Indispensables, donc non désactivables.',
    saved: 'Enregistré automatiquement.',
    saving: 'Enregistrement…',
    error: 'Ce réglage n’a pas pu être enregistré. Réessaie dans un instant.',
    unavailable: 'Ce réglage sera disponible très bientôt.',
  },
  es: {
    back: 'Perfil',
    title: 'Mis preferencias',
    subtitle: 'Elige cómo y cuándo FitMangas te contacta.',
    email: 'Email',
    app: 'App',
    phone: 'Tel.',
    appLong: 'Espacio cliente',
    phoneLong: 'Teléfono',
    livesTitle: 'Recordatorios de clases en vivo',
    livesBody: 'Cada clase del calendario cuenta para ti: no necesitas inscribirte. Te avisamos la víspera y 1 hora antes.',
    eve: 'La víspera',
    eveHint: 'Enviado a partir de las 18:00 (tu hora), la víspera de la clase.',
    hour: '1 hora antes',
    hourHint: 'El enlace ya está abierto: conéctate 10 minutos antes.',
    other: 'Recibir también los recordatorios de las clases en francés',
    otherHint: 'Tus recordatorios siguen tu idioma (español). Las clases en francés siguen abiertas para ti en el calendario.',
    phoneLine: 'Teléfono = notificación en tu teléfono (nunca SMS).',
    phoneActivate: 'Actívalas',
    phoneLineEnd: 'en este dispositivo para marcar esta columna.',
    programTitle: 'Tu programa',
    programReminder: 'recordatorio',
    programEdit: 'Modificar',
    session: 'Tu sesión del día',
    sessionHint: 'Los días que elegiste, a la hora elegida.',
    nudge: 'Recordatorio suave',
    nudgeHint: 'Si no hiciste ninguna sesión en 4 días (como máximo una vez por semana).',
    restTitle: 'Lo demás',
    restBody: 'Agrupado: nunca más de un email al día para estos temas.',
    replays: 'Nuevas repeticiones y videos',
    replaysHint: '1 resumen al día como máximo.',
    blog: 'Nuevos artículos del blog',
    community: 'Comunidad',
    communityHint: 'Cumpleaños, recomendaciones.',
    weekTitle: '« Tu semana »',
    weekBody: 'El plan de tu semana, el domingo a las 18:00.',
    silenceTitle: 'Modo silencio',
    silenceBody: 'Nada entre las 21:00 y las 08:00, salvo los recordatorios de clases, las cancelaciones y tu sesión del día.',
    marketingTitle: 'Ofertas y novedades FitMangas',
    marketingBody: 'Newsletter, ofertas especiales. Desactivado por defecto.',
    alwaysTitle: 'Siempre enviados',
    alwaysBody: 'Pagos, seguridad de la cuenta, seguimiento de pedidos de la tienda, cancelación de una clase. Indispensables, así que no se pueden desactivar.',
    saved: 'Guardado automáticamente.',
    saving: 'Guardando…',
    error: 'No se pudo guardar este ajuste. Inténtalo de nuevo en un momento.',
    unavailable: 'Este ajuste estará disponible muy pronto.',
  },
} as const;

export type PrefsV2Values = Record<PrefKey, boolean>;

function Channel({
  on,
  disabled,
  label,
  onToggle,
}: {
  on: boolean;
  disabled: boolean;
  label: string;
  onToggle?: () => void;
}) {
  const cls = disabled
    ? 'border border-dashed border-black/15 text-luxury-soft'
    : on
      ? 'bg-luxury-ink text-white'
      : 'border border-black/10 bg-white text-luxury-soft';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on && !disabled}
      aria-label={label}
      title={label}
      disabled={disabled || !onToggle}
      onClick={onToggle}
      className={`inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-full px-2 transition ${cls} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {on && !disabled ? <Check size={15} strokeWidth={2.8} /> : <Minus size={15} strokeWidth={2} />}
    </button>
  );
}

function Switch({ on, label, onToggle, disabled }: { on: boolean; label: string; onToggle?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled || !onToggle}
      onClick={onToggle}
      className={`fm-switch shrink-0 ${on ? 'fm-switch--on' : ''} ${disabled ? 'opacity-50' : ''}`}
    />
  );
}

export function PreferencesNotifV2({
  userId,
  lang = 'fr',
  initial,
  writable,
  pushEnabled,
  programme,
  preview = false,
}: {
  userId?: string;
  lang?: Lang;
  initial: PrefsV2Values;
  writable: Record<PrefKey, boolean>;
  pushEnabled: boolean;
  /** Programme actif : titre + « lun · mer · ven à 18:00 » + lien de réglage. Null = section masquée. */
  programme: { title: string; schedule: string; editHref: string } | null;
  /** Aperçu de développement : rien n'est enregistré. */
  preview?: boolean;
}) {
  const t = COPY[lang] ?? COPY.fr;
  const [values, setValues] = useState<PrefsV2Values>(initial);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error' | 'unavailable'>('idle');
  const [showPush, setShowPush] = useState(false);
  const [, startTransition] = useTransition();

  const toggle = (key: PrefKey) => () => {
    if (!writable[key] && !preview) {
      setStatus('unavailable');
      return;
    }
    const next = !values[key];
    setValues((v) => ({ ...v, [key]: next }));
    if (preview) return;
    setStatus('saving');
    startTransition(async () => {
      const res = await savePreferenceToggleV2(key, next);
      if (!res.ok) {
        setValues((v) => ({ ...v, [key]: !next }));
        setStatus(res.error === 'column_missing' ? 'unavailable' : 'error');
        return;
      }
      setStatus('idle');
    });
  };

  const header = (
    <div className="grid grid-cols-[1fr_auto] items-end gap-4 border-b border-black/[0.06] px-5 pb-3 pt-1 md:px-6">
      <span />
      <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-soft md:gap-3">
        <span className="w-9">{t.email}</span>
        <span className="w-9">{t.app}</span>
        <span className="w-9">{t.phone}</span>
      </div>
    </div>
  );

  const row = (title: string, hint: string, keys: [PrefKey, PrefKey, PrefKey | null]) => (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-black/[0.05] px-5 py-4 last:border-0 md:px-6">
      <div className="min-w-0">
        <p className="text-[14.5px] font-semibold text-luxury-ink">{title}</p>
        {hint ? <p className="mt-0.5 text-[12.5px] leading-snug text-luxury-muted">{hint}</p> : null}
      </div>
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <Channel on={values[keys[0]]} disabled={false} label={`${title} · ${t.email}`} onToggle={toggle(keys[0])} />
        <Channel on={values[keys[1]]} disabled={false} label={`${title} · ${t.appLong}`} onToggle={toggle(keys[1])} />
        {keys[2] ? (
          <Channel
            on={values[keys[2]]}
            disabled={!pushEnabled}
            label={`${title} · ${t.phoneLong}`}
            onToggle={pushEnabled ? toggle(keys[2]) : undefined}
          />
        ) : (
          <Channel on={false} disabled label={`${title} · ${t.phoneLong}`} />
        )}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[920px] min-w-0 space-y-6 pb-16 pt-3 md:space-y-8 md:px-8 md:pt-10">
      <section className="px-1">
        <Link href="/compte/profil" className="inline-flex items-center gap-1 text-[12px] font-medium text-luxury-muted">
          <ChevronLeft size={14} />
          {t.back}
        </Link>
        <h1 className="hero-signature-title mt-3 text-[2.6rem] text-luxury-ink md:text-[3.6rem]">{t.title}</h1>
        <p className="hero-signature-subtitle mt-2 text-[15px]">{t.subtitle}</p>
      </section>

      <section className="glass-card glass-card--kpi overflow-hidden">
        <div className="flex items-start gap-4 px-5 pb-4 pt-6 md:px-6">
          <span className="kpi-icon-wrap kpi-icon-wrap--orange">
            <Radio size={19} />
          </span>
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-luxury-ink">{t.livesTitle}</h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-luxury-muted">{t.livesBody}</p>
          </div>
        </div>
        {header}
        {row(t.eve, t.eveHint, ['live_eve_email', 'live_eve_inapp', 'live_eve_push'])}
        {row(t.hour, t.hourHint, ['live_hour_email', 'live_hour_inapp', 'live_hour_push'])}
        <div className="flex items-center justify-between gap-4 bg-black/[0.02] px-5 py-4 md:px-6">
          <div className="min-w-0">
            <p className="text-[14.5px] font-semibold text-luxury-ink">{t.other}</p>
            <p className="mt-0.5 text-[12.5px] leading-snug text-luxury-muted">{t.otherHint}</p>
          </div>
          <Switch on={values.live_other_language} label={t.other} onToggle={toggle('live_other_language')} />
        </div>
        <div
          id="telephone"
          className="flex items-start gap-3 border-t border-black/[0.05] px-5 py-3.5 text-[12.5px] text-luxury-muted md:px-6"
        >
          <Smartphone size={15} strokeWidth={2} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p>
              {t.phoneLine}{' '}
              {pushEnabled ? null : (
                <>
                  <button type="button" className="font-semibold text-luxury-orange" onClick={() => setShowPush(true)}>
                    {t.phoneActivate}
                  </button>{' '}
                  {t.phoneLineEnd}
                </>
              )}
            </p>
            {showPush && userId ? (
              <div className="mt-3">
                <PushOptIn userId={userId} lang={lang} initialEnabled={pushEnabled} compact />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {programme ? (
        <section className="glass-card glass-card--kpi overflow-hidden">
          <div className="flex items-start gap-4 px-5 pb-4 pt-6 md:px-6">
            <span className="kpi-icon-wrap kpi-icon-wrap--logo">
              <Route size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[18px] font-semibold tracking-tight text-luxury-ink">{t.programTitle}</h2>
              <p className="mt-1 text-[13.5px] leading-relaxed text-luxury-muted">
                {programme.title} · {t.programReminder}{' '}
                <b className="font-semibold text-luxury-ink">{programme.schedule}</b>{' '}
                <Link href={programme.editHref} className="ml-1 font-semibold text-luxury-orange">
                  {t.programEdit}
                </Link>
              </p>
            </div>
          </div>
          {header}
          {row(t.session, t.sessionHint, ['program_session_email', 'program_session_inapp', 'program_session_push'])}
          {row(t.nudge, t.nudgeHint, ['program_nudge_email', 'program_nudge_inapp', null])}
        </section>
      ) : null}

      <section className="glass-card glass-card--kpi overflow-hidden">
        <div className="px-5 pb-3 pt-6 md:px-6">
          <h2 className="text-[18px] font-semibold tracking-tight text-luxury-ink">{t.restTitle}</h2>
          <p className="mt-1 text-[13.5px] text-luxury-muted">{t.restBody}</p>
        </div>
        {header}
        {row(t.replays, t.replaysHint, ['content_replay_email', 'content_replay_inapp', 'content_replay_push'])}
        {row(t.blog, '', ['blog_email', 'blog_inapp', 'blog_push'])}
        {row(t.community, t.communityHint, ['community_email', 'community_inapp', 'community_push'])}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="glass-card glass-card--kpi p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[16px] font-semibold text-luxury-ink">{t.weekTitle}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-luxury-muted">{t.weekBody}</p>
            </div>
            <Switch on={values.weekly_digest_email} label={t.weekTitle} onToggle={toggle('weekly_digest_email')} />
          </div>
        </section>
        <section className="glass-card glass-card--kpi p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[16px] font-semibold text-luxury-ink">{t.silenceTitle}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-luxury-muted">{t.silenceBody}</p>
            </div>
            <Switch on={values.silence_mode} label={t.silenceTitle} onToggle={toggle('silence_mode')} />
          </div>
        </section>
        <section className="glass-card glass-card--kpi p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[16px] font-semibold text-luxury-ink">{t.marketingTitle}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-luxury-muted">{t.marketingBody}</p>
            </div>
            <Switch on={values.marketing} label={t.marketingTitle} onToggle={toggle('marketing')} />
          </div>
        </section>
        <section className="glass-card glass-card--kpi p-6">
          <div className="flex items-start gap-3">
            <span className="text-luxury-muted">
              <Lock size={18} />
            </span>
            <div>
              <h2 className="text-[16px] font-semibold text-luxury-ink">{t.alwaysTitle}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-luxury-muted">{t.alwaysBody}</p>
            </div>
          </div>
        </section>
      </div>
      <p className={`px-1 text-[12px] ${status === 'error' ? 'text-luxury-orange' : 'text-luxury-soft'}`} aria-live="polite">
        {status === 'saving' ? t.saving : status === 'error' ? t.error : status === 'unavailable' ? t.unavailable : t.saved}
      </p>
    </div>
  );
}
