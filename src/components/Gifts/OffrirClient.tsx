'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Check, ChevronDown, CircleCheck, CreditCard, Gift, Lock, Mail, MailOpen, ShieldCheck, Sparkles } from 'lucide-react';

import { GiftCardVisual } from './GiftCardVisual';
import { PublicSiteHeader } from '@/components/Marketing/PublicSiteHeader';
import { PublicSiteFooter } from '@/components/Marketing/PublicSiteFooter';
import {
  TIME_SHORTCUTS,
  computeSendAtUtc,
  formatSendRecap,
  guessGiftTimezone,
  halfHourSlots,
  maxSendDateYmd,
  ymdInZone,
  type GiftTimezone,
} from '@/lib/gifts/send-at';
import type { GiftPrice } from '@/lib/gifts/prices';

/**
 * C01 — achat d'une carte cadeau (/offrir) : durée → personnalisation → envoi (email le jour et à l'heure choisis, ou PDF)
 * → case d'accès immédiat (obligatoire, non cochée) → Stripe Checkout. Montants lus dans Stripe (page serveur).
 */

type Lang = 'fr' | 'es';

export type PurchasedGift = {
  months: number;
  from: string;
  to: string;
  delivery: 'email' | 'print';
  /** Date et heure d'envoi déjà mises en forme dans le fuseau de l'acheteuse (« sam. 24 oct. à 14:00 »), ou null si immédiat. */
  sendLabel: { fr: string; es: string } | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NB = ' ';

const money = (cents: number | null, lang: Lang, short = false) => {
  if (cents == null) return '—';
  return new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: short && cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
};

const monthsLabel = (m: number, lang: Lang) => (lang === 'es' ? `${m} ${m > 1 ? 'meses' : 'mes'}` : `${m} mois`);

function longDate(ymd: string, lang: Lang): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return '';
  const s = new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d, 12)),
  );
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const COPY = {
  fr: {
    kicker: 'Carte cadeau · de 1 à 12 mois',
    title: 'Offre-lui une coach qui la voit vraiment.',
    intro: (programmes: boolean, hours: number | null) =>
      `Des lives de Pilates et de Barre avec Alejandra, qui la corrige en direct${programmes ? ', des programmes guidés' : ''}${
        hours ? ` et plus de ${hours}${NB}h de vidéos` : ' et les replays de chaque live'
      }. Elle choisit son rythme, depuis son salon.`,
    pillPay: 'Paiement unique, sans abonnement',
    pillDay: 'Envoyée le jour que tu choisis',
    pillPdf: 'Carte en PDF, prête à offrir',
    pillNoCard: 'Sans carte bancaire pour elle',
    welcome: (
      <>
        <b className="font-semibold text-brand-ink">Alejandra</b> l’accueille
        <br />
        dès son premier live
      </>
    ),
    step1: 'Choisis la durée',
    perMonth: '/ mois',
    free: (n: number) => `${n} mois offert${n > 1 ? 's' : ''}`,
    access: (programmes: boolean) =>
      `Accès complet${NB}: lives FR et ES, replays${programmes ? ', programmes' : ''}, vidéothèque, blog et tests.`,
    step2: 'Personnalise ta carte',
    from: 'De la part de',
    to: 'Pour',
    message: 'Ton message',
    messageHint: '(facultatif · 250 caractères)',
    step3: `Comment l’offrir${NB}?`,
    byEmail: 'Par email, le jour J',
    byEmailSub: (to: string) => `${to || 'Elle'} la reçoit le jour et à l’heure que tu choisis. Tu reçois une copie.`,
    byEmailOff: `Bientôt disponible${NB}: pour l’instant, choisis la carte à imprimer.`,
    print: 'Je l’imprime ou je la donne',
    printSub: 'Tu reçois tout de suite la carte en PDF, prête à imprimer.',
    recipientEmail: (to: string) => `Email de ${to || 'la destinataire'}`,
    date: 'Date d’envoi',
    datePick: 'Choisis une date',
    time: 'Heure d’envoi',
    tzParis: 'Heure de Paris',
    tzMexico: 'Heure de Mexico',
    change: 'changer',
    buyerEmail: 'Ton email',
    buyerEmailHint: '(pour la facture et la copie de la carte)',
    how: [
      ['Tu offres', 'Paiement unique sécurisé par Stripe. Aucun abonnement de ton côté.'],
      ['Elle reçoit', 'Sa carte, ton message et son code, par email ou en main propre.'],
      ['Elle active', 'En 1 minute, sans carte bancaire. À la fin, elle choisit de continuer… ou pas.'],
    ] as const,
    faqTitle: 'Questions fréquentes',
    faq: (price: string) =>
      [
        [`Combien de temps pour l’activer${NB}?`, '12 mois à partir de l’achat. Les mois offerts commencent le jour où elle l’active.'],
        [
          `Et à la fin des mois offerts${NB}?`,
          `Son accès s’arrête simplement. Rien n’est prélevé${NB}: si elle veut continuer, elle s’abonne elle-même (${price}/mois, sans engagement).`,
        ],
        [`Elle est déjà abonnée${NB}?`, `Pas de souci${NB}: les mois offerts sont déduits de ses prochains prélèvements (ou prolongent son essai en cours).`],
        [
          `Je peux être remboursée${NB}?`,
          `Oui. Tu peux te rétracter dans les 14 jours suivant l’achat${NB}: remboursement intégral si la carte n’a pas été activée, au prorata des jours non utilisés sinon.`,
        ],
      ] as const,
    preview: 'Aperçu de sa carte',
    line: (m: number) => `Carte cadeau ${m} mois`,
    sendEmail: 'Envoi par email',
    sendPrint: 'PDF à imprimer',
    now: 'Immédiat',
    asap: 'Dès le paiement',
    total: 'Total',
    consent: 'Je demande que la carte puisse être activée tout de suite. Si je me rétracte dans les 14 jours suivant l’achat alors qu’elle a déjà été activée, seule la part utilisée sera retenue.',
    cta: (m: number, p: string) => `Offrir ${m} mois · ${p}`,
    legal: (
      <>
        Paiement sécurisé par Stripe · TVA non applicable, art. 293 B du CGI ·{' '}
        <a href="/terms" className="underline">
          CGV
        </a>
      </>
    ),
    errConsent: 'Coche la case d’accès immédiat pour continuer.',
    errFrom: 'Indique ton prénom (« De la part de »).',
    errTo: 'Indique le prénom de la personne à qui tu l’offres.',
    errRecipient: 'L’email de la destinataire n’est pas valide.',
    errBuyer: 'Ton email n’est pas valide.',
    errDate: 'Choisis une date d’envoi entre aujourd’hui et dans 6 mois.',
    errPay: 'Paiement indisponible pour le moment. Réessaie dans un instant.',
    okKicker: 'Carte cadeau',
    okTitle: (from: string | null) => (from ? `Merci ${from}, c’est offert${NB}!` : `Merci, c’est offert${NB}!`),
    okText:
      'Tu vas recevoir dans quelques minutes un email avec la carte en PDF et ta facture. Si tu as choisi l’envoi par email, elle la recevra le jour et à l’heure prévus.',
    okEmail: (to: string, when: string | null) =>
      `${to} recevra sa carte par email ${when ? `le ${when}` : 'dans quelques minutes'}. De ton côté, tu vas recevoir une copie de la carte en PDF et ta facture.`,
    okPrint: 'Tu vas recevoir dans quelques minutes un email avec la carte en PDF, prête à imprimer, et ta facture.',
    okHome: 'Retour à l’accueil',
    okAgain: 'Offrir une autre carte',
  },
  es: {
    kicker: 'Tarjeta regalo · de 1 a 12 meses',
    title: 'Regálale una coach que de verdad la ve.',
    intro: (programmes: boolean, hours: number | null) =>
      `Lives de Pilates y Barre con Alejandra, que la corrige en directo${programmes ? ', programas guiados' : ''}${
        hours ? ` y más de ${hours}${NB}h de videos` : ' y las repeticiones de cada live'
      }. Ella elige su ritmo, desde su sala.`,
    pillPay: 'Pago único, sin suscripción',
    pillDay: 'Enviada el día que elijas',
    pillPdf: 'Tarjeta en PDF, lista para regalar',
    pillNoCard: 'Sin tarjeta bancaria para ella',
    welcome: (
      <>
        <b className="font-semibold text-brand-ink">Alejandra</b> la recibe
        <br />
        desde su primer live
      </>
    ),
    step1: 'Elige la duración',
    perMonth: '/ mes',
    free: (n: number) => `${n} ${n > 1 ? 'meses' : 'mes'} gratis`,
    access: (programmes: boolean) =>
      `Acceso completo: lives en francés y en español, repeticiones${programmes ? ', programas' : ''}, videoteca, blog y tests.`,
    step2: 'Personaliza tu tarjeta',
    from: 'De parte de',
    to: 'Para',
    message: 'Tu mensaje',
    messageHint: '(opcional · 250 caracteres)',
    step3: '¿Cómo regalarla?',
    byEmail: 'Por email, el día D',
    byEmailSub: (to: string) => `${to || 'Ella'} la recibe el día y a la hora que elijas. Tú recibes una copia.`,
    byEmailOff: 'Pronto disponible: por ahora, elige la tarjeta para imprimir.',
    print: 'La imprimo o la entrego yo',
    printSub: 'Recibes enseguida la tarjeta en PDF, lista para imprimir.',
    recipientEmail: (to: string) => `Email de ${to || 'la destinataria'}`,
    date: 'Fecha de envío',
    datePick: 'Elige una fecha',
    time: 'Hora de envío',
    tzParis: 'Hora de París',
    tzMexico: 'Hora de Ciudad de México',
    change: 'cambiar',
    buyerEmail: 'Tu email',
    buyerEmailHint: '(para la factura y la copia de la tarjeta)',
    how: [
      ['Tú regalas', 'Pago único seguro con Stripe. Ninguna suscripción de tu lado.'],
      ['Ella recibe', 'Su tarjeta, tu mensaje y su código, por email o en mano.'],
      ['Ella activa', 'En 1 minuto, sin tarjeta bancaria. Al final, decide si continúa… o no.'],
    ] as const,
    faqTitle: 'Preguntas frecuentes',
    faq: (price: string) =>
      [
        ['¿Cuánto tiempo tiene para activarla?', '12 meses desde la compra. Los meses de regalo empiezan el día en que la activa.'],
        ['¿Y al final de los meses de regalo?', `Su acceso simplemente se detiene. No se cobra nada: si quiere continuar, se suscribe ella misma (${price}/mes, sin compromiso).`],
        ['¿Ya está suscrita?', 'Sin problema: los meses de regalo se descuentan de sus próximos cobros (o amplían su prueba en curso).'],
        [
          '¿Me pueden reembolsar?',
          'Sí. Puedes desistir en los 14 días siguientes a la compra: reembolso total si la tarjeta no se activó; si ya se activó, a prorrata de los días no usados.',
        ],
      ] as const,
    preview: 'Vista previa de su tarjeta',
    line: (m: number) => `Tarjeta regalo ${monthsLabel(m, 'es')}`,
    sendEmail: 'Envío por email',
    sendPrint: 'PDF para imprimir',
    now: 'Inmediato',
    asap: 'Tras el pago',
    total: 'Total',
    consent: 'Pido que la tarjeta pueda activarse enseguida. Si desisto en los 14 días siguientes a la compra cuando ya se activó, solo se retendrá la parte usada.',
    cta: (m: number, p: string) => `Regalar ${monthsLabel(m, 'es')} · ${p}`,
    legal: (
      <>
        Pago seguro con Stripe · IVA no aplicable, art. 293 B del CGI (Francia) ·{' '}
        <a href="/terms" className="underline">
          Condiciones
        </a>
      </>
    ),
    errConsent: 'Marca la casilla de acceso inmediato para continuar.',
    errFrom: 'Indica tu nombre («De parte de»).',
    errTo: 'Indica el nombre de la persona a la que se la regalas.',
    errRecipient: 'El email de la destinataria no es válido.',
    errBuyer: 'Tu email no es válido.',
    errDate: 'Elige una fecha de envío entre hoy y dentro de 6 meses.',
    errPay: 'Pago no disponible por ahora. Inténtalo de nuevo en un momento.',
    okKicker: 'Tarjeta regalo',
    okTitle: (from: string | null) => (from ? `¡Gracias, ${from}, ya está regalado!` : '¡Gracias, ya está regalado!'),
    okText:
      'En unos minutos recibirás un email con la tarjeta en PDF y tu factura. Si elegiste el envío por email, ella la recibirá el día y a la hora previstos.',
    okEmail: (to: string, when: string | null) =>
      `${to} recibirá su tarjeta por email ${when ? `el ${when}` : 'en unos minutos'}. Tú recibirás una copia de la tarjeta en PDF y tu factura.`,
    okPrint: 'En unos minutos recibirás un email con la tarjeta en PDF, lista para imprimir, y tu factura.',
    okHome: 'Volver al inicio',
    okAgain: 'Regalar otra tarjeta',
  },
};

