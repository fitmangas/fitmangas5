import type { ReactNode } from 'react';

import { AdminMfaClient } from '@/components/Admin/AdminMfaClient';
import { ProfileBillingCard } from '@/components/Compte/ProfileBillingCard';
import { AdminSanteV2 } from '@/components/Notifications/v2/AdminSanteV2';
import { DEMO_NEXT_LIVE, DEMO_NOTIF_ITEMS, DEMO_RECEIVE_LINES } from '@/components/Notifications/v2/demo-data';
import { NotificationsCenterV2 } from '@/components/Notifications/v2/NotificationsCenterV2';
import { PreferencesNotifV2 } from '@/components/Notifications/v2/PreferencesNotifV2';
import { PREF_KEYS, type PrefKey } from '@/lib/notifications/v2/preference-keys';
import { AdminProgrammesManager } from '@/components/Programmes/admin/AdminProgrammesManager';
import { demoAdminData } from '@/lib/programmes/admin-data';
import { CatalogClient } from '@/components/Programmes/CatalogClient';
import { ProgramDiscovery, ProgramInProgress } from '@/components/Programmes/ProgramDetailViews';
import { buildActiveSummary, buildDiscoveryProps, buildInProgressProps, buildSessionProps, softerProgramFor } from '@/lib/programmes/view-models';
import { demoCatalogView } from '@/lib/programmes/catalog-view';
import { demoCompletion } from '@/lib/programmes/completion';
import { DEMO_LIVE, DEMO_TODAY, DEMO_TZ, demoDefinition, demoEnrollment, demoState } from '@/lib/programmes/demo';
import { SessionPlayer } from '@/components/Programmes/SessionPlayer';
import { ProgramDone } from '@/components/Programmes/ProgramDone';
import { MonProgrammeCard } from '@/components/Programmes/MonProgrammeCard';
import { LevelTestPage } from '@/components/Programmes/LevelTestPage';
import { CATALOG_PROGRAMS } from '@/lib/programmes/catalogue';
import { OffrirClient } from '@/components/Gifts/OffrirClient';
import { ActivateGiftClient } from '@/components/Gifts/ActivateGiftClient';
import { AdminGiftsManager } from '@/components/Gifts/AdminGiftsManager';
import { demoAdminGiftRows, giftStats, toAdminGiftRows } from '@/lib/gifts/admin-data';
import { withFreeMonths, type GiftPrice } from '@/lib/gifts/prices';

const DEMO_GIFT_PRICES: GiftPrice[] = withFreeMonths([
  { months: 1, priceId: null, amountCents: 3900, currency: 'eur', perMonthCents: 3900, freeMonths: null },
  { months: 3, priceId: null, amountCents: 10900, currency: 'eur', perMonthCents: 3633, freeMonths: null },
  { months: 6, priceId: null, amountCents: 19500, currency: 'eur', perMonthCents: 3250, freeMonths: null },
  { months: 12, priceId: null, amountCents: 34900, currency: 'eur', perMonthCents: 2908, freeMonths: null },
]);
import { PublicSiteHeader } from '@/components/Marketing/PublicSiteHeader';
import { HowItWorks } from '@/components/Marketing/HowItWorks';
import { LandingFaq } from '@/components/Marketing/LandingFaq';
import { PlanningV3 } from '@/components/Compte/PlanningV3';
import { BoutiqueOrderComposer } from '@/components/Compte/BoutiqueOrderComposer';
import type { SmartCourse } from '@/lib/domain/calendar-types';
import { LiveHabillage } from '@/components/Live/LiveHabillage';
import { PreviewTrialModal } from '@/components/dev/Lot5Previews';
import { AdminClientsFollowup } from '@/components/Admin/AdminClientsFollowup';
import { LesCoursExtras } from '@/components/Marketing/LesCoursExtras';
import { CompteMobileBottomNav } from '@/components/Compte/CompteMobileBottomNav';
import { CompteSidebar } from '@/components/Compte/CompteSidebar';
import { SidebarTooltip } from '@/components/Compte/SidebarTooltip';
import { CalendarDays, Users } from 'lucide-react';
import {
  PremiersPasHelpPreview,
  PremiersPasListPreview,
  PremiersPasTourPreview,
} from '@/components/dev/PremiersPasPreviews';

const DEMO_PREFS = Object.fromEntries(
  (Object.keys(PREF_KEYS) as PrefKey[]).map((k) => [k, PREF_KEYS[k].defaultValue]),
) as Record<PrefKey, boolean>;
const DEMO_PREFS_WRITABLE = Object.fromEntries((Object.keys(PREF_KEYS) as PrefKey[]).map((k) => [k, true])) as Record<PrefKey, boolean>;

