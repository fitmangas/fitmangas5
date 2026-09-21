'use client';

import { useState, type FormEvent } from 'react';

import type { QuizLocale } from '@/lib/quiz/types';

export type QuizLeadPayload = {
  firstName: string;
  email: string;
  phone: string;
  consent: true;
};

type Props = {
  locale: QuizLocale;
  quizTitle: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (payload: QuizLeadPayload) => void;
};

const copy = {
  fr: {
    eyebrow: 'Dernière étape',
    title: 'Ton rapport est prêt',
    lead: 'Laisse tes coordonnées pour le recevoir — et pour qu’on puisse t’accompagner ensuite.',
    firstName: 'Prénom',
    email: 'Email',
    phone: 'Téléphone',
    phonePh: '06 12 34 56 78',
    consent:
      'J’accepte d’être recontactée par FitMangas (email ou WhatsApp) au sujet de mon profil et de l’essai gratuit.',
    cta: 'Voir mon rapport →',
    loading: 'Enregistrement…',
  },
  es: {
    eyebrow: 'Último paso',
    title: 'Tu informe está listo',
    lead: 'Deja tus datos para recibirlo — y para que podamos acompañarte después.',
    firstName: 'Nombre',
    email: 'Email',
    phone: 'Teléfono',
    phonePh: '06 12 34 56 78',
    consent:
      'Acepto que FitMangas me contacte (email o WhatsApp) sobre mi perfil y la prueba gratuita.',
    cta: 'Ver mi informe →',
    loading: 'Guardando…',
  },
} as const;

export function QuizLeadCapture({ locale, quizTitle, submitting, error, onSubmit }: Props) {
  const t = copy[locale];
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const name = firstName.trim();
    const mail = email.trim();
    const tel = phone.trim();
    if (!name || !mail || !tel) {
      setLocalError(locale === 'es' ? 'Completa todos los campos.' : 'Remplis tous les champs.');
      return;
    }
    if (!consent) {
      setLocalError(
        locale === 'es'
          ? 'Debes aceptar ser contactada.'
          : 'Tu dois accepter d’être recontactée.',
      );
      return;
    }
    onSubmit({ firstName: name, email: mail, phone: tel, consent: true });
  }

  const shownError = localError ?? error;

  return (
    <div className="quiz-chapter-panel">
      <span className="quiz-chapter-giant" aria-hidden>
        ✓
      </span>
      <p className="quiz-chapter-eyebrow">{t.eyebrow}</p>
      <h2 className="quiz-chapter-title max-w-[18ch]" data-chapter-heading tabIndex={-1}>
        {t.title}
      </h2>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed" style={{ color: 'var(--qc-muted)' }}>
        {t.lead}
      </p>
      <p className="mt-2 text-[13px] font-medium" style={{ color: 'var(--qc-accent)' }}>
        {quizTitle}
      </p>

      <form className="quiz-chapter-card quiz-lead-form mt-8" onSubmit={handleSubmit} noValidate>
        <label className="quiz-lead-field">
          <span>{t.firstName}</span>
          <input
            type="text"
            name="firstName"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={submitting}
            required
            maxLength={60}
          />
        </label>
        <label className="quiz-lead-field">
          <span>{t.email}</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
            maxLength={120}
          />
        </label>
        <label className="quiz-lead-field">
          <span>{t.phone}</span>
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            placeholder={t.phonePh}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={submitting}
            required
            maxLength={32}
          />
        </label>

        <label className="quiz-lead-consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={submitting}
          />
          <span>{t.consent}</span>
        </label>

        {shownError ? (
          <p className="quiz-lead-error" role="alert">
            {shownError}
          </p>
        ) : null}

        <button type="submit" className="quiz-chapter-enter-btn quiz-lead-submit" disabled={submitting}>
          {submitting ? t.loading : t.cta}
        </button>
      </form>
    </div>
  );
}
