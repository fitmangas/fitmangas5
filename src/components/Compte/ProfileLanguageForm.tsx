'use client';

import { useState, useTransition } from 'react';

import { GlassCard } from '@/components/ui/GlassCard';

type Lang = 'fr' | 'en' | 'es';

const labels: Record<Lang, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
};

export function ProfileLanguageForm({ defaultLang }: { defaultLang: Lang }) {
  const [lang, setLang] = useState<Lang>(defaultLang);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>('');

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
          setMessage('Erreur lors de la sauvegarde.');
          return;
        }
        setMessage('Langue enregistrée. L’espace client utilise désormais cette langue.');
      } catch {
        setMessage('Erreur réseau. Réessaie dans quelques secondes.');
      }
    });
  }

  return (
    <GlassCard className="p-8">
      <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">Langue de l’espace client</h2>
      <p className="mt-2 text-sm text-luxury-muted">Choisis une langue unique pour tout ton espace client : navigation, écrans et contenus compatibles.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {(['fr', 'en', 'es'] as const).map((code) => (
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
          {isPending ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-luxury-muted">{message}</p> : null}
    </GlassCard>
  );
}
