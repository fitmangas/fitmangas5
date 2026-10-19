import type { ReactNode } from 'react';

import { AdminMfaClient } from '@/components/Admin/AdminMfaClient';
import { ProfileBillingCard } from '@/components/Compte/ProfileBillingCard';

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
];
