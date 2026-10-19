'use client';

import Link from 'next/link';
import { Check, ChevronLeft, Minus, Radio, Route } from 'lucide-react';

import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { PushOptIn } from '@/components/Notifications/PushOptIn';

function Cell({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-full bg-luxury-ink px-2 text-white">
      <Check size={15} strokeWidth={2.8} />
    </span>
  ) : (
    <span className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-full border border-dashed border-black/15 px-2 text-luxury-soft">
      <Minus size={15} />
    </span>
  );
}

export function PreferencesNotifV2({
  userId,
  marketingOptIn,
  otherLanguage,
}: {
  userId?: string;
  marketingOptIn: boolean;
  otherLanguage: boolean;
}) {
  const showProgramme = isProgrammesEnabled();
  return (
    <div className="mx-auto max-w-[920px] min-w-0 space-y-6 pb-16 pt-3 md:space-y-8 md:px-8 md:pt-10">
      <section className="px-1">
        <Link href="/compte/profil" className="inline-flex items-center gap-1 text-[12px] font-medium text-luxury-muted">
          <ChevronLeft size={14} /> Profil
        </Link>
        <h1 className="hero-signature-title mt-3 text-[2.6rem] text-luxury-ink md:text-[3.6rem]">Mes préférences</h1>
        <p className="hero-signature-subtitle mt-2 text-[15px]">Choisis comment et quand FitMangas te contacte.</p>
      </section>

      <section className="glass-card glass-card--kpi overflow-hidden">
        <div className="flex items-start gap-4 px-5 pb-4 pt-6 md:px-6">
          <span className="kpi-icon-wrap kpi-icon-wrap--orange">
            <Radio size={19} />
          </span>
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-luxury-ink">Rappels des lives</h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-luxury-muted">
              Chaque live du planning compte pour toi : pas besoin de t’inscrire. On te prévient la veille et 1 heure avant.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-end gap-4 border-b border-black/[0.06] px-5 pb-3 pt-1 md:px-6">
          <span />
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-luxury-soft md:gap-3">
            <span className="w-9">Email</span>
            <span className="w-9">Appli</span>
            <span className="w-9">Tél.</span>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-black/[0.05] px-5 py-4 md:px-6">
          <div>
            <p className="text-[14.5px] font-semibold text-luxury-ink">La veille</p>
            <p className="mt-0.5 text-[12.5px] text-luxury-muted">Envoyé à partir de 18:00 (ton heure), la veille du live.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <Cell on />
            <Cell on />
            <Cell on={false} />
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 md:px-6">
          <div>
            <p className="text-[14.5px] font-semibold text-luxury-ink">1 heure avant</p>
            <p className="mt-0.5 text-[12.5px] text-luxury-muted">Le lien est déjà ouvert, connecte-toi 10 minutes avant.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <Cell on />
            <Cell on />
            <Cell on={false} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 bg-black/[0.02] px-5 py-4 md:px-6">
          <div>
            <p className="text-[14.5px] font-semibold text-luxury-ink">Recevoir aussi les rappels des lives en espagnol</p>
            <p className="mt-0.5 text-[12.5px] text-luxury-muted">Tes rappels suivent ta langue (français).</p>
          </div>
          <span className={`fm-switch ${otherLanguage ? 'fm-switch--on' : ''}`} />
        </div>
        {userId ? (
          <div className="border-t border-black/[0.05] px-5 py-3.5 md:px-6">
            <p className="mb-2 text-[12.5px] text-luxury-muted">Téléphone = notification sur ton téléphone (jamais de SMS).</p>
            <PushOptIn userId={userId} lang="fr" initialEnabled={false} compact />
          </div>
        ) : null}
      </section>

      {showProgramme ? (
        <section className="glass-card glass-card--kpi overflow-hidden">
          <div className="flex items-start gap-4 px-5 py-6 md:px-6">
            <span className="kpi-icon-wrap kpi-icon-wrap--logo">
              <Route size={19} />
            </span>
            <div>
              <h2 className="text-[18px] font-semibold text-luxury-ink">Programme</h2>
              <p className="mt-1 text-[13.5px] text-luxury-muted">Séance du jour et relance douce.</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="glass-card glass-card--kpi overflow-hidden px-5 py-6 md:px-6">
        <h2 className="text-[18px] font-semibold text-luxury-ink">Ta semaine</h2>
        <p className="mt-1 text-[13.5px] text-luxury-muted">Dimanche à 18:00 (ton heure). Désactivable.</p>
      </section>

      <section className="glass-card glass-card--kpi overflow-hidden px-5 py-6 md:px-6">
        <h2 className="text-[18px] font-semibold text-luxury-ink">Mode silence 21:00–08:00</h2>
        <p className="mt-1 text-[13.5px] text-luxury-muted">Les rappels de lives et les annulations passent quand même.</p>
      </section>

      <section className="glass-card glass-card--kpi overflow-hidden px-5 py-6 md:px-6">
        <h2 className="text-[18px] font-semibold text-luxury-ink">Offres et nouveautés</h2>
        <p className="mt-1 text-[13.5px] text-luxury-muted">
          {marketingOptIn ? 'Tu reçois les offres (opt-in marketing).' : 'Non, tu n’as pas coché l’opt-in marketing.'}
        </p>
      </section>
    </div>
  );
}
