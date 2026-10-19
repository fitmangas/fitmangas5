'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronDown, CreditCard, Lock, Mail, ShieldCheck } from 'lucide-react';

import { GiftCardVisual } from './GiftCardVisual';
import {
  TIME_SHORTCUTS,
  formatSendRecap,
  halfHourSlots,
  type GiftTimezone,
} from '@/lib/gifts/send-at';
import { formatEurFromCents, type GiftPrice } from '@/lib/gifts/prices';

export function OffrirClient({
  prices,
  emailDeliveryOn,
  preview,
}: {
  prices: GiftPrice[];
  emailDeliveryOn: boolean;
  preview?: boolean;
}) {
  const [months, setMonths] = useState(3);
  const [from, setFrom] = useState(preview ? 'Sandrine' : '');
  const [to, setTo] = useState(preview ? 'Julie' : '');
  const [message, setMessage] = useState(preview ? 'Joyeux anniversaire ! 3 mois pour prendre soin de toi, à ton rythme. Je t’embrasse.' : '');
  const [delivery, setDelivery] = useState<'email' | 'print'>(emailDeliveryOn ? 'email' : 'print');
  const [recipientEmail, setRecipientEmail] = useState(preview ? 'julie.m@exemple.fr' : '');
  const [buyerEmail, setBuyerEmail] = useState(preview ? 'sandrine@exemple.fr' : '');
  const [date, setDate] = useState('2026-10-24');
  const [time, setTime] = useState('14:00');
  const [tz, setTz] = useState<GiftTimezone>('Europe/Paris');
  const [immediate, setImmediate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = prices.find((p) => p.months === months) ?? prices[1];
  const slots = useMemo(() => halfHourSlots(), []);
  const recap = formatSendRecap(date, time);

  async function pay() {
    if (preview) return;
    if (!immediate) {
      setError('Coche la case d’accès immédiat pour continuer.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/gifts/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          months,
          from,
          to,
          message,
          delivery,
          recipientEmail,
          buyerEmail,
          date,
          time,
          timezone: tz,
          immediate,
        }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error || 'Paiement indisponible pour le moment.');
        setBusy(false);
        return;
      }
      window.location.href = json.url;
    } catch {
      setError('Paiement indisponible pour le moment.');
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-beige text-brand-ink">
      <main className="mx-auto max-w-6xl px-5 pb-10 md:px-8">
        <section className="grid items-center gap-10 pb-12 pt-10 md:grid-cols-[1fr_1fr] md:gap-14 md:pb-16 md:pt-16">
          <div>
            <p className="fm-kicker fm-kicker--orange">Carte cadeau · de 1 à 12 mois</p>
            <h1 className="fm-display mt-4 text-[2.6rem] leading-[1.04] text-brand-ink md:text-[3.9rem]">Offre-lui une coach qui la voit vraiment.</h1>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-brand-ink/65 md:text-[18px]">
              Des lives de Pilates et de Barre avec Alejandra, qui la corrige en direct, des programmes guidés et plus de 50 h de vidéos. Elle choisit son rythme, depuis son salon.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] font-medium text-brand-ink/70">
              <span className="inline-flex items-center gap-2">
                <CreditCard className="text-luxury-orange" size={16} /> Paiement unique, sans abonnement
              </span>
              <span className="inline-flex items-center gap-2">
                <Mail className="text-luxury-orange" size={16} /> Envoyée le jour que tu choisis
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="text-luxury-orange" size={16} /> Sans carte bancaire pour elle
              </span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="relative rotate-[-4deg]">
              <GiftCardVisual months={months} from={from} to={to} />
            </div>
          </div>
        </section>

        <div className="grid items-start gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0 space-y-10">
            <section>
              <h2 className="text-[22px] font-semibold tracking-tight text-brand-ink">
                <span className="mr-2 text-luxury-orange">1.</span>Choisis la durée
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                {prices.map((p) => {
                  const on = p.months === months;
                  return (
                    <button
                      key={p.months}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setMonths(p.months)}
                      className={`relative flex flex-col items-start rounded-[1.4rem] p-4 text-left md:p-5 ${
                        on ? 'bg-white shadow-[0_16px_36px_rgba(196,93,62,0.18)] ring-2 ring-luxury-orange' : 'border border-brand-ink/10 bg-white/70'
                      }`}
                    >
                      {p.badge ? (
                        <span className="absolute -top-2.5 left-4 rounded-full bg-[#f8f0e0] px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#8a6a2f]">
                          {p.badge}
                        </span>
                      ) : null}
                      <span className="mt-1 text-[15px] font-semibold text-brand-ink">{p.months} mois</span>
                      <span className="mt-2 text-[28px] font-semibold tracking-tight text-brand-ink">{formatEurFromCents(p.amountCents)}</span>
                      <span className="text-[12px] text-brand-ink/55">
                        {p.perMonthCents != null ? `${formatEurFromCents(p.perMonthCents)} / mois` : 'Prix lu depuis Stripe'}
                      </span>
                      {on ? <Check className="absolute right-4 top-4 text-luxury-orange" size={20} /> : null}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[12.5px] text-brand-ink/55">Accès complet : lives FR et ES, replays, programmes, vidéothèque, blog et tests.</p>
            </section>

            <section>
              <h2 className="text-[22px] font-semibold tracking-tight">
                <span className="mr-2 text-luxury-orange">2.</span>Personnalise ta carte
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="fm-label">De la part de</span>
                  <input className="fm-input" value={from} onChange={(e) => setFrom(e.target.value)} maxLength={80} />
                </label>
                <label className="block">
                  <span className="fm-label">Pour</span>
                  <input className="fm-input" value={to} onChange={(e) => setTo(e.target.value)} maxLength={80} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="fm-label">
                    Ton message <span className="font-normal text-brand-ink/45">(facultatif · 250 caractères)</span>
                  </span>
                  <textarea className="fm-input min-h-[104px] resize-none" maxLength={250} value={message} onChange={(e) => setMessage(e.target.value)} />
                </label>
              </div>
            </section>

            <section>
              <h2 className="text-[22px] font-semibold tracking-tight">
                <span className="mr-2 text-luxury-orange">3.</span>Comment l&apos;offrir&nbsp;?
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!emailDeliveryOn}
                  onClick={() => emailDeliveryOn && setDelivery('email')}
                  className={`flex items-start gap-3 rounded-2xl p-4 text-left ${
                    delivery === 'email' ? 'border-2 border-luxury-orange bg-white' : 'border border-brand-ink/10 bg-white/70'
                  } ${emailDeliveryOn ? '' : 'cursor-not-allowed opacity-50'}`}
                >
                  <span className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 ${delivery === 'email' ? 'border-luxury-orange' : 'border-brand-ink/20'}`}>
                    {delivery === 'email' ? <span className="mx-auto mt-[3px] block h-2.5 w-2.5 rounded-full bg-luxury-orange" /> : null}
                  </span>
                  <span>
                    <span className="block text-[14.5px] font-semibold">Par email, le jour J</span>
                    <span className="mt-0.5 block text-[12.5px] text-brand-ink/55">
                      {emailDeliveryOn ? 'Elle la reçoit le jour et à l’heure que tu choisis. Tu reçois une copie.' : 'Disponible dès que l’envoi automatique tourne (tâche 10 min).'}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDelivery('print')}
                  className={`flex items-start gap-3 rounded-2xl p-4 text-left ${
                    delivery === 'print' ? 'border-2 border-luxury-orange bg-white' : 'border border-brand-ink/10 bg-white/70'
                  }`}
                >
                  <span className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 ${delivery === 'print' ? 'border-luxury-orange' : 'border-brand-ink/20'}`} />
                  <span>
                    <span className="block text-[14.5px] font-semibold">Je l&apos;imprime ou je la donne</span>
                    <span className="mt-0.5 block text-[12.5px] text-brand-ink/55">Tu reçois tout de suite la carte en PDF, prête à imprimer.</span>
                  </span>
                </button>
              </div>
              {delivery === 'email' ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="fm-label">Email de {to || 'la destinataire'}</span>
                    <input className="fm-input" type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="fm-label">Date d&apos;envoi</span>
                    <span className="relative block">
                      <input className="fm-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                      <CalendarDays className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-ink/40" size={17} />
                    </span>
                  </label>
                  <label className="block">
                    <span className="fm-label">Heure d&apos;envoi</span>
                    <span className="relative block">
                      <select className="fm-input appearance-none" value={time} onChange={(e) => setTime(e.target.value)}>
                        {slots.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-ink/40" size={17} />
                    </span>
                    <span className="fm-hint block">
                      Heure de {tz === 'Europe/Paris' ? 'Paris' : 'Mexico'} ·{' '}
                      <button type="button" className="underline" onClick={() => setTz((t) => (t === 'Europe/Paris' ? 'America/Mexico_City' : 'Europe/Paris'))}>
                        changer
                      </button>
                    </span>
                  </label>
                  <div className="sm:col-span-2 -mt-1 flex flex-wrap gap-2">
                    {TIME_SHORTCUTS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setTime(s.time)}
                        className={`rounded-full px-3 py-1.5 text-[12.5px] ${time === s.time ? 'bg-luxury-ink text-white' : 'bg-white text-brand-ink/70 ring-1 ring-brand-ink/10'}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <label className="mt-4 block">
                <span className="fm-label">
                  Ton email <span className="font-normal text-brand-ink/45">(pour la facture et la copie de la carte)</span>
                </span>
                <input className="fm-input" type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
              </label>
            </section>

            <section>
              <h2 className="text-[22px] font-semibold tracking-tight">Questions fréquentes</h2>
              <div className="mt-4 divide-y divide-brand-ink/[0.07] rounded-[1.4rem] bg-white/80">
                {[
                  ['Combien de temps pour l’activer ?', '12 mois à partir de l’achat. Les mois offerts commencent le jour où elle l’active.'],
                  ['Et à la fin des mois offerts ?', 'Son accès s’arrête simplement. Rien n’est prélevé : si elle veut continuer, elle s’abonne elle-même (39 €/mois, sans engagement).'],
                  ['Elle est déjà abonnée ?', 'Pas de souci : les mois offerts sont déduits de ses prochains prélèvements.'],
                  ['Je peux être remboursée ?', 'Oui. Tu peux te rétracter dans les 14 jours suivant l’achat : remboursement intégral si la carte n’a pas été activée, au prorata des jours non utilisés sinon.'],
                ].map(([q, a]) => (
                  <details key={q} className="px-5 py-4">
                    <summary className="cursor-pointer text-[15px] font-semibold">{q}</summary>
                    <p className="mt-2 text-[14px] leading-relaxed text-brand-ink/60">{a}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_24px_60px_-20px_rgba(29,26,23,0.28)]">
              <p className="fm-kicker">Aperçu de sa carte</p>
              <div className="mt-4">
                <GiftCardVisual months={months} from={from} to={to} />
              </div>
              {message ? <p className="mt-4 rounded-2xl bg-sand px-4 py-3 text-[13px] italic leading-relaxed text-brand-ink/70">« {message} »</p> : null}
              <dl className="mt-5 space-y-2 text-[14px]">
                <div className="flex justify-between">
                  <dt className="text-brand-ink/60">Carte cadeau {months} mois</dt>
                  <dd className="font-semibold">{formatEurFromCents(selected?.amountCents ?? null)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-brand-ink/60">{delivery === 'email' ? 'Envoi par email' : 'PDF à imprimer'}</dt>
                  <dd>{delivery === 'email' ? recap : 'Immédiat'}</dd>
                </div>
                <div className="flex justify-between border-t border-brand-ink/[0.07] pt-2 text-[15px]">
                  <dt className="font-semibold">Total</dt>
                  <dd className="font-semibold">{formatEurFromCents(selected?.amountCents ?? null)}</dd>
                </div>
              </dl>
              <label className="mt-5 flex items-start gap-3 text-[12px] leading-snug text-brand-ink/65">
                <input type="checkbox" className="mt-0.5 h-5 w-5" checked={immediate} onChange={(e) => setImmediate(e.target.checked)} />
                <span>Je demande que la carte puisse être activée tout de suite. Si je me rétracte dans les 14 jours suivant l&apos;achat alors qu&apos;elle a déjà été activée, seule la part utilisée sera retenue.</span>
              </label>
              {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
              <button type="button" disabled={busy} onClick={() => void pay()} className="btn-luxury-primary mt-4 w-full !py-4">
                <Lock size={14} /> Offrir {months} mois · {formatEurFromCents(selected?.amountCents ?? null)}
              </button>
              <p className="mt-3 text-center text-[11.5px] leading-relaxed text-brand-ink/50">
                Paiement sécurisé par Stripe · TVA non applicable, art. 293 B du CGI · <a href="/terms" className="underline">CGV</a>
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

