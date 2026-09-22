'use client';

import { useState, type FormEvent } from 'react';

import type { SelfTestLang } from '@/lib/self-knowledge/types';

export type SelfTestLeadPayload = {
  firstName: string;
  email: string;
  consent: true;
};

type Props = {
  locale: SelfTestLang;
  testTitle: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (payload: SelfTestLeadPayload) => void;
};

const copy = {
  fr: {
    eyebrow: 'Dernière étape',
    title: 'Ton aperçu est prêt',
    lead: 'Laisse ton prénom et ton email pour voir tes forces — et recevoir des pistes si tu veux essayer les cours collectifs à horaires fixes.',
    firstName: 'Prénom',
    email: 'Email',
    consent:
      'J’accepte d’être recontactée par FitMangas (email) au sujet de mon profil et de l’essai gratuit de 7 jours.',
    cta: 'Voir mon aperçu →',
    loading: 'Enregistrement…',
  },
  es: {
    eyebrow: 'Último paso',
    title: 'Tu vista previa está lista',
    lead: 'Deja tu nombre y email para ver tus fortalezas — y recibir pistas si quieres probar los cursos colectivos a horarios fijos.',
    firstName: 'Nombre',
    email: 'Email',
    consent:
      'Acepto que FitMangas me contacte (email) sobre mi perfil y la prueba gratuita de 7 días.',
    cta: 'Ver mi vista previa →',
    loading: 'Guardando…',
  },
} as const;

export function SelfTestLeadCapture({ locale, testTitle, submitting, error, onSubmit }: Props) {
  const t = copy[locale];
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const name = firstName.trim();
    const mail = email.trim();
    if (!name || !mail) {
      setLocalError(locale === 'es' ? 'Completa todos los campos.' : 'Remplis tous les champs.');
      return;
    }
    if (!consent) {
      setLocalError(
        locale === 'es' ? 'Debes aceptar ser contactada.' : 'Tu dois accepter d’être recontactée.',
      );
      return;
    }
    onSubmit({ firstName: name, email: mail, consent: true });
  }

  const shownError = localError ?? error;

  return (
    <div className="mx-auto max-w-xl px-5 py-10" data-testid="self-test-lead">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.eyebrow}</p>
      <h2 className="mt-3 font-serif text-[1.75rem] italic leading-tight text-brand-ink">{t.title}</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-brand-ink/60">{t.lead}</p>
      <p className="mt-2 text-[13px] font-medium text-[#c45d3e]">{testTitle}</p>

      <form
        className="mt-8 space-y-4 rounded-[24px] border border-brand-ink/[0.06] bg-white/85 p-6 shadow-sm"
        onSubmit={handleSubmit}
        noValidate
        data-testid="self-test-lead-form"
      >
        <label className="block space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-ink/55">{t.firstName}</span>
          <input
            type="text"
            name="firstName"
            data-testid="lead-firstname"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={submitting}
            required
            maxLength={60}
            className="w-full rounded-xl border border-brand-ink/10 bg-white px-4 py-3 text-[15px] outline-none ring-[#c45d3e]/25 focus:ring-2"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-ink/55">{t.email}</span>
          <input
            type="email"
            name="email"
            data-testid="lead-email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
            maxLength={120}
            className="w-full rounded-xl border border-brand-ink/10 bg-white px-4 py-3 text-[15px] outline-none ring-[#c45d3e]/25 focus:ring-2"
          />
        </label>

        <label className="flex items-start gap-3 text-[13px] leading-relaxed text-brand-ink/70">
          <input
            type="checkbox"
            data-testid="lead-consent"
            className="mt-1"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={submitting}
          />
          <span>{t.consent}</span>
        </label>

        {shownError ? (
          <p className="text-[13px] text-red-600" role="alert">
            {shownError}
          </p>
        ) : null}

        <button
          type="submit"
          data-testid="lead-submit"
          disabled={submitting}
          className="w-full rounded-full bg-[#c45d3e] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(196,93,62,0.28)] transition hover:bg-[#b35338] disabled:opacity-60"
        >
          {submitting ? t.loading : t.cta}
        </button>
      </form>
    </div>
  );
}
