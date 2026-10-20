'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Copy, CreditCard, Download, Ellipsis, Gift, Heart, Mail, Plus, RotateCcw, Search, Send, Sparkles, TriangleAlert, X } from 'lucide-react';

import { createManualGiftAction, refundGiftAction, resendGiftEmailAction } from '@/app/admin/cartes-cadeaux/actions';
import type { AdminGiftDisplay, AdminGiftRow, AdminGiftStats } from '@/lib/gifts/admin-data';

type Filter = 'all' | 'scheduled' | 'sent' | 'active' | 'expired';

const euros = (cents: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

function StatusPill({ d }: { d: AdminGiftDisplay }) {
  const map: Record<AdminGiftDisplay, { cls: string; icon: React.ReactNode; label: string }> = {
    scheduled: { cls: 'bg-[#fff4e5] text-[#8a5a1f]', icon: <Clock size={12} />, label: 'Envoi programmé' },
    paid: { cls: 'bg-black/[0.05] text-luxury-muted', icon: <CreditCard size={12} />, label: 'Payée' },
    sent: { cls: 'bg-black/[0.05] text-luxury-muted', icon: <Send size={12} />, label: 'Envoyée' },
    active: { cls: 'bg-success-50 text-success', icon: <Sparkles size={12} />, label: 'Activée' },
    converted: { cls: 'bg-terracotta-50 text-luxury-orange', icon: <Heart size={12} />, label: 'Devenue abonnée' },
    refunded: { cls: 'bg-black/[0.05] text-luxury-soft', icon: <RotateCcw size={12} />, label: 'Remboursée' },
    expired: { cls: 'bg-black/[0.05] text-luxury-soft', icon: <Clock size={12} />, label: 'Expirée' },
  };
  const m = map[d];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${m.cls}`}>{m.icon}{m.label}</span>;
}

function Kpi({ label, value, hint, icon, tone }: { label: string; value: string; hint: string; icon: React.ReactNode; tone: string }) {
  return (
    <div className="glass-card glass-card--kpi admin-form-refined p-5">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-luxury-soft">{label}</p>
        <span className={`kpi-icon-wrap kpi-icon-wrap--${tone} !h-9 !w-9`}>{icon}</span>
      </div>
      <p className="mt-2 text-[28px] font-semibold tabular-nums text-luxury-ink">{value}</p>
      <p className="text-[12px] text-luxury-muted">{hint}</p>
    </div>
  );
}

function ManualModal({ onClose, preview }: { onClose: () => void; preview: boolean }) {
  const router = useRouter();
  const [months, setMonths] = useState<1 | 3 | 6 | 12>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [locale, setLocale] = useState<'fr' | 'es'>('fr');
  const [pending, start] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/25 p-4 md:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Créer une carte manuelle" className="w-full max-w-md rounded-[1.6rem] bg-white p-6 shadow-[0_30px_70px_-10px_rgba(29,26,23,0.4)]">
        <div className="flex items-center justify-between">
          <p className="text-[16px] font-semibold text-luxury-ink">Créer une carte manuelle</p>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-luxury-soft hover:text-luxury-ink">
            <X size={18} />
          </button>
        </div>
        <p className="mt-1 text-[13px] text-luxury-muted">Offerte par FitMangas (0 €). Avec un email, elle part tout de suite ; sans email, télécharge le PDF.</p>
        {result ? (
          <div className="mt-5 space-y-4">
            <p className="rounded-xl bg-success-50 px-4 py-3 text-[14px] text-success">
              Carte créée : <b className="font-mono tracking-[0.08em]">{result}</b>
            </p>
            <button type="button" className="btn-luxury-primary w-full" onClick={onClose}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4 flex gap-2">
              {([1, 3, 6, 12] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(m)}
                  className={`flex-1 rounded-2xl px-3 py-2.5 text-[13px] font-semibold ${months === m ? 'bg-luxury-ink text-white' : 'border border-black/10 bg-white text-luxury-ink'}`}
                >
                  {m} mois
                </button>
              ))}
            </div>
            <label className="mt-4 block text-[12px] font-medium text-luxury-muted">
              Prénom de la destinataire
              <input className="fm-input mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="mt-3 block text-[12px] font-medium text-luxury-muted">
              Son email (facultatif)
              <input className="fm-input mt-1.5" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="mt-3 block text-[12px] font-medium text-luxury-muted">
              Message (facultatif)
              <textarea className="fm-input mt-1.5 min-h-[72px]" maxLength={250} value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
            <div className="mt-3 flex gap-2 text-[12px]">
              {(['fr', 'es'] as const).map((l) => (
                <button key={l} type="button" onClick={() => setLocale(l)} className={`rounded-full px-3 py-1.5 font-semibold ${locale === l ? 'bg-luxury-ink text-white' : 'bg-black/[0.05] text-luxury-muted'}`}>
                  {l === 'fr' ? 'Français' : 'Español'}
                </button>
              ))}
            </div>
            {err ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-800">{err}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-luxury-ghost !px-4 !py-2.5" onClick={onClose}>
                Annuler
              </button>
              <button
                type="button"
                disabled={pending || !name.trim()}
                className="btn-luxury-primary !px-4 !py-2.5"
                onClick={() =>
                  start(async () => {
                    setErr(null);
                    if (preview) {
                      setResult('FM-DEMO-0000');
                      return;
                    }
                    const res = await createManualGiftAction({ months, recipientName: name, recipientEmail: email || undefined, message: message || undefined, locale });
                    if (res.ok) {
                      setResult(res.code ?? '');
                      router.refresh();
                    } else setErr(res.message);
                  })
                }
              >
                <Gift size={14} />
                Créer la carte
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RefundModal({ row, onClose, preview }: { row: AdminGiftRow; onClose: () => void; preview: boolean }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const q = row.refund;
  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/25 p-4 md:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Rembourser la carte" className="w-full max-w-md rounded-[1.6rem] bg-white p-6 shadow-[0_30px_70px_-10px_rgba(29,26,23,0.4)]">
        <div className="flex items-center justify-between">
          <p className="text-[16px] font-semibold text-luxury-ink">Rembourser {row.code}</p>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-luxury-soft hover:text-luxury-ink">
            <X size={18} />
          </button>
        </div>
        {q ? (
          <div className="mt-4 space-y-3 text-[14px] text-luxury-ink">
            <p>
              Montant remboursé : <b className="tabular-nums">{euros(q.amountCents)}</b> sur {euros(row.amountCents)}
            </p>
            <p className="text-[13px] text-luxury-muted">
              {q.full
                ? 'Carte non utilisée : remboursement intégral.'
                : `Carte activée : ${q.usedDays} jour${q.usedDays > 1 ? 's' : ''} utilisés sur ${q.totalDays}, remboursement au prorata. L’accès offert est retiré pour la part remboursée.`}
            </p>
            {q.late ? (
              <p className="flex items-start gap-2 rounded-xl bg-[#fff4e5] px-3 py-2 text-[13px] text-[#8a5a1f]">
                <TriangleAlert size={15} className="mt-0.5 shrink-0" />
                Achat il y a plus de 14 jours : hors délai de rétractation (geste commercial).
              </p>
            ) : null}
            <label className="flex items-start gap-3 text-[13px] text-luxury-muted">
              <input type="checkbox" className="mt-0.5 h-4 w-4" checked={ok} onChange={(e) => setOk(e.target.checked)} />
              Je confirme le remboursement : il est définitif.
            </label>
            {err ? <p className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-800">{err}</p> : null}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className="btn-luxury-ghost !px-4 !py-2.5" onClick={onClose}>
                Annuler
              </button>
              <button
                type="button"
                disabled={!ok || pending}
                className="btn-luxury-primary !px-4 !py-2.5"
                onClick={() =>
                  start(async () => {
                    setErr(null);
                    if (preview) return onClose();
                    const res = await refundGiftAction(row.id, ok);
                    if (res.ok && res.warning) {
                      // Argent rendu, mais l'avantage n'a pas pu être retiré dans Stripe : on le dit, on ne ferme pas.
                      setErr(res.warning);
                      router.refresh();
                    } else if (res.ok) {
                      onClose();
                      router.refresh();
                    } else setErr(res.message);
                  })
                }
              >
                <RotateCcw size={14} />
                Rembourser
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-[14px] text-luxury-muted">Rien à rembourser pour cette carte.</p>
        )}
      </div>
    </div>
  );
}

export function AdminGiftsManager({ rows, stats, tablesMissing, preview = false }: { rows: AdminGiftRow[]; stats: AdminGiftStats; tablesMissing?: boolean; preview?: boolean }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [manual, setManual] = useState(false);
  const [refund, setRefund] = useState<AdminGiftRow | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const counts = {
    all: rows.length,
    scheduled: rows.filter((r) => r.display === 'scheduled').length,
    sent: rows.filter((r) => r.display === 'sent' || r.display === 'paid').length,
    active: rows.filter((r) => r.display === 'active' || r.display === 'converted').length,
    expired: rows.filter((r) => r.display === 'expired').length,
  };
  const list = useMemo(
    () =>
      rows.filter((r) => {
        if (filter === 'scheduled' && r.display !== 'scheduled') return false;
        if (filter === 'sent' && !(r.display === 'sent' || r.display === 'paid')) return false;
        if (filter === 'active' && !(r.display === 'active' || r.display === 'converted')) return false;
        if (filter === 'expired' && r.display !== 'expired') return false;
        if (q) {
          const hay = `${r.code} ${r.buyerName} ${r.buyerEmail} ${r.recipientName} ${r.recipientEmail ?? ''}`.toLowerCase();
          if (!hay.includes(q.toLowerCase().trim())) return false;
        }
        return true;
      }),
    [rows, filter, q],
  );
  const activationRate = stats.delivered ? Math.round((stats.activated / stats.delivered) * 100) : null;
  const tab = (on: boolean) => `rounded-full px-3 py-1.5 ${on ? 'bg-[#C9A96E]/35 text-[#2D2D2D] shadow-sm ring-1 ring-[#C9A96E]/50' : 'text-luxury-muted hover:text-luxury-ink'}`;
  const grid = 'grid grid-cols-[1.1fr_1.3fr_1.3fr_0.7fr_0.7fr_1.2fr_1.2fr_auto] items-center gap-3';

  return (
    <div className="mx-auto max-w-[1240px] space-y-6 pb-16 pt-8 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="fm-kicker">Admin · Cartes cadeaux</p>
          <h1 className="hero-signature-title mt-2 text-[3rem] text-luxury-ink">Cartes cadeaux</h1>
          <p className="hero-signature-subtitle mt-2 text-[14px]">Ventes, envois, activations et conversion en abonnement.</p>
        </div>
        <button type="button" className="btn-luxury-primary" onClick={() => setManual(true)} disabled={tablesMissing}>
          <Plus size={14} strokeWidth={2.4} />
          Créer une carte manuelle
        </button>
      </header>
      {tablesMissing ? (
        <p className="rounded-2xl border border-[#E8DCCB] bg-white/80 px-4 py-3 text-sm text-luxury-muted">Table des cartes non créée (migration du lot 4 en attente de GO).</p>
      ) : null}
      {notice ? (
        <p className="flex items-center justify-between gap-3 rounded-2xl bg-success-50 px-4 py-3 text-[13px] text-success">
          {notice}
          <button type="button" onClick={() => setNotice(null)} aria-label="Fermer">
            <X size={15} />
          </button>
        </p>
      ) : null}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Vendues ce mois"
          value={String(stats.soldThisMonth)}
          hint={`${stats.soldThisMonth - stats.soldPrevMonth >= 0 ? '+' : ''}${stats.soldThisMonth - stats.soldPrevMonth} vs ${stats.prevMonthLabel}`}
          icon={<Gift size={16} />}
          tone="orange"
        />
        <Kpi label="Chiffre d’affaires" value={euros(stats.revenueCents)} hint={stats.monthLabel} icon={<CreditCard size={16} />} tone="green" />
        <Kpi
          label="Taux d’activation"
          value={activationRate != null ? `${activationRate} %` : '—'}
          hint={activationRate != null ? `${stats.activated} sur ${stats.delivered}` : 'aucune carte reçue'}
          icon={<Sparkles size={16} />}
          tone="amber"
        />
        <Kpi label="Devenues abonnées" value={String(stats.converted)} hint="après la fin du cadeau" icon={<Heart size={16} />} tone="rose" />
      </section>

      <section className="glass-card admin-form-refined overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-4 pt-5">
          <div className="flex flex-wrap gap-1.5 rounded-full bg-black/[0.04] p-1 text-[12px] font-medium">
            <button type="button" className={tab(filter === 'all')} onClick={() => setFilter('all')}>
              Toutes · {counts.all}
            </button>
            <button type="button" className={tab(filter === 'scheduled')} onClick={() => setFilter('scheduled')}>
              À envoyer · {counts.scheduled}
            </button>
            <button type="button" className={tab(filter === 'sent')} onClick={() => setFilter('sent')}>
              Envoyées · {counts.sent}
            </button>
            <button type="button" className={tab(filter === 'active')} onClick={() => setFilter('active')}>
              Activées · {counts.active}
            </button>
            <button type="button" className={tab(filter === 'expired')} onClick={() => setFilter('expired')}>
              Expirées{counts.expired ? ` · ${counts.expired}` : ''}
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-soft" size={15} aria-hidden />
            <input className="w-64 rounded-2xl border border-[#D9C9B4] bg-white py-2.5 pl-10 pr-4 text-sm" placeholder="Code, nom ou email" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className={`admin-calendar-surface ${grid} px-6 py-3 text-[10px] uppercase tracking-wider text-white/85`}>
              <span>Code</span>
              <span>Offerte par</span>
              <span>Pour</span>
              <span>Durée</span>
              <span>Montant</span>
              <span>Statut</span>
              <span>Date</span>
              <span />
            </div>
            {list.map((r) => (
              <div key={r.id} className={`${grid} border-b border-black/[0.05] px-6 py-3.5 text-[13px] last:border-0`}>
                <span className="font-mono text-[12px] tracking-[0.08em] text-luxury-ink">{r.code}</span>
                <span className="truncate text-luxury-ink" title={r.buyerEmail}>
                  {r.manual ? 'FitMangas' : r.buyerName}
                </span>
                <span className="truncate text-luxury-ink" title={r.recipientEmail ?? ''}>
                  {r.recipientName}
                  {r.print ? ' (PDF)' : ''}
                </span>
                <span className="text-luxury-muted">{r.months} mois</span>
                <span className="tabular-nums text-luxury-ink">{r.manual ? 'offerte' : euros(r.amountCents)}</span>
                <span>
                  <StatusPill d={r.display} />
                </span>
                <span className="text-[12px] text-luxury-muted">{r.dateLabel}</span>
                <span className="relative flex items-center gap-1 text-luxury-muted">
                  <a
                    href={preview ? '/api/gifts/pdf/apercu' : `/api/gifts/pdf/${r.id}`}
                    target="_blank"
                    rel="noopener"
                    title="Télécharger le PDF"
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/[0.04]"
                  >
                    <Download size={15} />
                  </a>
                  <button
                    type="button"
                    title={r.canResend ? 'Renvoyer l’email à la destinataire' : 'Pas d’email à renvoyer'}
                    disabled={!r.canResend || pending}
                    onClick={() =>
                      start(async () => {
                        if (preview) return setNotice('Aperçu : email non envoyé.');
                        const res = await resendGiftEmailAction(r.id);
                        setNotice(res.ok ? `Email renvoyé à ${r.recipientEmail}.` : res.message);
                      })
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/[0.04] disabled:opacity-30"
                  >
                    <Mail size={15} />
                  </button>
                  <button
                    type="button"
                    title="Plus"
                    onClick={() => setMenu(menu === r.id ? null : r.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/[0.04]"
                  >
                    <Ellipsis size={15} />
                  </button>
                  {menu === r.id ? (
                    <span className="absolute right-0 top-9 z-20 w-56 rounded-2xl border border-black/[0.06] bg-white p-1.5 text-[13px] shadow-[0_18px_40px_-12px_rgba(29,26,23,0.35)]">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-luxury-ink hover:bg-black/[0.04]"
                        onClick={() => {
                          void navigator.clipboard?.writeText(r.code);
                          setMenu(null);
                          setNotice(`Code ${r.code} copié.`);
                        }}
                      >
                        <Copy size={14} /> Copier le code
                      </button>
                      <button
                        type="button"
                        disabled={!r.refundable || !r.refund}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-luxury-ink hover:bg-black/[0.04] disabled:opacity-35"
                        onClick={() => {
                          setMenu(null);
                          setRefund(r);
                        }}
                      >
                        <RotateCcw size={14} /> Rembourser
                        {r.refund ? <span className="ml-auto text-[12px] text-luxury-muted">{euros(r.refund.amountCents)}</span> : null}
                      </button>
                    </span>
                  ) : null}
                </span>
              </div>
            ))}
            {!list.length ? <p className="px-6 py-10 text-center text-[14px] text-luxury-muted">Aucune carte pour ce filtre.</p> : null}
          </div>
        </div>
      </section>
      <p className="px-1 text-[12px] text-luxury-muted">
        Rembourser : intégral si la carte n’est pas activée, au prorata des jours non utilisés sinon (14 jours de rétractation après l’achat). Prix lus dans Stripe.
      </p>

      {manual ? <ManualModal preview={preview} onClose={() => setManual(false)} /> : null}
      {refund ? <RefundModal row={refund} preview={preview} onClose={() => setRefund(null)} /> : null}
    </div>
  );
}
