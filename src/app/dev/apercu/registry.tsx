import type { ReactNode } from 'react';

import { AdminMfaClient } from '@/components/Admin/AdminMfaClient';
import { ProfileBillingCard } from '@/components/Compte/ProfileBillingCard';
import { AdminSanteV2 } from '@/components/Notifications/v2/AdminSanteV2';
import { DEMO_NOTIF_ITEMS } from '@/components/Notifications/v2/demo-data';
import { NotificationsCenterV2 } from '@/components/Notifications/v2/NotificationsCenterV2';
import { PreferencesNotifV2 } from '@/components/Notifications/v2/PreferencesNotifV2';
import { AdminProgrammesManager } from '@/components/Programmes/admin/AdminProgrammesManager';
import { DEMO_ADMIN_PROGRAMS, DEMO_ADMIN_VIDEOS } from '@/components/Programmes/admin/demo-data';
import { CatalogClient } from '@/components/Programmes/CatalogClient';
import { ProgramDetailClient } from '@/components/Programmes/ProgramDetailClient';
import { SessionPlayer } from '@/components/Programmes/SessionPlayer';
import { ProgramDone } from '@/components/Programmes/ProgramDone';
import { MonProgrammeCard } from '@/components/Programmes/MonProgrammeCard';
import { LevelTestClient } from '@/components/Programmes/LevelTestClient';
import { CATALOG_PROGRAMS } from '@/lib/programmes/catalogue';
import { OffrirClient } from '@/components/Gifts/OffrirClient';
import { ActivateGiftClient } from '@/components/Gifts/ActivateGiftClient';
import { AdminGiftsManager } from '@/components/Gifts/AdminGiftsManager';

export type PreviewEntry = { slug: string; lot: string; title: string; render: () => ReactNode };

