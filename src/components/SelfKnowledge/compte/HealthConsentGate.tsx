'use client';

import { useState } from 'react';

import { GlassCard } from '@/components/ui/GlassCard';
import type { ClientLang } from '@/lib/compte/i18n';

type Props = {
  lang: ClientLang;
  onConsented: (consentId: string) => void;
};

export function HealthConsentGate({ lang, onConsented }: Props) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t =
    lang === 'es'
      ? {
          title: 'Datos de bienestar',
          lead: 'Estos campos son opcionales e indicativos — no sustituyen un consejo médico.',
          body: 'Acepto que FitMangas almacene mis indicadores de bienestar (sesiones, sueño, frecuencia cardíaca, etc.) para mostrarme puntuaciones orientativas en mi espacio cliente. Esto es independiente del consentimiento de marketing por email.',
          cta: 'Aceptar y continuar',
          loading: 'Guardando…',
          check: 'Debes marcar la casilla.',
        }
      : lang === 'en'
        ? {
            title: 'Wellness data',
            lead: 'These fields are optional and indicative — not medical advice.',
            body: 'I agree that FitMangas may store my wellness indicators (sessions, sleep, heart rate, etc.) to show indicative scores in my account. This is separate from marketing email consent.',
            cta: 'Accept and continue',
            loading: 'Saving…',
            check: 'You must check the box.',
          }
        : {
            title: 'Données bien-être',
            lead: 'Ces champs sont optionnels et indicatifs — ils ne remplacent pas un avis médical.',
            body: 'J’accepte que FitMangas stocke mes indicateurs bien-être (séances, sommeil, fréquence cardiaque, etc.) pour m’afficher des scores indicatifs dans mon espace cliente. C’est distinct du consentement marketing par email.',
            cta: 'Accepter et continuer',
            loading: 'Enregistrement…',
            check: 'Tu dois cocher la case.',
          };

  async function handleSubmit() {
    if (!checked) {
      setError(t.check);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/self-knowledge/health/consent', { method: 'POST' });
      const data = (await res.json().catch(() => ({}))) as { error?: string; consentId?: string };
      if (!res.ok || !data.consentId) {
        setError(data.error ?? 'Erreur.');
        return;
      }
      onConsented(data.consentId);
    } catch {
      setError(lang === 'es' ? 'Error de red.' : 'Erreur réseau.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard className="p-6 md:p-8">
      <h2 className="text-xl font-semibold text-luxury-ink">{t.title}</h2>
      <p className="mt-2 text-sm text-luxury-muted">{t.lead}</p>
      <label className="mt-6 flex items-start gap-3 text-sm leading-relaxed text-luxury-muted">
        <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => setChecked(e.target.checked)} disabled={loading} />
        <span>{t.body}</span>
      </label>
      {error ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={loading}
        className="btn-luxury-primary mt-6 px-7 py-3 text-[11px] tracking-[0.14em]"
      >
        {loading ? t.loading : t.cta}
      </button>
    </GlassCard>
  );
}