export function OffrirClient({
  prices,
  emailDeliveryOn,
  initialLang = 'fr',
  monthlyPriceLabel = '39 €',
  facts = { programmes: 0, libraryHours: null },
  ok = false,
  purchased = null,
  preview,
}: {
  prices: GiftPrice[];
  emailDeliveryOn: boolean;
  initialLang?: Lang;
  /** Prix mensuel du Visio collectif (Stripe), pour la FAQ. */
  monthlyPriceLabel?: string;
  facts?: { programmes: number; libraryHours: number | null };
  /** Retour de Stripe après paiement. */
  ok?: boolean;
  /** Détails de la carte payée (relus dans la session Stripe), pour le message de remerciement. */
  purchased?: PurchasedGift | null;
  preview?: boolean;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const t = COPY[lang];
  const [months, setMonths] = useState(3);
  const [from, setFrom] = useState(preview ? 'Sandrine' : '');
  const [to, setTo] = useState(preview ? 'Julie' : '');
  const [message, setMessage] = useState(preview ? 'Joyeux anniversaire ! 3 mois pour prendre soin de toi, à ton rythme. Je t’embrasse.' : '');
  const [delivery, setDelivery] = useState<'email' | 'print'>(emailDeliveryOn ? 'email' : 'print');
  const [recipientEmail, setRecipientEmail] = useState(preview ? 'julie.m@exemple.fr' : '');
  const [buyerEmail, setBuyerEmail] = useState(preview ? 'sandrine@exemple.fr' : '');
  const [tz, setTz] = useState<GiftTimezone>('Europe/Paris');
  const [date, setDate] = useState(preview ? '2026-10-24' : '');
  const [time, setTime] = useState(preview ? '14:00' : '08:00');
  const [immediate, setImmediate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState('');
  const dateInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    // Fuseau et date par défaut (demain) calculés dans le navigateur de l'acheteuse.
    const guessed = guessGiftTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setTz(guessed);
    setToday(ymdInZone(new Date(), guessed));
    if (!preview) setDate(ymdInZone(new Date(), guessed, 1));
  }, [preview]);

  const programmesOn = facts.programmes > 1;
  const selected = prices.find((p) => p.months === months) ?? prices[1] ?? prices[0];
  const slots = useMemo(() => halfHourSlots(), []);
  const maxDate = useMemo(() => maxSendDateYmd(new Date()), []);
  const sendPassed = useMemo(() => {
    if (!date) return false;
    try {
      return computeSendAtUtc(date, time, tz).getTime() <= Date.now();
    } catch {
      return false;
    }
  }, [date, time, tz]);
  const recap = delivery === 'print' ? t.now : !date ? '—' : sendPassed ? t.asap : formatSendRecap(date, time, lang);
  const priceShort = money(selected?.amountCents ?? null, lang, true);

  async function pay() {
    if (preview || busy) return;
    setError(null);
    if (!from.trim()) return setError(t.errFrom);
    if (!to.trim()) return setError(t.errTo);
    if (delivery === 'email' && !EMAIL_RE.test(recipientEmail.trim())) return setError(t.errRecipient);
    if (delivery === 'email' && (!date || (today && date < today) || date > maxDate)) return setError(t.errDate);
    if (!EMAIL_RE.test(buyerEmail.trim())) return setError(t.errBuyer);
    if (!immediate) return setError(t.errConsent);
    setBusy(true);
    try {
      const res = await fetch('/api/gifts/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          months,
          from: from.trim(),
          to: to.trim(),
          message,
          delivery,
          recipientEmail: delivery === 'email' ? recipientEmail.trim() : '',
          buyerEmail: buyerEmail.trim(),
          date,
          time,
          timezone: tz,
          immediate,
          locale: lang,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error || t.errPay);
        setBusy(false);
        return;
      }
      window.location.href = json.url;
    } catch {
      setError(t.errPay);
      setBusy(false);
    }
  }

  const header = <PublicSiteHeader lang={lang === 'es' ? 'ES' : 'FR'} onToggleLang={(l) => setLang(l === 'ES' ? 'es' : 'fr')} activeHref="/offrir" />;

  if (ok) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f6f4f1] text-brand-ink">
        {header}
        <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-5 py-16 md:px-8">
          <section className="grid w-full items-center gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <p className="fm-kicker fm-kicker--orange">{t.okKicker}</p>
              <h1 className="fm-display mt-4 text-[2.5rem] leading-[1.05] md:text-[3.6rem]">{t.okTitle(purchased?.from ?? null)}</h1>
              <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-brand-ink/65 md:text-[17px]">
                {!purchased ? t.okText : purchased.delivery === 'email' ? t.okEmail(purchased.to, purchased.sendLabel?.[lang] ?? null) : t.okPrint}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/" className="btn-luxury-primary">
                  {t.okHome}
                </Link>
                <Link href="/offrir" className="text-[13px] font-semibold text-luxury-orange">
                  {t.okAgain}
                </Link>
              </div>
            </div>
            {purchased ? (
              <div className="mx-auto w-full max-w-[460px] rotate-[-3deg]">
                <GiftCardVisual lang={lang} months={purchased.months} from={purchased.from} to={purchased.to} />
              </div>
            ) : (
              <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-terracotta-50 text-luxury-orange">
                <Gift size={56} strokeWidth={1.6} aria-hidden />
              </div>
            )}
          </section>
        </main>
        <PublicSiteFooter lang={lang} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f4f1] text-brand-ink">
      {header}
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 md:px-8">
        <section className="grid items-center gap-10 pb-12 pt-10 md:grid-cols-2 md:gap-14 md:pb-16 md:pt-16">
          <div>
            <p className="fm-kicker fm-kicker--orange">{t.kicker}</p>
            <h1 className="fm-display mt-4 text-[2.6rem] leading-[1.04] text-brand-ink md:text-[3.9rem]">{t.title}</h1>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-brand-ink/65 md:text-[18px]">{t.intro(programmesOn, facts.libraryHours)}</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] font-medium text-brand-ink/70">
              <span className="inline-flex items-center gap-2">
                <CreditCard className="text-luxury-orange" size={16} aria-hidden /> {t.pillPay}
              </span>
              <span className="inline-flex items-center gap-2">
                <Mail className="text-luxury-orange" size={16} aria-hidden /> {emailDeliveryOn ? t.pillDay : t.pillPdf}
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="text-luxury-orange" size={16} aria-hidden /> {t.pillNoCard}
              </span>
            </div>
          </div>
          <div className="relative mx-auto mb-8 w-full max-w-[520px] md:mb-0">
            <div className="absolute -right-4 -top-6 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(243,197,142,0.55),rgba(243,197,142,0)_70%)]" aria-hidden />
            <div className="relative rotate-[-4deg]">
              <GiftCardVisual lang={lang} months={months} from={from} to={to} />
            </div>
            <div className="absolute -bottom-10 right-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_14px_34px_rgba(29,26,23,0.16)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/landing/alejandra-avatar.jpg" alt="" className="h-10 w-10 rounded-full object-cover object-top" />
              <p className="text-[12.5px] leading-snug text-brand-ink/75">{t.welcome}</p>
            </div>
          </div>
        </section>

        <div className="grid items-start gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0 space-y-10">
            <section>
              <h2 className="text-[22px] font-semibold tracking-tight text-brand-ink">
                <span className="mr-2 text-luxury-orange">1.</span>
                {t.step1}
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
                      className={`relative flex flex-col items-start rounded-[1.4rem] p-4 text-left transition-shadow md:p-5 ${
                        on ? 'bg-white shadow-[0_16px_36px_rgba(196,93,62,0.18)] ring-2 ring-luxury-orange' : 'border border-brand-ink/10 bg-white/70 hover:bg-white'
                      }`}
                    >
                      {p.freeMonths ? (
                        <span
                          className={`absolute -top-2.5 left-4 rounded-full px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em] ${
                            on ? 'bg-luxury-orange text-white' : 'bg-[#f8f0e0] text-[#8a6a2f]'
                          }`}
                        >
                          {t.free(p.freeMonths)}
                        </span>
                      ) : null}
                      <span className="mt-1 text-[15px] font-semibold text-brand-ink">{monthsLabel(p.months, lang)}</span>
                      <span className="mt-2 text-[28px] font-semibold tracking-tight text-brand-ink">{money(p.amountCents, lang, true)}</span>
                      <span className="text-[12px] text-brand-ink/55">{p.perMonthCents != null ? `${money(p.perMonthCents, lang, true)} ${t.perMonth}` : '—'}</span>
                      {on ? <CircleCheck className="absolute right-4 top-4 text-luxury-orange" size={20} strokeWidth={2.2} aria-hidden /> : null}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[12.5px] text-brand-ink/55">{t.access(programmesOn)}</p>
            </section>

            <section>
              <h2 className="text-[22px] font-semibold tracking-tight text-brand-ink">
                <span className="mr-2 text-luxury-orange">2.</span>
                {t.step2}
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="fm-label">{t.from}</span>
                  <input className="fm-input" value={from} onChange={(e) => setFrom(e.target.value)} maxLength={60} autoComplete="given-name" />
                </label>
                <label className="block">
                  <span className="fm-label">{t.to}</span>
                  <input className="fm-input" value={to} onChange={(e) => setTo(e.target.value)} maxLength={60} autoComplete="off" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="fm-label">
                    {t.message} <span className="font-normal text-brand-ink/45">{t.messageHint}</span>
                  </span>
                  <textarea className="fm-input min-h-[104px] resize-none" maxLength={250} value={message} onChange={(e) => setMessage(e.target.value)} />
                </label>
              </div>
            </section>

            <section>
              <h2 className="text-[22px] font-semibold tracking-tight text-brand-ink">
                <span className="mr-2 text-luxury-orange">3.</span>
                {t.step3}
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t.step3}>
                <DeliveryOption
                  on={delivery === 'email'}
                  disabled={!emailDeliveryOn}
                  onSelect={() => setDelivery('email')}
                  title={t.byEmail}
                  sub={emailDeliveryOn ? t.byEmailSub(to.trim()) : t.byEmailOff}
                />
                <DeliveryOption on={delivery === 'print'} onSelect={() => setDelivery('print')} title={t.print} sub={t.printSub} />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {delivery === 'email' ? (
                  <>
                    <label className="block sm:col-span-2">
                      <span className="fm-label">{t.recipientEmail(to.trim())}</span>
                      <input className="fm-input" type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} autoComplete="off" />
                    </label>
                    <label className="block">
                      <span className="fm-label">{t.date}</span>
                      <span className="relative block">
                        <input
                          ref={dateInput}
                          type="date"
                          value={date}
                          min={today || undefined}
                          max={maxDate}
                          onChange={(e) => setDate(e.target.value)}
                          onClick={() => {
                            try {
                              dateInput.current?.showPicker?.();
                            } catch {
                              /* ancien navigateur : le champ natif suffit */
                            }
                          }}
                          aria-label={t.date}
                          className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                        />
                        <span
                          className={`fm-input flex min-h-[50px] items-center pr-11 peer-focus-visible:border-luxury-orange peer-focus-visible:shadow-[0_0_0_4px_rgba(196,93,62,0.12)] ${
                            date ? '' : 'text-brand-ink/40'
                          }`}
                          aria-hidden
                        >
                          {date ? longDate(date, lang) : t.datePick}
                        </span>
                        <CalendarDays className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-ink/40" size={17} aria-hidden />
                      </span>
                    </label>
                    <label className="block">
                      <span className="fm-label">{t.time}</span>
                      <span className="relative block">
                        <select className="fm-input appearance-none pr-11" value={time} onChange={(e) => setTime(e.target.value)}>
                          {slots.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-ink/40" size={17} aria-hidden />
                      </span>
                      <span className="fm-hint block">
                        {tz === 'Europe/Paris' ? t.tzParis : t.tzMexico} ·{' '}
                        <button type="button" className="underline" onClick={() => setTz((v) => (v === 'Europe/Paris' ? 'America/Mexico_City' : 'Europe/Paris'))}>
                          {t.change}
                        </button>
                      </span>
                    </label>
                    <div className="-mt-1 flex flex-wrap gap-2 sm:col-span-2">
                      {TIME_SHORTCUTS.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          aria-pressed={time === s.time}
                          onClick={() => setTime(s.time)}
                          className={`fm-chip ${time === s.time ? 'fm-chip--active' : 'fm-chip--soft'} !normal-case !tracking-normal !text-[12.5px]`}
                        >
                          {lang === 'es' ? s.labelEs : s.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
                <label className="block sm:col-span-2">
                  <span className="fm-label">
                    {t.buyerEmail} <span className="font-normal text-brand-ink/45">{t.buyerEmailHint}</span>
                  </span>
                  <input className="fm-input" type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} autoComplete="email" />
                </label>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              {t.how.map(([title, text], i) => {
                const Icon = [Gift, MailOpen, Sparkles][i];
                return (
                  <div key={title} className="rounded-[1.4rem] bg-white/80 p-5 shadow-[0_10px_26px_rgba(29,26,23,0.06)]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-terracotta-50 text-luxury-orange">
                      <Icon size={18} aria-hidden />
                    </span>
                    <p className="mt-3 text-[15px] font-semibold text-brand-ink">{title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-brand-ink/60">{text}</p>
                  </div>
                );
              })}
            </section>

            <section>
              <h2 className="text-[22px] font-semibold tracking-tight text-brand-ink">{t.faqTitle}</h2>
              <div className="mt-4 divide-y divide-brand-ink/[0.07] rounded-[1.4rem] bg-white/80">
                {t.faq(monthlyPriceLabel).map(([q, a], i) => (
                  <details key={q} className="group px-5 py-4" open={i === 1}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-brand-ink [&::-webkit-details-marker]:hidden">
                      {q}
                      <ChevronDown size={18} className="shrink-0 text-brand-ink/35 transition-transform group-open:rotate-180" aria-hidden />
                    </summary>
                    <p className="mt-2 text-[14px] leading-relaxed text-brand-ink/60">{a}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_24px_60px_-20px_rgba(29,26,23,0.28)]">
              <p className="fm-kicker">{t.preview}</p>
              <div className="mt-4">
                <GiftCardVisual lang={lang} months={months} from={from} to={to} />
              </div>
              {message.trim() ? (
                <p className="mt-4 whitespace-pre-line break-words rounded-2xl bg-sand px-4 py-3 text-[13px] italic leading-relaxed text-brand-ink/70">
                  {lang === 'es' ? `«${message.trim()}»` : `«${NB}${message.trim()}${NB}»`}
                </p>
              ) : null}
              <dl className="mt-5 space-y-2 text-[14px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-brand-ink/60">{t.line(months)}</dt>
                  <dd className="font-semibold text-brand-ink">{money(selected?.amountCents ?? null, lang)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-brand-ink/60">{delivery === 'email' ? t.sendEmail : t.sendPrint}</dt>
                  <dd className="text-right text-brand-ink">{recap}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-brand-ink/[0.07] pt-2 text-[15px]">
                  <dt className="font-semibold text-brand-ink">{t.total}</dt>
                  <dd className="font-semibold text-brand-ink">{money(selected?.amountCents ?? null, lang)}</dd>
                </div>
              </dl>
              <label className="mt-5 flex cursor-pointer items-start gap-3 text-[12px] leading-snug text-brand-ink/65">
                <input type="checkbox" className="peer sr-only" checked={immediate} onChange={(e) => setImmediate(e.target.checked)} />
                <span
                  className={`fm-check mt-0.5 !h-5 !w-5 peer-focus-visible:ring-2 peer-focus-visible:ring-luxury-orange/40 ${immediate ? 'fm-check--on' : ''}`}
                  aria-hidden
                >
                  {immediate ? <Check size={12} strokeWidth={3} /> : null}
                </span>
                <span>{t.consent}</span>
              </label>
              {error ? (
                <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-800" role="alert">
                  {error}
                </p>
              ) : null}
              <button type="button" disabled={busy || selected?.amountCents == null} onClick={() => void pay()} className="btn-luxury-primary mt-4 w-full !py-4">
                <Lock size={14} strokeWidth={2.4} aria-hidden /> {t.cta(months, priceShort)}
              </button>
              <p className="mt-3 text-center text-[11.5px] leading-relaxed text-brand-ink/50">{t.legal}</p>
            </div>
          </aside>
        </div>
      </main>
      <PublicSiteFooter lang={lang} />
    </div>
  );
}

function DeliveryOption({ on, disabled, onSelect, title, sub }: { on: boolean; disabled?: boolean; onSelect: () => void; title: string; sub: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      disabled={disabled}
      onClick={onSelect}
      className={`flex items-start gap-3 rounded-2xl p-4 text-left ${on ? 'border-2 border-luxury-orange bg-white' : 'border border-brand-ink/10 bg-white/70'} ${
        disabled ? 'cursor-not-allowed opacity-55' : ''
      }`}
    >
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-luxury-orange' : 'border-brand-ink/20'}`}>
        {on ? <span className="h-2.5 w-2.5 rounded-full bg-luxury-orange" /> : null}
      </span>
      <span>
        <span className="block text-[14.5px] font-semibold text-brand-ink">{title}</span>
        <span className="mt-0.5 block text-[12.5px] text-brand-ink/55">{sub}</span>
      </span>
    </button>
  );
}