const FAKE_QR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" shape-rendering="crispEdges"><rect width="21" height="21" fill="#fff"/>${Array.from(
      { length: 21 * 21 },
      (_, i) => ((i * 7919) % 13 < 6 ? `<rect x="${i % 21}" y="${Math.floor(i / 21)}" width="1" height="1" fill="#2a2420"/>` : ''),
    ).join('')}</svg>`,
  );

const FAKE_REPEAT_DATES = ['26 oct. 2026, 19:00', '2 nov. 2026, 19:00', '9 nov. 2026, 19:00', '16 nov. 2026, 19:00'];

export const PREVIEWS: PreviewEntry[] = [
  {
    slug: 'admin-mfa',
    lot: '1',
    title: 'Double authentification admin — enrôlement',
    render: () => (
      <div className="luxury-shell admin-area relative min-h-screen">
        <div className="luxury-bg-orbs" aria-hidden />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
          <AdminMfaClient
            email="admin@exemple.fr"
            preview={{ kind: 'enroll', factorId: 'apercu', qrCode: FAKE_QR, secret: 'APERCU2FADEMO7Q3X' }}
          />
        </div>
      </div>
    ),
  },
  {
    slug: 'compte-facturation',
    lot: '1',
    title: 'Profil — carte Facturation (bouton « Résilier mon abonnement »)',
    render: () => (
      <div className="luxury-shell min-h-screen p-6">
        <div className="mx-auto max-w-xl">
          <ProfileBillingCard
            customerId="cus_apercu"
            hasActiveSubscription
            title="Facturation"
            openStripeSub="Abonnement"
            openUnsubscribe="Résilier mon abonnement"
            openStripeInvoices="Factures"
            openShopArea="Commandes boutique"
            confirmTitle="Te désabonner ?"
            confirmBody="Es-tu sûre de vouloir te désabonner définitivement ? L’abonnement s’arrête immédiatement."
            confirmYes="Oui"
            confirmNo="Non"
            cancelPending="Annulation…"
            cancelSuccess="Abonnement annulé. Un e-mail de confirmation t’a été envoyé."
            cancelError="Impossible d’annuler l’abonnement. Réessaie ou contacte le support."
            cancelUnavailable="Aucun abonnement actif à annuler."
          />
        </div>
      </div>
    ),
  },
  {
    slug: 'admin-live-recurrent',
    lot: '2a',
    title: 'Admin — live récurrent (aperçu des dates)',
    render: () => (
      <div className="luxury-shell admin-area min-h-screen p-8">
        <div className="mx-auto max-w-lg rounded-[1.75rem] border border-[#D9C9B4] bg-white/70 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">Nouveau live</p>
          <h2 className="mt-2 font-serif text-2xl italic text-luxury-ink">Pilates · français · 19:00</h2>
          <label className="mt-4 flex items-center gap-3 text-sm">
            <input type="checkbox" checked readOnly />
            Répéter chaque semaine jusqu’au
          </label>
          <p className="mt-2 text-sm text-luxury-muted">16 nov. 2026</p>
          <ul className="mt-3 list-disc pl-5 text-sm text-luxury-ink">
            {FAKE_REPEAT_DATES.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    slug: 'centre-notifications',
    lot: '2b',
    title: 'Centre de notifications (A08)',
    render: () => (
      <div className="luxury-shell min-h-screen">
        <NotificationsCenterV2 items={DEMO_NOTIF_ITEMS} unreadCount={2} nextLiveLabel="Demain 18:30 · Barre/Pilates Flow" />
      </div>
    ),
  },
  {
    slug: 'preferences-notifications',
    lot: '2b',
    title: 'Préférences de notifications (A09)',
    render: () => (
      <div className="luxury-shell min-h-screen">
        <PreferencesNotifV2 marketingOptIn={false} otherLanguage={false} />
      </div>
    ),
  },
  {
    slug: 'admin-sante',
    lot: '2b',
    title: 'Admin — Santé des envois (A10)',
    render: () => (
      <div className="luxury-shell admin-area min-h-screen">
        <AdminSanteV2
          noLiveAlert
          backlog={8850}
          heartbeats={[
            { job: 'course-reminders', last_run_at: 'il y a 3 min', late: false },
            { job: 'social', last_run_at: 'jamais', late: true },
          ]}
          sent7d={{ email: 42, fail: 1, push: 8 }}
          errors={['resend_batch_error (email masqué)']}
        />
      </div>
    ),
  },
  {
    slug: 'admin-programmes',
    lot: '3a',
    title: 'Admin — Programmes (B10)',
    render: () => (
      <div className="luxury-shell admin-area relative min-h-screen">
        <div className="luxury-bg-orbs" aria-hidden />
        <AdminProgrammesManager programs={DEMO_ADMIN_PROGRAMS} videos={DEMO_ADMIN_VIDEOS} preview tablesMissing />
      </div>
    ),
  },
  {
    slug: 'programmes-catalogue',
    lot: '3b',
    title: 'Programmes — catalogue (B01)',
    render: () => (
      <div className="luxury-shell min-h-screen">
        <CatalogClient activeSlug="les-fondations" />
      </div>
    ),
  },
  {
    slug: 'programme-decouverte',
    lot: '3b',
    title: 'Programme — découverte (B03)',
    render: () => (
      <div className="luxury-shell min-h-screen">
        <ProgramDetailClient program={CATALOG_PROGRAMS[0]} mode="discovery" />
      </div>
    ),
  },
  {
    slug: 'programme-en-cours',
    lot: '3b',
    title: 'Programme — en cours (B02)',
    render: () => (
      <div className="luxury-shell min-h-screen">
        <ProgramDetailClient program={CATALOG_PROGRAMS[0]} mode="active" />
      </div>
    ),
  },
  {
    slug: 'seance-lecteur',
    lot: '3b',
    title: 'Séance — lecteur (B05)',
    render: () => (
      <div className="luxury-shell min-h-screen">
        <SessionPlayer
          preview
          programTitle="Les Fondations du Pilates"
          slug="les-fondations"
          sessionTitle="Les bases au sol, partie 2"
          weekLabel="Semaine 2 · Stabiliser · séance 5 sur 9"
          objective="Enchaîner la 2e moitié de la séance en gardant le bassin stable."
          cues={['Omoplates basses, loin des oreilles', 'La nuque prolonge la colonne', 'Le mouvement part du centre, pas des bras']}
          startS={1800}
          endS={3671}
          durationS={3671}
          prevHref="/dev/apercu/programme-en-cours"
          nextHref="/dev/apercu/programme-en-cours"
          softerHref="/dev/apercu/programmes-catalogue"
        />
      </div>
    ),
  },
  {
    slug: 'programme-termine',
    lot: '3b',
    title: 'Programme terminé (B07)',
    render: () => (
      <div className="luxury-shell min-h-screen">
        <ProgramDone
          preview
          firstName="Margaux"
          programTitle="Les Fondations du Pilates"
          slug="les-fondations"
          nextSlug="centre-solide"
          nextTitle="Centre solide"
          certificateUrl="#"
          storyUrl="#"
        />
      </div>
    ),
  },
  {
    slug: 'mon-programme-dashboard',
    lot: '3b',
    title: 'Tableau de bord — Mon programme (B06)',
    render: () => (
      <div className="luxury-shell min-h-screen p-8">
        <h1 className="hero-signature-title text-4xl">Bonjour Margaux</h1>
        <div className="mt-6">
          <MonProgrammeCard
            state="active"
            title="Les Fondations du Pilates"
            nextSession="les bases au sol, partie 2"
            minutes={31}
            progressLabel="semaine 2 sur 3"
            percent={44}
            href="/compte/programmes/les-fondations"
          />
        </div>
        <div className="mt-8">
          <MonProgrammeCard state="empty" href="/compte/programmes" />
        </div>
      </div>
    ),
  },
  {
    slug: 'test-niveau',
    lot: '3b',
    title: 'Test de niveau (D08)',
    render: () => (
      <div className="luxury-shell min-h-screen px-4 py-16">
        <LevelTestClient />
      </div>
    ),
  },
  {
    slug: 'offrir',
    lot: '4',
    title: 'Offrir (C01)',
    render: () => (
      <OffrirClient
        preview
        emailDeliveryOn={false}
        prices={[
          { months: 1, priceId: null, amountCents: 3900, currency: 'eur', perMonthCents: 3900, badge: null },
          { months: 3, priceId: null, amountCents: 10900, currency: 'eur', perMonthCents: 3633, badge: null },
          { months: 6, priceId: null, amountCents: 19500, currency: 'eur', perMonthCents: 3250, badge: '1 mois offert' },
          { months: 12, priceId: null, amountCents: 34900, currency: 'eur', perMonthCents: 2908, badge: '3 mois offerts' },
        ]}
      />
    ),
  },
  {
    slug: 'offrir-activer',
    lot: '4',
    title: 'Activer une carte cadeau (C04)',
    render: () => <ActivateGiftClient preview />,
  },
  {
    slug: 'admin-cartes-cadeaux',
    lot: '4',
    title: 'Admin — cartes cadeaux (C05)',
    render: () => <AdminGiftsManager preview />,
  },
];
