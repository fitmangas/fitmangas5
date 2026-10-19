'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { BellRing, Check, LogOut, Mail, MessageCircle, Search, UserPlus, Users } from 'lucide-react';

import { MEMBER_HEALTH_LABELS } from '@/lib/admin/health-labels';
import type { MemberHealthBadge } from '@/lib/admin/member-health';
import { MEMBER_PAYMENT_LABELS, type MemberPaymentBadge } from '@/lib/admin/member-payment-status';
import { A_VALIDER_LOT5 } from '@/content/a-valider';

export type FollowupReason = 'payment_failed' | 'trial_ending' | 'incomplete' | 'inactive' | 'cancelled';

export type FollowupClient = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt: string | null;
  lastActivity: string;
  lastActivityTs: number;
  health: MemberHealthBadge;
  paymentBadge: MemberPaymentBadge;
  paymentDetail: string | null;
  lastCheckout?: string | null;
  endsAtTs?: number | null;
};

const REASON_LABEL: Record<FollowupReason, string> = {
  payment_failed: 'Paiement échoué',
  trial_ending: "Fin d'essai dans 3 jours",
  incomplete: 'Inscription non finalisée',
  inactive: 'Sans activité depuis 14 jours',
  cancelled: 'Résiliée récemment',
};

const REASON_DOT: Record<FollowupReason, string> = {
  payment_failed: '#c45d3e',
  trial_ending: '#e6a285',
  incomplete: '#b9b2aa',
  inactive: '#c45d3e',
  cancelled: '#b9b2aa',
};

const OFFER_LABEL: Record<string, string> = {
  'v-coll': 'Visio collectif',
  'v-ind': 'Visio individuel',
  gift: 'Carte cadeau',
};

type Tab = 'all' | 'active' | 'trial' | 'incomplete' | 'former';

function displayName(row: FollowupClient) {
  const first = row.firstName?.trim() || '';
  const last = row.lastName?.trim() || '';
  if (first && last) return `${first} ${last.charAt(0).toUpperCase()}.`;
  return first || last || row.id.slice(0, 8);
}

function initial(row: FollowupClient) {
  return (row.firstName || row.lastName || '?').charAt(0).toUpperCase();
}

