'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

import { LEVEL_TEST_COOKIE, recommendProgramSlug, type LevelGoal, type LevelTime, type LevelXp } from '@/lib/programmes/level-test';
import { coverUrl, LEVEL_LABEL, programBySlug } from '@/lib/programmes/catalogue';
import { LevelPill } from './LevelPill';

const Q1: Array<{ id: LevelGoal; fr: string; es: string }> = [
  { id: 'douceur', fr: 'Me (re)mettre au sport en douceur', es: 'Empezar o retomar con calma' },
  { id: 'tonifier', fr: 'Tonifier et sculpter', es: 'Tonificar y esculpir' },
  { id: 'dos', fr: 'Soulager mon dos, ma posture', es: 'Aliviar mi espalda y mi postura' },
  { id: 'cardio', fr: 'Faire du cardio en m’amusant', es: 'Hacer cardio divirtiéndome' },
  { id: 'souplesse', fr: 'Gagner en souplesse', es: 'Ganar flexibilidad' },
];
const Q2: Array<{ id: LevelXp; fr: string }> = [
  { id: 'lt6', fr: 'Jamais, ou moins de 6 mois' },
  { id: '6to24', fr: 'Régulière depuis 6 mois à 2 ans' },
  { id: 'gt24', fr: 'Plus de 2 ans' },
];
const Q3: Array<{ id: LevelTime; fr: string }> = [
  { id: '20', fr: '20 min' },
  { id: '30', fr: '30 à 45 min' },
  { id: '60', fr: '1 h' },
];

export function LevelTestClient({ locale = 'fr' }: { locale?: 'fr' | 'es' }) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<LevelGoal | null>(null);
  const [xp, setXp] = useState<LevelXp | null>(null);
  const [time, setTime] = useState<LevelTime | null>(null);

  if (goal && xp && time && step >= 3) {
    const rec = recommendProgramSlug(goal, xp, time);
    const p = programBySlug(rec.slug);
    try {
      document.cookie = `${LEVEL_TEST_COOKIE}=${rec.slug};path=/;max-age=${60 * 60 * 24 * 30}`;
    } catch {
      /* ignore */
    }
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'level_test_complete', { slug: rec.slug });
    }
    return (
      <section className="mb-16 grid items-center gap-8 rounded-[2.2rem] bg-white p-6 shadow-[0_24px_60px_-28px_rgba(29,26,23,0.35)] md:grid-cols-[1fr_1fr] md:p-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-luxury-orange">Ton résultat</p>
          <h2 className="fm-display mt-3 text-[2.1rem] leading-[1.05] text-brand-ink md:text-[2.8rem]">{p?.title.fr}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-brand-ink/65">{p?.promise.fr}</p>
          {rec.partialHint ? <p className="mt-3 text-[13px] text-luxury-muted">Conseil : fais une partie de la séance.</p> : null}
          <ul className="mt-5 space-y-2 text-[14px] text-brand-ink/75">
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 text-success" size={16} /> Parce que tu as répondu à ces 3 questions
            </li>
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/#essai" className="btn-luxury-primary">
              Commencer mon essai gratuit
            </Link>
            <Link href="/compte/programmes" className="btn-luxury-ghost">
              Voir les 12 programmes
            </Link>
          </div>
          <p className="mt-3 text-[12.5px] text-brand-ink/50">0 € aujourd&apos;hui · 7 jours gratuits · le programme sera prêt dans ton espace.</p>
        </div>
        <div className="relative overflow-hidden rounded-[1.8rem]">
          {p ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl(p)} alt="" className="aspect-[4/3.6] w-full object-cover" />
              <div className="absolute left-4 top-4">
                <LevelPill level={p.level} label={LEVEL_LABEL[p.level]?.fr ?? ''} />
              </div>
            </>
          ) : null}
        </div>
      </section>
    );
  }

  const options: Array<{ id: string; fr: string }> = step === 0 ? Q1 : step === 1 ? Q2 : Q3;
  const title = step === 0 ? (locale === 'es' ? '¿Tu objetivo?' : 'Ton objectif ?') : step === 1 ? (locale === 'es' ? '¿Tu experiencia?' : 'Ton expérience ?') : locale === 'es' ? '¿Cuánto tiempo por sesión?' : 'Combien de temps par séance ?';

  return (
    <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 shadow-[0_24px_60px_-28px_rgba(29,26,23,0.35)]">
      <p className="fm-kicker">Test de niveau · {step + 1}/3</p>
      <h1 className="fm-display mt-3 text-[2rem] text-luxury-ink">{title}</h1>
      <div className="mt-6 space-y-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className="w-full rounded-2xl border border-[#D9C9B4] bg-white px-4 py-3 text-left text-[15px] hover:bg-terracotta-50"
            onClick={() => {
              if (step === 0) setGoal(o.id as LevelGoal);
              if (step === 1) setXp(o.id as LevelXp);
              if (step === 2) setTime(o.id as LevelTime);
              setStep((s) => s + 1);
            }}
          >
            {o.fr}
          </button>
        ))}
      </div>
    </section>
  );
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
