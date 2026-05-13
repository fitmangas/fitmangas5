'use client';

import { useState, useTransition } from 'react';

import { GlassCard } from '@/components/ui/GlassCard';

type Lang = 'fr' | 'en' | 'es';

const labels: Record<Lang, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
};

const copy = {
  fr: {
    title: 'Langue de l’espace client',
    intro: 'Choisis une langue unique pour tout ton espace client : navigation, écrans et contenus compatibles.',
    save: 'Enregistrer',
    saving: 'Enregistrement...',
    error: 'Erreur lors de la sauvegarde.',
    saved: 'Langue enregistrée. L’espace client utilise désormais cette langue.',
    network: 'Erreur réseau. Réessaie dans quelques secondes.',
  },
  es: {
    title: 'Idioma del espacio cliente',
    intro: 'Elige un idioma único para todo tu espacio cliente: navegación, pantallas y contenidos compatibles.',
    save: 'Guardar',
    saving: 'Guardando...',
    error: 'Error al guardar.',
    saved: 'Idioma guardado. El espacio cliente utiliza ahora este idioma.',
    network: 'Error de red. Inténtalo de nuevo en unos segundos.',
  },
};

function normalizeLang(lang: Lang): 'fr' | 'es' {
  return lang === 'es' ? 'es' : 'fr';
}

export function ProfileLanguageForm({ defaultLang }: { defaultLang: Lang }) {
  const [lang, setLang] = useState<Lang>(defaultLang);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>('');
  const t = copy[normalizeLang(lang)];

  function onSave() {
    startTransition(async () => {
      setMessage('');
      try {
        const res = await fetch('/api/client/user/preferences', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ language: lang }),
        });
        if (!res.ok) {
          setMessage(t.error);
          return;
        }
        setMessage(t.saved);
      } catch {
        setMessage(t.network);
      }
    });
  }

  return (
    <GlassCard className="p-8">
      <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">{t.title}</h2>
      <p className="mt-2 text-sm text-luxury-muted">{t.intro}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {(['fr', 'es'] as const).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              lang === code
                ? 'border-luxury-orange bg-luxury-orange/15 font-semibold text-luxury-ink'
                : 'border-white/40 bg-white/40 text-luxury-muted hover:bg-white/70 hover:text-luxury-ink'
            }`}
          >
            {labels[code]}
          </button>
        ))}
      </div>
      <div className="mt-5">
        <button type="button" onClick={onSave} disabled={isPending} className="btn-luxury-ghost min-h-[42px] min-w-[160px]">
          {isPending ? t.saving : t.save}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-luxury-muted">{message}</p> : null}
    </GlassCard>
  );
}

export function ProfileLanguageFormEmbedded({ defaultLang }: { defaultLang: Lang }) {
  const [lang, setLang] = useState<Lang>(defaultLang);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>('');
  const t = copy[normalizeLang(lang)];

  function onSave() {
    startTransition(async () => {
      setMessage('');
      try {
        const res = await fetch('/api/client/user/preferences', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ language: lang }),
        });
        if (!res.ok) {
          setMessage(t.error);
          return;
        }
        setMessage(t.saved);
      } catch {
        setMessage(t.network);
      }
    });
  }

  return (
    <div className="flex h-full flex-col p-0">
      <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">{t.title}</h2>
      <p className="mt-2 text-sm text-luxury-muted">{t.intro}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {(['fr', 'es'] as const).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              lang === code
                ? 'border-luxury-orange bg-luxury-orange/15 font-semibold text-luxury-ink'
                : 'border-white/40 bg-white/40 text-luxury-muted hover:bg-white/70 hover:text-luxury-ink'
            }`}
          >
            {labels[code]}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="btn-luxury-ghost inline-flex min-h-[44px] min-w-[220px] items-center justify-center"
        >
          {isPending ? t.saving : t.save}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-luxury-muted">{message}</p> : null}
    </div>
  );
}