function waHref(phone: string | null | undefined, message: string) {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  const intl = digits.startsWith('0') ? `33${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

function classify(row: FollowupClient, now: number): FollowupReason | null {
  const created = row.createdAt ? new Date(row.createdAt).getTime() : 0;
  if (row.paymentBadge === 'payment_failed') return 'payment_failed';
  if (row.paymentBadge === 'trial' && row.endsAtTs && row.endsAtTs - now <= 3 * 86400000 && row.endsAtTs >= now && row.lastActivityTs === 0) {
    return 'trial_ending';
  }
  if ((row.paymentBadge === 'incomplete' || row.paymentBadge === 'none') && created > 0 && now - created <= 7 * 86400000) {
    return 'incomplete';
  }
  if (row.paymentBadge === 'paid' && (row.health === 'red' || row.health === 'orange')) return 'inactive';
  if (row.paymentBadge === 'canceled' && row.endsAtTs && now - row.endsAtTs <= 30 * 86400000) return 'cancelled';
  if (row.paymentBadge === 'canceled' && created > 0 && now - created <= 30 * 86400000) return 'cancelled';
  return null;
}

function contextLine(row: FollowupClient, reason: FollowupReason) {
  if (reason === 'payment_failed') return row.paymentDetail || 'Prélèvement refusé · Stripe réessaie automatiquement';
  if (reason === 'trial_ending') return row.paymentDetail || 'Essai bientôt terminé · peu d’activité';
  if (reason === 'incomplete') return 'A commencé l’inscription · s’est arrêtée avant la carte';
  if (reason === 'inactive') return `Payée · dernière activité : ${row.lastActivity}`;
  return row.paymentDetail || 'Abonnement résilié récemment';
}

function offerLabel(id: string | null | undefined) {
  if (!id) return '—';
  return OFFER_LABEL[id] ?? id;
}

function paymentDot(badge: MemberPaymentBadge) {
  if (badge === 'paid') return '#3d7a4a';
  if (badge === 'trial') return '#e6a285';
  if (badge === 'payment_failed') return '#c45d3e';
  return '#b9b2aa';
}

const DEMO: FollowupClient[] = [
  { id: 'd1', firstName: 'Camille', lastName: 'Rousseau', email: 'camille@exemple.fr', phone: '+33601020304', createdAt: '2026-09-01', lastActivity: '12 oct.', lastActivityTs: 1, health: 'red', paymentBadge: 'payment_failed', paymentDetail: 'Prélèvement de 39 € refusé le 18 oct.', lastCheckout: 'v-coll' },
  { id: 'd2', firstName: 'Inès', lastName: 'Bernard', email: 'ines@exemple.fr', phone: '+33611121314', createdAt: '2026-10-14', lastActivity: 'Aucune activité', lastActivityTs: 0, health: 'new', paymentBadge: 'trial', paymentDetail: 'Essai jusqu’au 21 oct.', lastCheckout: 'v-coll', endsAtTs: Date.now() + 2 * 86400000 },
  { id: 'd3', firstName: 'Julie', lastName: 'Martin', email: 'julie@exemple.fr', phone: '+33622232425', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), lastActivity: 'Aucune activité', lastActivityTs: 0, health: 'incomplete', paymentBadge: 'incomplete', paymentDetail: null, lastCheckout: 'v-coll' },
  { id: 'd4', firstName: 'Léa', lastName: 'Dupont', email: 'lea@exemple.fr', createdAt: '2026-08-02', lastActivity: '1 oct.', lastActivityTs: 1, health: 'orange', paymentBadge: 'paid', paymentDetail: null, lastCheckout: 'v-coll' },
  { id: 'd5', firstName: 'Nora', lastName: 'Petit', email: 'nora@exemple.fr', createdAt: new Date(Date.now() - 10 * 86400000).toISOString(), lastActivity: '8 oct.', lastActivityTs: 1, health: 'watch', paymentBadge: 'canceled', paymentDetail: 'Accès jusqu’au 31 oct.', lastCheckout: 'v-ind', endsAtTs: Date.now() - 5 * 86400000 },
];

export function AdminClientsFollowup({
  clients,
  preview = false,
  archivedHref = '/admin/clients?archived=1',
}: {
  clients?: FollowupClient[];
  preview?: boolean;
  archivedHref?: string;
}) {
  const rows = clients ?? (preview ? DEMO : []);
  const followupsEnabled = false;
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const now = Date.now();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (!needle) return true;
      return [row.firstName, row.lastName, row.email, row.phone, displayName(row)].some((v) => (v ?? '').toLowerCase().includes(needle));
    });
  }, [rows, q]);

  const followups = filtered
    .map((row) => ({ row, reason: classify(row, now) }))
    .filter((x): x is { row: FollowupClient; reason: FollowupReason } => Boolean(x.reason))
    .sort((a, b) => {
      const order: FollowupReason[] = ['payment_failed', 'trial_ending', 'incomplete', 'inactive', 'cancelled'];
      return order.indexOf(a.reason) - order.indexOf(b.reason);
    });

  const newcomers = filtered.filter((row) => row.createdAt && now - new Date(row.createdAt).getTime() <= 30 * 86400000);
  const actives = filtered.filter((row) => row.paymentBadge === 'paid' || row.paymentBadge === 'trial');
  const trials = filtered.filter((row) => row.paymentBadge === 'trial');
  const incomplete = filtered.filter((row) => row.paymentBadge === 'incomplete' || row.paymentBadge === 'none' || row.paymentBadge === 'incomplete_expired');
  const former = filtered.filter((row) => row.paymentBadge === 'canceled');
  const canceled30 = former.filter((row) => (row.endsAtTs && now - row.endsAtTs <= 30 * 86400000) || (row.createdAt && now - new Date(row.createdAt).getTime() <= 30 * 86400000));

  const tableRows =
    tab === 'active' ? actives : tab === 'trial' ? trials : tab === 'incomplete' ? incomplete : tab === 'former' ? former : filtered;

  return (
    <div className="mx-auto max-w-[1240px] space-y-6 pb-16 pt-8 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="fm-kicker">Admin · Clientes</p>
          <h1 className="hero-signature-title mt-2 text-[2.4rem] text-luxury-ink md:text-[3rem]">Suivi des clientes</h1>
          <p className="hero-signature-subtitle mt-2 text-[14px]">Qui accueillir, qui relancer, qui va bien. Lives pas encore comptés.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-soft" size={15} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-64 rounded-2xl border border-[#D9C9B4] bg-white py-2.5 pl-10 pr-4 text-sm"
              placeholder="Nom, email ou téléphone"
            />
          </div>
          <Link href={archivedHref} className="text-[13px] font-medium text-luxury-orange">
            Voir archivées
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={<Users size={16} />} label="Abonnées actives" value={actives.length} hint={`${filtered.filter((r) => r.paymentBadge === 'paid').length} payées · ${trials.length} en essai`} tone="green" />
        <Kpi icon={<UserPlus size={16} />} label="Nouvelles · 30 jours" value={newcomers.length} hint={`${newcomers.filter((r) => r.paymentBadge === 'trial' || r.paymentBadge === 'paid').length} ont démarré`} tone="orange" />
        <Kpi icon={<BellRing size={16} />} label="À relancer" value={followups.length} hint={`dont ${followups.filter((f) => f.reason === 'payment_failed').length} paiement échoué`} tone="orange" />
        <Kpi icon={<LogOut size={16} />} label="Résiliées · 30 jours" value={canceled30.length} hint="hors archivées" tone="amber" />
      </section>

      <section className="glass-card admin-form-refined overflow-hidden">
        <div className="px-6 pb-3 pt-5">
          <h2 className="text-[18px] font-semibold tracking-tight text-luxury-ink">
            À relancer <span className="text-luxury-soft">· {followups.length}</span>
          </h2>
          <p className="mt-0.5 text-[12.5px] text-luxury-muted">Classées par urgence. La plateforme n’envoie rien toute seule.</p>
        </div>
        {followups.map(({ row, reason }) => {
          const wa = waHref(row.phone, A_VALIDER_LOT5.followupWa[reason].fr);
          const mail = row.email
            ? `mailto:${row.email}?subject=${encodeURIComponent(A_VALIDER_LOT5.followupMailSubject.fr)}&body=${encodeURIComponent(A_VALIDER_LOT5.followupWa[reason].fr)}`
            : null;
          return (
            <div key={row.id} className="grid grid-cols-1 items-center gap-4 border-t border-black/[0.05] px-6 py-3.5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1.6fr)_minmax(0,0.95fr)_auto]">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6ddd3] text-[13px] font-semibold text-[#a5452a]">{initial(row)}</span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-luxury-ink">{displayName(row)}</p>
                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#fbf1ec] px-2.5 py-1 text-[11.5px] font-medium text-[#a5452a]">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: REASON_DOT[reason] }} />
                    {REASON_LABEL[reason]}
                  </span>
                </div>
              </div>
              <p className="text-[12.5px] leading-snug text-luxury-muted">{contextLine(row, reason)}</p>
              {followupsEnabled ? <p className="text-[12px] text-luxury-soft">Jamais relancée</p> : <p className="text-[12px] text-luxury-soft" />}
              <div className="flex flex-wrap items-center gap-1.5">
                {wa ? (
                  <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-[#D9C9B4] bg-white px-3 py-1.5 text-[12px] font-medium text-luxury-ink">
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                ) : null}
                {mail ? (
                  <a href={mail} className="inline-flex items-center gap-1.5 rounded-full border border-[#D9C9B4] bg-white px-3 py-1.5 text-[12px] font-medium text-luxury-ink">
                    <Mail size={14} /> Email
                  </a>
                ) : null}
                {followupsEnabled ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2b2622] px-3 py-1.5 text-[12px] font-medium text-white">
                    <Check size={13} /> Relancée
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
        {followups.length === 0 ? <p className="border-t border-black/[0.05] px-6 py-6 text-sm text-luxury-muted">Personne à relancer pour le moment.</p> : null}
      </section>

      <section className="glass-card admin-form-refined overflow-hidden">
        <div className="px-6 pb-3 pt-5">
          <h2 className="text-[18px] font-semibold tracking-tight text-luxury-ink">
            Nouvelles clientes · 30 jours <span className="text-luxury-soft">· {newcomers.length}</span>
          </h2>
        </div>
        {newcomers.map((row) => (
          <div key={row.id} className="grid grid-cols-1 items-center gap-3 border-t border-black/[0.05] px-6 py-3.5 md:grid-cols-[1.2fr_0.8fr_1.4fr]">
            <p className="text-[14px] font-medium text-luxury-ink">{displayName(row)}</p>
            <p className="text-[12.5px] text-luxury-muted">{row.createdAt ? new Date(row.createdAt).toLocaleDateString('fr-FR') : '—'} · {offerLabel(row.lastCheckout)}</p>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="rounded-full bg-black/[0.04] px-2 py-1">Compte</span>
              <span className="text-luxury-soft">→</span>
              <span className={`rounded-full px-2 py-1 ${row.paymentBadge === 'trial' || row.paymentBadge === 'paid' ? 'bg-[#fdf2ec] text-[#B0583A]' : 'bg-black/[0.04]'}`}>Essai</span>
              <span className="text-luxury-soft">→</span>
              <span className={`rounded-full px-2 py-1 ${row.paymentBadge === 'paid' ? 'bg-[#eef6ef] text-[#3d7a4a]' : 'bg-black/[0.04]'}`}>Payée</span>
            </div>
          </div>
        ))}
        {newcomers.length === 0 ? <p className="border-t border-black/[0.05] px-6 py-6 text-sm text-luxury-muted">Aucune nouvelle cliente sur 30 jours.</p> : null}
      </section>

      <section className="glass-card admin-form-refined overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 px-6 pb-3 pt-5">
          <h2 className="text-[18px] font-semibold tracking-tight text-luxury-ink">Toutes les clientes</h2>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ['all', 'Toutes'],
                ['active', 'Actives'],
                ['trial', 'En essai'],
                ['incomplete', 'Non finalisées'],
                ['former', 'Anciennes'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${tab === id ? 'bg-[#2b2622] text-white' : 'bg-white text-luxury-muted'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-white/90">
              <tr className="text-[11px] uppercase tracking-[0.12em] text-luxury-soft">
                <th className="px-6 py-3">Cliente</th>
                <th className="px-3 py-3">Abonnement</th>
                <th className="px-3 py-3">Depuis</th>
                <th className="px-3 py-3">Assiduité</th>
                <th className="px-3 py-3">Dernière activité</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.id} className="border-t border-black/[0.05]">
                  <td className="px-6 py-3">
                    <Link href={preview ? '#' : `/admin/clients/${row.id}`} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f6ddd3] text-[12px] font-semibold text-[#a5452a]">{initial(row)}</span>
                      <span className="font-medium text-luxury-ink">{displayName(row)}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-2.5 py-1 text-[11.5px] font-medium">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: paymentDot(row.paymentBadge) }} />
                      {MEMBER_PAYMENT_LABELS[row.paymentBadge]}
                    </span>
                    {row.paymentDetail ? <p className="mt-1 text-[11px] text-luxury-muted">{row.paymentDetail}</p> : null}
                  </td>
                  <td className="px-3 py-3 text-luxury-muted">{row.createdAt ? new Date(row.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-3 py-3 text-luxury-muted">{MEMBER_HEALTH_LABELS[row.health]}</td>
                  <td className="px-3 py-3 text-luxury-muted">{row.lastActivity}</td>
                  <td className="px-6 py-3 text-right text-luxury-orange">{preview ? '→' : <Link href={`/admin/clients/${row.id}`}>→</Link>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  hint: string;
  tone: 'green' | 'orange' | 'amber';
}) {
  const wrap = tone === 'green' ? 'kpi-icon-wrap--green' : tone === 'amber' ? 'kpi-icon-wrap--amber' : 'kpi-icon-wrap--orange';
  return (
    <div className="glass-card glass-card--kpi admin-form-refined p-5">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-luxury-soft">{label}</p>
        <span className={`kpi-icon-wrap ${wrap} !h-9 !w-9`}>{icon}</span>
      </div>
      <p className="mt-2 text-[28px] font-semibold tabular-nums text-luxury-ink">{value}</p>
      <p className="text-[12px] text-luxury-muted">{hint}</p>
    </div>
  );
}
