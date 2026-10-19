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
import { PublicSiteHeader } from '@/components/Marketing/PublicSiteHeader';
import { HowItWorks } from '@/components/Marketing/HowItWorks';
import { LandingFaq } from '@/components/Marketing/LandingFaq';
import { PlanningV3 } from '@/components/Compte/PlanningV3';
import { LiveHabillage } from '@/components/Live/LiveHabillage';
import { PreviewTrialModal } from '@/components/dev/Lot5Previews';
import { AdminClientsFollowup } from '@/components/Admin/AdminClientsFollowup';
import { LesCoursExtras } from '@/components/Marketing/LesCoursExtras';
import { CompteMobileBottomNav } from '@/components/Compte/CompteMobileBottomNav';
import { SidebarTooltip } from '@/components/Compte/SidebarTooltip';
import { CalendarDays, Users } from 'lucide-react';

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
  {
    slug: 'modale-essai',
    lot: '5',
    title: 'Modale essai (D01)',
    render: () => (
      <div className="min-h-screen bg-brand-beige">
        <PublicSiteHeader lang="FR" />
        <PreviewTrialModal />
      </div>
    ),
  },
  {
    slug: 'planning-v3',
    lot: '5',
    title: 'Planning v3 (D04)',
    render: () => (
      <div className="luxury-shell min-h-screen p-6">
        <PlanningV3
          preview
          compact={false}
          programSessions={[
            { id: 'p1', dayKey: new Date().toISOString().slice(0, 10), title: 'Les bases au sol', stepLabel: 'Ta séance 2', durationMin: 23, href: '#' },
          ]}
        />
      </div>
    ),
  },
  {
    slug: 'live-habillage',
    lot: '5',
    title: 'Page du live — habillage (D03)',
    render: () => (
      <LiveHabillage
        title="Barre/Pilates Flow"
        languageLabel="en français"
        startsAt={new Date(Date.now() + 14 * 60000).toISOString()}
        endsAt={new Date(Date.now() + 55 * 60000).toISOString()}
        backHref="/compte"
        backLabel="Mon espace"
        spotifyUrl="https://open.spotify.com"
      >
        <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-2xl bg-black">
          <p className="absolute inset-0 flex items-center justify-center text-white/70">Cadre Jitsi (fictif — aperçu)</p>
        </div>
      </LiveHabillage>
    ),
  },
  {
    slug: 'comment-ca-marche',
    lot: '5',
    title: 'Accueil — Comment ça marche + FAQ',
    render: () => (
      <div className="min-h-screen bg-brand-beige px-5 py-10">
        <PublicSiteHeader lang="FR" />
        <HowItWorks lang="FR" />
        <LandingFaq lang="FR" />
      </div>
    ),
  },
  {
    slug: 'suivi-clientes',
    lot: '5',
    title: 'Admin — suivi des clientes (D09)',
    render: () => (
      <div className="luxury-shell admin-area min-h-screen">
        <AdminClientsFollowup preview />
      </div>
    ),
  },
  {
    slug: 'les-cours',
    lot: '5',
    title: 'Les cours (D07)',
    render: () => (
      <div className="min-h-screen bg-brand-beige">
        <PublicSiteHeader lang="FR" />
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <LesCoursExtras
            lives={[
              { id: '1', title: 'Pilates Mat', startsAt: new Date().toISOString(), language: 'es' },
              { id: '2', title: 'Barre Pilates Flow', startsAt: new Date(Date.now() + 86400000 * 2).toISOString(), language: 'fr' },
            ]}
          />
        </div>
      </div>
    ),
  },
  {
    slug: 'nav-mobile',
    lot: '5',
    title: 'Navigation mobile (D06)',
    render: () => (
      <div className="relative mx-auto min-h-screen max-w-[390px] bg-brand-beige pb-32">
        <CompteMobileBottomNav lang="fr" unreadNotifications={2} />
        <p className="px-6 pt-8 text-sm text-luxury-muted">Aperçu barre haute + onglets (données fictives).</p>
      </div>
    ),
  },
  {
    slug: 'acces-v2',
    lot: '6',
    title: 'Comparatif accès actuel / ACCESS_V2',
    render: () => (
      <div className="luxury-shell min-h-screen p-8">
        <h1 className="hero-signature-title text-3xl text-luxury-ink">Accès visio — comparatif (données fictives)</h1>
        <p className="mt-2 text-sm text-luxury-muted">Toute différence bloque l’activation de ACCESS_V2.</p>
        <table className="mt-6 min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.12em] text-luxury-soft">
              <th className="py-2 pr-4">Profil</th>
              <th className="py-2 pr-4">Actuel</th>
              <th className="py-2 pr-4">V2</th>
              <th className="py-2">Écart</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-black/5">
              <td className="py-2 pr-4">f749fae0…</td>
              <td>oui</td>
              <td>oui (abonnement live)</td>
              <td>OK</td>
            </tr>
            <tr className="border-t border-black/5">
              <td className="py-2 pr-4">0e7da730…</td>
              <td>oui (profil active)</td>
              <td>non (aucune subscription)</td>
              <td className="font-semibold text-[#a5452a]">DIFFÉRENCE</td>
            </tr>
            <tr className="border-t border-black/5">
              <td className="py-2 pr-4">fa6b0305…</td>
              <td>oui (profil active)</td>
              <td>non (canceled)</td>
              <td className="font-semibold text-[#a5452a]">DIFFÉRENCE</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    slug: 'info-bulles',
    lot: '5',
    title: 'Info-bulles menu (D10)',
    render: () => (
      <div className="flex min-h-screen items-center justify-center bg-brand-beige p-10">
        <div className="flex flex-col gap-3 rounded-full bg-white/80 p-3">
          <SidebarTooltip label="Planning">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-luxury-ink">
              <CalendarDays size={22} />
            </span>
          </SidebarTooltip>
          <SidebarTooltip label="Clientes">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-luxury-ink">
              <Users size={22} />
            </span>
          </SidebarTooltip>
        </div>
        <p className="ml-8 max-w-xs text-sm text-luxury-muted">Survole une icône (150 ms) : l’étiquette apparaît à droite.</p>
      </div>
    ),
  },
  {
    slug: 'croissance-v2',
    lot: '7',
    title: 'Croissance V2 — aperçu (données fictives)',
    render: () => (
      <div className="min-h-screen bg-[#FFFAF5] p-8 text-[#2A2420]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#C45D3E]">Admin · Croissance</p>
        <h1 className="mt-2 text-3xl font-bold">Lot 7 — sans rien supprimer</h1>
        <p className="mt-2 max-w-xl text-sm text-[#5A5550]">
          43 règles conservées. Drapeau CROISSANCE_V2 éteint : le site actuel ne change pas.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            ['Vue d’ensemble', 'Entonnoir de référence + Inclure les tests (off)'],
            ['Conversations', 'Étiquette Test masquée par défaut'],
            ['Workflows', 'Liste 43 règles · une relance à la fois'],
            ['ADS', 'Témoignage vidéo · Avant le premier euro'],
            ['Publications', 'Doublon · À filmer · bloqué en cours'],
            ['SEO', 'Guides par thème · cache 1 h'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-[1.75rem] bg-white p-5 shadow-sm">
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-sm text-[#78716C]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];
