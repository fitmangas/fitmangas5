'use client';

/**
 * Aperçus de développement « Premiers pas » (/dev/apercu, DEV_PREVIEW=1, jamais sur Vercel) :
 * un tableau de bord fictif avec les vraies cibles `data-tour`, pour les captures.
 */
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { PlayCircle } from 'lucide-react';

import { PlanningV3 } from '@/components/Compte/PlanningV3';
import { NextLiveCompteCard } from '@/components/Compte/NextLiveCompteCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { MonProgrammeCard } from '@/components/Programmes/MonProgrammeCard';
import { PageHelpDialog } from '@/components/Onboarding/PageHelpButton';
import { PremiersPasCard } from '@/components/Onboarding/PremiersPasCard';
import { WelcomeTour } from '@/components/Onboarding/WelcomeTour';
import type { SmartCourse } from '@/lib/domain/calendar-types';
import { buildPremiersPasItems } from '@/lib/onboarding/premiers-pas';

const NOW = '2026-10-20T19:30:00Z';

function course(id: string, title: string, startsAt: string, language: 'fr' | 'es'): SmartCourse {
  const start = new Date(startsAt);
  return {
    id,
    slug: id,
    title,
    description: null,
    course_format: 'online',
    course_category: 'group',
    starts_at: start.toISOString(),
    ends_at: new Date(start.getTime() + 55 * 60000).toISOString(),
    timezone: 'Europe/Paris',
    location: null,
    live_url: null,
    jitsi_link: 'https://live.fitmangas.com/demo',
    replay_url: null,
    capacity_max: null,
    course_language: language,
    access_type: 'full',
    can_purchase_single: false,
    cta_label: null,
    cta_url: null,
    upsell_tier: null,
    status_label: 'Accès complet',
  };
}

const EVENTS: SmartCourse[] = [
  course('pp-mer', 'Pilates Accessoires', '2026-10-21T15:15:00Z', 'fr'),
  course('pp-jeu', 'Barre Pilates Flow', '2026-10-22T16:00:00Z', 'fr'),
];

const NEXT_LIVE = {
  courseId: 'pp-mer',
  title: 'Pilates Accessoires',
  startsAt: EVENTS[0].starts_at,
  endsAt: EVENTS[0].ends_at,
  enrollmentStatus: 'booked',
  smartCourse: EVENTS[0],
};

export const PREMIERS_PAS_DEMO_ITEMS = buildPremiersPasItems('fr', {
  levelTestDone: false,
  calendarSubscribed: false,
  liveVisits: 0,
  replaySeconds: 0,
});

/** Tableau de bord fictif (mêmes composants que /compte) avec les 4 cibles du tuto. */
export function PremiersPasDashboard() {
  return (
    <div className="luxury-shell relative min-h-screen">
      <div className="luxury-bg-orbs" aria-hidden />
      <div className="relative mx-auto max-w-[1280px] space-y-4 px-4 pb-16 pt-6 md:space-y-10 md:px-8 md:pt-10">
        <section>
          <h1 className="hero-signature-title text-2xl text-luxury-ink sm:text-4xl md:text-6xl">Bonjour Jenny</h1>
          <p className="hero-signature-subtitle mt-1 text-xs md:text-base">
            Jenny, chaque séance compte. Cette semaine, on garde le rythme.
          </p>
        </section>

        <PremiersPasCard lang="fr" items={PREMIERS_PAS_DEMO_ITEMS} />

        <section data-tour="programme" className="relative isolate space-y-3 md:space-y-4">
          <div className="relative z-10 flex items-center gap-2 px-1 md:gap-3">
            <Image
              src="/logo.png"
              alt="Logo FitMangas"
              width={56}
              height={56}
              className="h-9 w-9 object-contain md:h-[56px] md:w-[56px]"
            />
            <h2 className="text-xl font-semibold tracking-tight text-luxury-ink md:text-[1.7rem]">
              Mon programme sur mesure
            </h2>
          </div>
          <MonProgrammeCard summary={null} lang="fr" hideKicker />
        </section>

        <section className="relative isolate space-y-3 md:space-y-4">
          <div className="relative z-10 flex items-center gap-3 px-1">
            <h2 className="text-xl font-semibold tracking-tight text-luxury-ink md:text-[1.7rem]">
              Le tableau de bord
            </h2>
          </div>
          <div className="relative z-0 grid grid-cols-2 items-stretch gap-3 md:gap-5 xl:grid-cols-4">
            <GlassCard className="relative order-1 flex h-full flex-col p-3 md:order-none md:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">
                Progression mensuelle
              </p>
              <p className="mt-2 text-xs text-luxury-muted">Cours suivis ce mois-ci</p>
              <p className="mt-6 text-center text-3xl font-semibold text-luxury-ink">0 / 8</p>
            </GlassCard>
            <NextLiveCompteCard
              nextAppointment={NEXT_LIVE}
              liveUnread={0}
              lang="fr"
              iconToneClass="kpi-icon-wrap--logo"
            />
            <GlassCard
              data-tour="replays"
              className="relative order-4 col-span-2 flex h-full flex-col p-4 md:order-none md:col-span-1 md:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">
                    Replay & Bibliothèque
                  </p>
                  <p className="mt-6 text-2xl font-semibold text-luxury-ink">
                    46h <span className="text-sm font-normal text-luxury-muted">Replay</span>
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-luxury-ink">
                    59h <span className="text-sm font-normal text-luxury-muted">Bibliothèque</span>
                  </p>
                </div>
                <span className="kpi-icon-wrap kpi-icon-wrap--logo shrink-0">
                  <PlayCircle size={20} aria-hidden strokeWidth={2} />
                </span>
              </div>
            </GlassCard>
            <GlassCard className="relative order-2 flex h-full flex-col p-3 md:order-none md:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Mon blog</p>
              <p className="mt-6 text-3xl font-semibold text-luxury-ink">
                48 <span className="text-sm font-normal text-luxury-muted">Articles</span>
              </p>
            </GlassCard>
          </div>
        </section>

        <section data-tour="planning" className="relative isolate">
          <PlanningV3 variant="dashboard" timeZone="Europe/Paris" nowIso={NOW} initialEvents={EVENTS} />
        </section>
      </div>
    </div>
  );
}

export function PremiersPasTourPreview({ step }: { step: number }) {
  return (
    <>
      <PremiersPasDashboard />
      <WelcomeTour lang="fr" firstName="Jenny" previewStep={step} />
    </>
  );
}

export function PremiersPasListPreview() {
  const items = buildPremiersPasItems('fr', {
    levelTestDone: true,
    calendarSubscribed: false,
    liveVisits: 0,
    replaySeconds: 0,
  });
  return (
    <div className="luxury-shell min-h-screen">
      <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-8 md:px-8">
        <PremiersPasCard lang="fr" items={items} />
      </div>
    </div>
  );
}

export function PremiersPasHelpPreview({ pathname }: { pathname: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <>
      <PremiersPasDashboard />
      {mounted ? <PageHelpDialog lang="fr" pathname={pathname} onClose={() => undefined} /> : null}
    </>
  );
}