const PLANNING_DEMO_NOW = '2026-10-21T14:00:00Z';

function planningDemoCourse(id: string, title: string, startsAt: string, minutes: number, language: 'fr' | 'es'): SmartCourse {
  const start = new Date(startsAt);
  return {
    id,
    slug: id,
    title,
    description: null,
    course_format: 'online',
    course_category: 'group',
    starts_at: start.toISOString(),
    ends_at: new Date(start.getTime() + minutes * 60000).toISOString(),
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

function planningDemoEvents(): SmartCourse[] {
  return [
    planningDemoCourse('demo-lun-1', 'Pilates Mat', '2026-10-19T16:00:00Z', 55, 'es'),
    planningDemoCourse('demo-lun-2', 'Yoga Flow', '2026-10-19T17:15:00Z', 55, 'es'),
    planningDemoCourse('demo-mer', 'Pilates Accessoires', '2026-10-21T16:00:00Z', 55, 'fr'),
    planningDemoCourse('demo-jeu', 'Barre Pilates Flow', '2026-10-22T16:30:00Z', 55, 'fr'),
    planningDemoCourse('demo-sam', 'Fit-Dance', '2026-10-24T08:30:00Z', 55, 'fr'),
  ];
}

const PLANNING_DEMO_SESSIONS = [
  { id: 's4', dayKey: '2026-10-19', title: 'Pilates Mat 2', stepLabel: 'Ta séance 4', durationMin: 31, href: '#', done: true },
  { id: 's5', dayKey: '2026-10-21', title: 'Les bases au sol, partie 2', stepLabel: 'Ta séance 5', durationMin: 31, href: '#' },
  { id: 's6', dayKey: '2026-10-23', title: 'Stretching 1', stepLabel: 'Ta séance 6', durationMin: 23, href: '#' },
];

function demoAdminProps() {
  const d = demoAdminData('les-fondations');
  return { programs: d.items, detail: d.detail, videos: d.videos, stats: d.stats };
}

function demoActiveSummary() {
  const def = demoDefinition();
  const data = demoEnrollment(def);
  const state = demoState(def, data);
  return buildActiveSummary({ def, data, state, live: DEMO_LIVE, lang: 'fr', todayKey: DEMO_TODAY, timeZone: DEMO_TZ });
}

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
        <NotificationsCenterV2
          items={DEMO_NOTIF_ITEMS}
          unreadCount={DEMO_NOTIF_ITEMS.filter((i) => !i.read_at).length}
          nextLive={DEMO_NEXT_LIVE}
          receive={DEMO_RECEIVE_LINES}
          showProgrammeFilter
          olderHref="/compte/notifications?tout=1"
        />
      </div>
    ),
  },
  {
    slug: 'preferences-notifications',
    lot: '2b',
    title: 'Préférences de notifications (A09)',
    render: () => (
      <div className="luxury-shell min-h-screen">
        <PreferencesNotifV2
          preview
          initial={DEMO_PREFS}
          writable={DEMO_PREFS_WRITABLE}
          pushEnabled={false}
          programme={{ title: 'Les Fondations du Pilates', schedule: 'lun · mer · ven à 18:00', editHref: '/compte/programmes' }}
        />
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
          data={{
            checkedAt: '16:58',
            noLiveAfter: 'sam. 18 oct.',
            noLiveAlert: true,
            backlog: 8850,
            backlogDetail: [
              { digest_bucket: 'daily', event_type: 'replay.ready', n: 6120 },
              { digest_bucket: 'daily', event_type: 'standalone.video_published', n: 2310 },
              { digest_bucket: 'weekly', event_type: 'blog.article_published', n: 420 },
            ],
            tasks: [
              { job: 'course-reminders', label: 'Rappels des lives', frequency: 'toutes les 10 min', last: 'il y a 4 min', result: '2 rappels envoyés', next: 'dans 6 min', state: 'ok' },
              { job: 'social', label: 'Publication réseaux sociaux', frequency: 'toutes les 10 min', last: 'il y a 4 min', result: 'rien à publier', next: 'dans 6 min', state: 'ok' },
              { job: 'hourly', label: 'Récapitulatifs, « Ta semaine », séances du jour', frequency: 'toutes les heures (:05)', last: 'il y a 58 min', result: '0 récapitulatif', next: 'dans 2 min', state: 'ok' },
              { job: 'daily-jobs', label: 'Tâches quotidiennes', frequency: 'chaque jour', last: 'il y a 10 h', result: 'terminé', next: 'dans 14 h', state: 'ok' },
              { job: 'push', label: 'Push téléphone', frequency: 'à chaque envoi', last: '—', result: '0 appareil équipé', next: '—', state: 'info' },
            ],
            lives: [
              { label: 'Pilates Mat · ES · jeu. 15 oct. 17:00', recipients: 1, eve: { done: true, text: 'envoyé (1)' }, hour: { done: false, text: 'prévu 16:00' } },
              { label: 'Barre/Pilates Flow · FR · jeu. 15 oct. 18:30', recipients: 3, eve: { done: true, text: 'envoyé (3)' }, hour: { done: false, text: 'prévu 17:30' } },
              { label: 'Barre/Pilates Flow · FR · sam. 17 oct. 10:30', recipients: 3, eve: { done: false, text: 'prévu ven. dès 18:00 (heure cliente)' }, hour: { done: false, text: 'prévu 09:30' } },
            ],
            sent7d: { email: 42, failed: 1, push: 0, inApp: 118, pushEquipped: 0 },
            errors: ['12 oct. 18:02 · course.visio.reminder_J-1 · c•••@gmail.com (adresse invalide)'],
          }}
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
        <AdminProgrammesManager {...demoAdminProps()} preview />
      </div>
    ),
  },
  {
    slug: 'programmes-catalogue',
    lot: '3b',
    title: 'Programmes — catalogue (B01)',
    render: () => (
      <div className="luxury-shell min-h-screen">
        <CatalogClient view={demoCatalogView(demoActiveSummary())} />
      </div>
    ),
  },
  {
    slug: 'programme-decouverte',
    lot: '3b',
    title: 'Programme — découverte (B03)',
    render: () => (
      <div className="luxury-shell min-h-screen">
        <ProgramDiscovery {...buildDiscoveryProps({ def: demoDefinition(), lang: 'fr', otherActive: null, todayKey: DEMO_TODAY })} preview />
      </div>
    ),
  },
  {
    slug: 'programme-demarrage',
    lot: '3b',
    title: 'Programme — modale de démarrage (B04)',
    render: () => (
      <div className="luxury-shell min-h-screen">
        <ProgramDiscovery
          {...buildDiscoveryProps({
            def: demoDefinition('centre-solide'),
            lang: 'fr',
            otherActive: { title: 'Les Fondations du Pilates', percent: 44 },
            todayKey: DEMO_TODAY,
          })}
          preview
          startOpen
        />
      </div>
    ),
  },
  {
    slug: 'programme-en-cours',
    lot: '3b',
    title: 'Programme — en cours (B02)',
    render: () => {
      const def = demoDefinition();
      const data = demoEnrollment(def);
      const state = demoState(def, data);
      const props = buildInProgressProps({ def, data, state, live: DEMO_LIVE, lang: 'fr', todayKey: DEMO_TODAY, timeZone: DEMO_TZ });
      return (
        <div className="luxury-shell min-h-screen">
          <ProgramInProgress {...props} preview />
        </div>
      );
    },
  },
  {
    slug: 'programme-en-cours-difficile',
    lot: '3b',
    title: 'Programme — en cours, deux « Difficile » (B02)',
    render: () => {
      const def = demoDefinition('centre-solide');
      const data = demoEnrollment(def, 6);
      const state = demoState(def, data);
      const props = buildInProgressProps({
        def,
        data,
        state,
        live: null,
        lang: 'fr',
        todayKey: DEMO_TODAY,
        timeZone: DEMO_TZ,
        softerProgram: softerProgramFor(def.program, CATALOG_PROGRAMS, 'fr'),
      });
      return (
        <div className="luxury-shell min-h-screen">
          <ProgramInProgress {...props} preview />
        </div>
      );
    },
  },
  {
    slug: 'seance-lecteur',
    lot: '3b',
    title: 'Séance — lecteur (B05)',
    render: () => {
      const def = demoDefinition();
      const data = demoEnrollment(def);
      const state = demoState(def, data);
      const step = def.steps.filter((x) => x.kind === 'video')[4];
      const props = buildSessionProps({ def, data, state, step, lang: 'fr', todayKey: DEMO_TODAY, timeZone: DEMO_TZ, live: DEMO_LIVE });
      return (
        <div className="luxury-shell min-h-screen">
          <SessionPlayer {...props} videoDurationS={3671} preview />
        </div>
      );
    },
  },
  {
    slug: 'programme-termine',
    lot: '3b',
    title: 'Programme terminé (B07)',
    render: () => (
      <div className="luxury-shell min-h-screen">
        <ProgramDone
          preview
          data={demoCompletion()}
          next={{
            slug: 'centre-solide',
            title: 'Centre solide',
            promise: '4 semaines avec ballon, cercle et bande pour un centre fort et un dos protégé.',
            level: 2,
            coverUrl: '/programmes/pm-centre-ballon.jpg',
          }}
          alternative={{ slug: 'barre-en-douceur', title: 'Barre en douceur' }}
          certificateUrl="/api/programmes/certificat/apercu"
          storyUrl="/api/programmes/story/apercu"
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
          <MonProgrammeCard summary={demoActiveSummary()} lang="fr" />
        </div>
        <div className="mt-8">
          <MonProgrammeCard summary={{ ...demoActiveSummary(), paused: true }} lang="fr" />
        </div>
        <div className="mt-8">
          <MonProgrammeCard summary={null} lang="fr" />
        </div>
      </div>
    ),
  },
  {
    slug: 'test-niveau',
    lot: '3b',
    title: 'Test de niveau (D08)',
    render: () => (
      <LevelTestPage
        initialLang="fr"
        member={false}
        programs={{
          fr: demoCatalogView(null).cards.map((c) => ({ ...c, published: true })),
          es: demoCatalogView(null, 'es').cards.map((c) => ({ ...c, published: true })),
        }}
      />
    ),
  },
  {
    slug: 'offrir',
    lot: '4',
    title: 'Offrir (C01)',
    render: () => <OffrirClient preview emailDeliveryOn prices={DEMO_GIFT_PRICES} monthlyPriceLabel="39 €" facts={{ programmes: 12, libraryHours: 50 }} />,
  },
  {
    slug: 'offrir-es',
    lot: '4',
    title: 'Offrir (C01) — espagnol',
    render: () => (
      <OffrirClient preview initialLang="es" emailDeliveryOn prices={DEMO_GIFT_PRICES} monthlyPriceLabel="39 €" facts={{ programmes: 12, libraryHours: 50 }} />
    ),
  },
  {
    slug: 'offrir-merci',
    lot: '4',
    title: 'Offrir (C01) — après paiement',
    render: () => <OffrirClient ok emailDeliveryOn prices={DEMO_GIFT_PRICES} />,
  },
  {
    slug: 'offrir-activer',
    lot: '4',
    title: 'Activer une carte cadeau (C04)',
    render: () => <ActivateGiftClient preview session={null} facts={{ programmes: 12, libraryHours: 50 }} monthlyPriceLabel="39 €" />,
  },
  {
    slug: 'offrir-activer-es',
    lot: '4',
    title: 'Activer une carte cadeau (C04) — espagnol',
    render: () => <ActivateGiftClient preview initialLang="es" session={null} facts={{ programmes: 12, libraryHours: 50 }} monthlyPriceLabel="39 €" />,
  },
  {
    slug: 'offrir-activer-connectee',
    lot: '4',
    title: 'Activer une carte cadeau (C04) — déjà connectée',
    render: () => (
      <ActivateGiftClient preview session={{ email: 'julie.m@exemple.fr' }} facts={{ programmes: 12, libraryHours: 50 }} monthlyPriceLabel="39 €" />
    ),
  },
  {
    slug: 'offrir-activer-ok',
    lot: '4',
    title: 'Activer une carte cadeau (C04) — activée',
    render: () => (
      <ActivateGiftClient
        preview
        session={null}
        facts={{ programmes: 12, libraryHours: 50 }}
        monthlyPriceLabel="39 €"
        previewDone={{ mode: 'balance_credit', months: 3, accessEndsAt: null, creditCents: 11700, needsReactivation: true }}
      />
    ),
  },
  {
    slug: 'admin-cartes-cadeaux',
    lot: '4',
    title: 'Admin — cartes cadeaux (C05)',
    render: () => {
      const rows = demoAdminGiftRows();
      const now = new Date('2026-10-20T10:00:00Z');
      return (
        <div className="luxury-shell admin-area relative min-h-screen">
          <div className="luxury-bg-orbs" aria-hidden />
          <AdminGiftsManager preview rows={toAdminGiftRows(rows, now)} stats={giftStats(rows, now)} />
        </div>
      );
    },
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
      <div className="luxury-shell min-h-screen">
        <div className="mx-auto max-w-[1280px] px-5 pb-16 pt-6 md:px-8 md:pt-10">
          <PlanningV3
            variant="page"
            timeZone="Europe/Paris"
            nowIso={PLANNING_DEMO_NOW}
            initialEvents={planningDemoEvents()}
            programSessions={PLANNING_DEMO_SESSIONS}
          />
        </div>
      </div>
    ),
  },
  {
    slug: 'planning-v3-tableau-de-bord',
    lot: '5',
    title: 'Planning v3 — tableau de bord (B06)',
    render: () => (
      <div className="luxury-shell min-h-screen">
        <div className="mx-auto max-w-[1280px] px-5 pb-16 pt-6 md:px-8 md:pt-10">
          <PlanningV3
            variant="dashboard"
            timeZone="Europe/Paris"
            nowIso={PLANNING_DEMO_NOW}
            initialEvents={planningDemoEvents()}
            programSessions={PLANNING_DEMO_SESSIONS}
          />
        </div>
      </div>
    ),
  },
  {
    slug: 'boutique-cliente',
    lot: '5',
    title: 'Boutique de l’espace cliente (D02)',
    render: () => (
      <div className="luxury-shell min-h-screen">
        <div className="mx-auto max-w-[1280px] px-5 pb-16 pt-6 md:px-8 md:pt-10">
          <BoutiqueOrderComposer
            lang="fr"
            ordersCount={2}
            inProgressCount={1}
            products={[
              { id: 1, name: 'Tapis de Pilates FitMangas', image: null, minPrice: 64, maxPrice: 64, currency: 'EUR', category: 'accessoires' },
              { id: 2, name: 'Brassière de sport', image: null, minPrice: 42, maxPrice: 42, currency: 'EUR', category: 'bouger' },
              { id: 3, name: 'Casquette FitMangas', image: null, minPrice: 29, maxPrice: 29, currency: 'EUR', category: 'quotidien' },
              { id: 4, name: 'Gourde inox', image: null, minPrice: 32, maxPrice: 32, currency: 'EUR', category: 'accessoires' },
              { id: 5, name: 'Sac de sport', image: null, minPrice: 49, maxPrice: 49, currency: 'EUR', category: 'accessoires' },
              { id: 6, name: 'Legging FitMangas', image: null, minPrice: 39, maxPrice: 44, currency: 'EUR', category: 'bouger' },
              { id: 7, name: 'Tote bag éco', image: null, minPrice: 24, maxPrice: 24, currency: 'EUR', category: 'quotidien' },
              { id: 8, name: 'Mug de voyage', image: null, minPrice: 27, maxPrice: 27, currency: 'EUR', category: 'quotidien' },
            ]}
          />
        </div>
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
        <CompteMobileBottomNav lang="fr" unreadNotifications={2} firstName="Margaux" lastName="Dupont" planLabel="Visio collectif · actif" />
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
  {
    slug: 'premiers-pas-bienvenue',
    lot: 'Premiers pas',
    title: 'Tuto guidé — fenêtre de bienvenue',
    render: () => <PremiersPasTourPreview step={0} />,
  },
  {
    slug: 'premiers-pas-etape-1',
    lot: 'Premiers pas',
    title: 'Tuto guidé — étape 1 (prochain live)',
    render: () => <PremiersPasTourPreview step={1} />,
  },
  {
    slug: 'premiers-pas-etape-3',
    lot: 'Premiers pas',
    title: 'Tuto guidé — étape 3 (planning)',
    render: () => <PremiersPasTourPreview step={3} />,
  },
  {
    slug: 'premiers-pas-etape-4',
    lot: 'Premiers pas',
    title: 'Tuto guidé — dernière étape (replays)',
    render: () => <PremiersPasTourPreview step={4} />,
  },
  {
    slug: 'premiers-pas-liste',
    lot: 'Premiers pas',
    title: 'Liste « Tes premiers pas »',
    render: () => <PremiersPasListPreview />,
  },
  {
    slug: 'premiers-pas-aide',
    lot: 'Premiers pas',
    title: 'Aide « Comment ça marche ? » — page Planning',
    render: () => <PremiersPasHelpPreview pathname="/compte/planning" />,
  },
  {
    slug: 'premiers-pas-menus',
    lot: 'Premiers pas',
    title: 'Bouton « ? » — menu latéral et barre haute du téléphone',
    render: () => (
      <div className="luxury-shell relative min-h-screen">
        <CompteSidebar lang="fr" unreadNotifications={2} helpEnabled />
        <CompteMobileBottomNav
          lang="fr"
          unreadNotifications={2}
          firstName="Jenny"
          lastName="M."
          planLabel="Visio collectif · essai"
          helpEnabled
        />
        <p className="px-6 pt-8 text-sm text-luxury-muted md:pl-28">Aperçu du bouton « ? » (données fictives).</p>
      </div>
    ),
  },
];
