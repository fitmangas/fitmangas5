'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Check, CircleCheck, Eye, EyeOff, Gift, LoaderCircle, Sparkles } from 'lucide-react';

import { GiftCardVisual } from './GiftCardVisual';
import { TurnstileWidget } from '@/components/Security/TurnstileWidget';
import { PublicSiteHeader } from '@/components/Marketing/PublicSiteHeader';
import { PublicSiteFooter } from '@/components/Marketing/PublicSiteFooter';
import { createClient } from '@/lib/supabase/client';
import { detectBrowserTimeZone } from '@/lib/locale-timezone-detection';

/**
 * C04 — activation d'une carte cadeau (/offrir/activer).
 * Le code est vérifié tout de suite (sans être consommé), puis retiré de l'adresse.
 * Trois chemins : déjà connectée (un clic), création du compte, ou connexion à un compte existant.
 */

type Lang = 'fr' | 'es';
type GiftInfo = {
  code: string;
  months: number;
  recipientName: string;
  buyerName: string;
  message: string | null;
  expiresAt: string;
  lang?: Lang;
};
type Activated = {
  mode: 'new_trial' | 'existing_no_access' | 'balance_credit' | 'trial_extension';
  months: number;
  accessEndsAt: string | null;
  creditCents: number | null;
  needsReactivation: boolean;
  paymentIssue?: boolean;
};

const STORE_KEY = 'fm_gift_code';

const monthsWord = (m: number, lang: Lang) => (lang === 'es' ? (m > 1 ? 'meses' : 'mes') : 'mois');

type Copy = {
  kicker: string;
  titleFor: (n: string) => string;
  title: string;
  subNew: (m: number) => string;
  subLogged: (m: number) => string;
  subIdle: string;
  subDone: string;
  benefits: (programmes: number, hours: number | null) => string[];
  code: string;
  check: string;
  valid: (m: number, b: string) => string;
  create: string;
  login: string;
  first: string;
  last: string;
  email: string;
  phone: string;
  phonePlaceholder: string;
  phoneHint: string;
  password: string;
  passwordHint: string;
  show: string;
  hide: string;
  terms: ReactNode;
  activate: (m: number) => string;
  activateOn: (m: number) => string;
  loggedAs: (e: string) => string;
  loginActivate: (m: number) => string;
  until: (d: string, p: string) => ReactNode;
  haveAccount: (m: number) => ReactNode;
  noAccount: ReactNode;
  errName: string;
  errEmail: string;
  errPhone: string;
  errPassword: string;
  errTerms: string;
  errExisting: (m: number) => string;
  errLogin: string;
  errGeneric: string;
  doneTitle: string;
  doneTrial: (d: string, p: string) => string;
  doneExtension: (d: string) => string;
  doneCredit: (c: string, m: number) => string;
  reactivate: string;
  paymentIssue: string;
  confirmEmail: string;
  go: string;
  goLogin: string;
  billing: string;
};

const COPY: Record<Lang, Copy> = {
  fr: {
    kicker: 'Activer ton cadeau',
    titleFor: (n) => `${n}, ton cadeau t’attend.`,
    title: 'Ton cadeau t’attend.',
    subNew: (m) => `Crée ton compte en 1 minute : tes ${m} mois commencent tout de suite. Aucune carte bancaire.`,
    subLogged: (m) => `Tes ${m} mois s’ajoutent à ton compte en un clic. Aucune carte bancaire.`,
    subIdle: 'Entre le code reçu par email ou imprimé sur ta carte.',
    subDone: 'Bienvenue chez FitMangas. Alejandra a hâte de te voir en live.',
    benefits: (programmes, hours) =>
      [
        'Au moins 2 lives par semaine avec Alejandra, qui te corrige en direct',
        programmes > 1 ? `${programmes} programmes guidés, du débutant à l’avancé` : null,
        hours ? `Plus de ${hours} h de vidéos et les replays des lives` : 'Les replays des lives et la vidéothèque',
      ].filter((x): x is string => Boolean(x)),
    code: 'Code cadeau',
    check: 'Vérifier',
    valid: (m, b) => `Code valide : ${m} mois offerts par ${b}`,
    create: 'Crée ton compte',
    login: 'Connecte-toi',
    first: 'Prénom',
    last: 'Nom',
    email: 'Email',
    phone: 'Téléphone',
    phonePlaceholder: '06 12 34 56 78',
    phoneHint: 'Pour te joindre en cas de souci avec ton accès.',
    password: 'Mot de passe',
    passwordHint: '8 caractères minimum.',
    show: 'Afficher le mot de passe',
    hide: 'Masquer le mot de passe',
    terms: (
      <>
        J’accepte les{' '}
        <a href="/terms" className="underline underline-offset-2" target="_blank" rel="noopener">
          conditions générales
        </a>
        . En continuant, tu confirmes avoir lu la{' '}
        <a href="/privacy" className="underline underline-offset-2" target="_blank" rel="noopener">
          politique de confidentialité
        </a>
        .
      </>
    ),
    activate: (m) => `Activer mes ${m} mois`,
    activateOn: (m) => `Ajouter mes ${m} mois à mon compte`,
    loggedAs: (e) => `Connectée avec ${e}.`,
    loginActivate: (m) => `Me connecter et activer mes ${m} mois`,
    until: (d, p) => (
      <>
        Accès jusqu’au <b className="font-semibold text-brand-ink">{d}</b>. Ensuite, rien n’est prélevé : tu choisiras de continuer ({p}/mois) ou non.
      </>
    ),
    haveAccount: (m) => (
      <>
        Déjà un compte ? <span className="font-semibold text-luxury-orange">Connecte-toi</span> pour ajouter tes {m} mois.
      </>
    ),
    noAccount: (
      <>
        Pas encore de compte ? <span className="font-semibold text-luxury-orange">Crée-le</span> en 1 minute.
      </>
    ),
    errName: 'Indique ton prénom et ton nom.',
    errEmail: 'Indique ton adresse email.',
    errPhone: 'Le téléphone est obligatoire.',
    errPassword: 'Le mot de passe doit faire au moins 8 caractères.',
    errTerms: 'Coche la case pour accepter les conditions.',
    errExisting: (m) => `Cet email a déjà un compte : connecte-toi pour ajouter tes ${m} mois.`,
    errLogin: 'Email ou mot de passe incorrect.',
    errGeneric: 'Activation impossible pour le moment. Réessaie dans un instant.',
    doneTitle: 'C’est activé !',
    doneTrial: (d, p) => `Tes mois offerts sont ouverts jusqu’au ${d}. Aucun prélèvement : à la fin, tu choisis de continuer (${p}/mois) ou non.`,
    doneExtension: (d) => `Ton essai est prolongé jusqu’au ${d}. Rien n’est prélevé d’ici là.`,
    doneCredit: (c, m) => `${c} sont crédités sur ton compte : ils couvrent tes ${m} prochains mois.`,
    reactivate: 'Ton abonnement s’arrête à la fin de la période en cours : réactive-le pour profiter de ton crédit.',
    paymentIssue: 'Un prélèvement de ton abonnement est en attente : mets à jour ton moyen de paiement. Ton crédit servira aux prochains prélèvements.',
    confirmEmail: 'Dernière étape : confirme ton adresse avec le lien reçu par email, puis connecte-toi. Tes mois t’attendent.',
    go: 'Découvrir mon espace',
    goLogin: 'Me connecter',
    billing: 'Gérer mon abonnement',
  },
  es: {
    kicker: 'Activa tu regalo',
    titleFor: (n) => `${n}, tu regalo te espera.`,
    title: 'Tu regalo te espera.',
    subNew: (m) => `Crea tu cuenta en 1 minuto: tus ${m} ${monthsWord(m, 'es')} empiezan enseguida. Sin tarjeta bancaria.`,
    subLogged: (m) => `Tus ${m} ${monthsWord(m, 'es')} se suman a tu cuenta en un clic. Sin tarjeta bancaria.`,
    subIdle: 'Escribe el código que recibiste por email o impreso en tu tarjeta.',
    subDone: 'Bienvenida a FitMangas. Alejandra tiene muchas ganas de verte en live.',
    benefits: (programmes, hours) =>
      [
        'Al menos 2 lives por semana con Alejandra, que te corrige en directo',
        programmes > 1 ? `${programmes} programas guiados, de principiante a avanzado` : null,
        hours ? `Más de ${hours} h de videos y las repeticiones de los lives` : 'Las repeticiones de los lives y la videoteca',
      ].filter((x): x is string => Boolean(x)),
    code: 'Código regalo',
    check: 'Verificar',
    valid: (m, b) => `Código válido: ${m} ${monthsWord(m, 'es')} de regalo de ${b}`,
    create: 'Crea tu cuenta',
    login: 'Inicia sesión',
    first: 'Nombre',
    last: 'Apellido',
    email: 'Email',
    phone: 'Teléfono',
    phonePlaceholder: '55 1234 5678',
    phoneHint: 'Para contactarte si hay algún problema con tu acceso.',
    password: 'Contraseña',
    passwordHint: '8 caracteres mínimo.',
    show: 'Mostrar la contraseña',
    hide: 'Ocultar la contraseña',
    terms: (
      <>
        Acepto las{' '}
        <a href="/terms" className="underline underline-offset-2" target="_blank" rel="noopener">
          condiciones generales
        </a>
        . Al continuar, confirmas haber leído la{' '}
        <a href="/privacy" className="underline underline-offset-2" target="_blank" rel="noopener">
          política de privacidad
        </a>
        .
      </>
    ),
    activate: (m) => `Activar mis ${m} ${monthsWord(m, 'es')}`,
    activateOn: (m) => `Sumar mis ${m} ${monthsWord(m, 'es')} a mi cuenta`,
    loggedAs: (e) => `Sesión iniciada con ${e}.`,
    loginActivate: (m) => `Iniciar sesión y activar mis ${m} ${monthsWord(m, 'es')}`,
    until: (d, p) => (
      <>
        Acceso hasta el <b className="font-semibold text-brand-ink">{d}</b>. Después, no se cobra nada: decidirás si continúas ({p}/mes) o no.
      </>
    ),
    haveAccount: (m) => (
      <>
        ¿Ya tienes cuenta? <span className="font-semibold text-luxury-orange">Inicia sesión</span> para sumar tus {m} {monthsWord(m, 'es')}.
      </>
    ),
    noAccount: (
      <>
        ¿Todavía no tienes cuenta? <span className="font-semibold text-luxury-orange">Créala</span> en 1 minuto.
      </>
    ),
    errName: 'Indica tu nombre y tu apellido.',
    errEmail: 'Indica tu dirección de email.',
    errPhone: 'El teléfono es obligatorio.',
    errPassword: 'La contraseña debe tener al menos 8 caracteres.',
    errTerms: 'Marca la casilla para aceptar las condiciones.',
    errExisting: (m) => `Este email ya tiene una cuenta: inicia sesión para sumar tus ${m} ${monthsWord(m, 'es')}.`,
    errLogin: 'Email o contraseña incorrectos.',
    errGeneric: 'No se pudo activar por ahora. Inténtalo de nuevo en un momento.',
    doneTitle: '¡Activado!',
    doneTrial: (d, p) => `Tus meses de regalo están abiertos hasta el ${d}. Sin cobros: al final, decides si continúas (${p}/mes) o no.`,
    doneExtension: (d) => `Tu prueba se amplía hasta el ${d}. No se cobra nada hasta entonces.`,
    doneCredit: (c, m) => `Se acreditaron ${c} en tu cuenta: cubren tus próximos ${m} ${monthsWord(m, 'es')}.`,
    reactivate: 'Tu suscripción termina al final del periodo actual: reactívala para aprovechar tu crédito.',
    paymentIssue: 'Hay un cobro pendiente en tu suscripción: actualiza tu medio de pago. Tu crédito se usará en los próximos cobros.',
    confirmEmail: 'Último paso: confirma tu dirección con el enlace que recibiste por email y luego inicia sesión. Tus meses te esperan.',
    go: 'Descubrir mi espacio',
    goLogin: 'Iniciar sesión',
    billing: 'Gestionar mi suscripción',
  },
};

const fmtDate = (iso: string, lang: Lang) =>
  new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

const addMonths = (months: number, from = new Date()) => {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
};

const DEMO_GIFT: GiftInfo = {
  code: 'FM-7K2Q-9XW4',
  months: 3,
  recipientName: 'Julie',
  buyerName: 'Sandrine',
  message: null,
  expiresAt: '2027-10-14T10:00:00Z',
  lang: 'fr',
};

export function ActivateGiftClient({
  initialCode,
  initialLang = 'fr',
  langFromUrl = false,
  session,
  facts,
  monthlyPriceLabel,
  preview,
  previewDone,
}: {
  initialCode?: string;
  initialLang?: Lang;
  /** La langue a été choisie dans l'adresse (?lang=) : on ne suit pas celle de la carte. */
  langFromUrl?: boolean;
  session: { email: string } | null;
  facts: { programmes: number; libraryHours: number | null };
  /** « 39 € » */
  monthlyPriceLabel: string;
  preview?: boolean;
  /** Aperçu de l'écran de réussite. */
  previewDone?: Activated;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const langChosen = useRef(langFromUrl);
  const t = COPY[lang];

  const [code, setCode] = useState(preview ? DEMO_GIFT.code : (initialCode ?? ''));
  const [gift, setGift] = useState<GiftInfo | null>(preview ? DEMO_GIFT : null);
  const [checking, setChecking] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [firstName, setFirstName] = useState(preview ? 'Julie' : '');
  const [lastName, setLastName] = useState(preview ? 'Martin' : '');
  const [email, setEmail] = useState(preview ? 'julie.m@exemple.fr' : '');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(preview ? 'motdepasse' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [accept, setAccept] = useState(Boolean(preview));

  const [token, setToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Activated | null>(previewDone ?? null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  /** Compte créé à une tentative précédente (l'activation avait échoué) : on ne le recrée pas. */
  const [created, setCreated] = useState<{ userId: string; email: string; hasSession: boolean } | null>(null);

  const lookup = useCallback(async (raw: string, uiLang: Lang) => {
    const value = raw.trim().toUpperCase();
    if (!value) return;
    setChecking(true);
    setCodeError(null);
    try {
      const res = await fetch('/api/gifts/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: value, locale: uiLang }),
      });
      const json = (await res.json().catch(() => ({}))) as { gift?: GiftInfo; error?: string };
      if (!res.ok || !json.gift) {
        setGift(null);
        setCodeError(json.error ?? COPY[uiLang].errGeneric);
        return;
      }
      setGift(json.gift);
      setCode(json.gift.code);
      if (!langChosen.current && json.gift.lang && json.gift.lang !== uiLang) setLang(json.gift.lang);
      try {
        sessionStorage.setItem(STORE_KEY, json.gift.code);
      } catch {
        /* stockage indisponible : le code reste dans le champ */
      }
    } catch {
      setCodeError(COPY[uiLang].errGeneric);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (preview) return;
    let start = initialCode ?? '';
    if (initialCode) {
      // Le code ne reste pas dans l'adresse (historique du navigateur, partage du lien).
      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    } else {
      try {
        start = sessionStorage.getItem(STORE_KEY) ?? '';
      } catch {
        start = '';
      }
    }
    if (start) {
      setCode(start);
      void lookup(start, initialLang);
    }
    // Une seule lecture au chargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleLang(next: 'FR' | 'ES') {
    langChosen.current = true;
    setLang(next === 'ES' ? 'es' : 'fr');
  }

  function resetTurnstile() {
    setToken(null);
    setTurnstileKey((k) => k + 1);
  }

  async function activateRequest(extra: Record<string, unknown>): Promise<Activated> {
    const res = await fetch('/api/gifts/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code: gift?.code ?? code, turnstileToken: token, locale: lang, ...extra }),
    });
    const json = (await res.json().catch(() => ({}))) as Partial<Activated> & { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) throw new Error(json.error || t.errGeneric);
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
    return json as Activated;
  }

  async function submit() {
    if (!gift || busy) return;
    setError(null);
    if (preview) {
      setDone({ mode: 'new_trial', months: gift.months, accessEndsAt: addMonths(gift.months), creditCents: null, needsReactivation: false });
      return;
    }

    // Vérifications avant tout appel.
    if (!session && !created) {
      if (!email.trim()) return setError(t.errEmail);
      if (mode === 'signup') {
        if (!firstName.trim() || !lastName.trim()) return setError(t.errName);
        if (!phone.trim()) return setError(t.errPhone);
        if (password.length < 8) return setError(t.errPassword);
        if (!accept) return setError(t.errTerms);
      } else if (!password) {
        return setError(t.errLogin);
      }
    }

    setBusy(true);
    try {
      if (session) {
        setDone(await activateRequest({}));
        return;
      }
      if (created) {
        const result = await activateRequest(created.hasSession ? {} : { userId: created.userId, email: created.email });
        setNeedsConfirm(!created.hasSession);
        setDone(result);
        return;
      }
      const supabase = createClient();
      if (mode === 'login') {
        const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (e) throw new Error(/invalid|credentials/i.test(e.message) ? t.errLogin : e.message);
        setDone(await activateRequest({}));
        return;
      }
      const { data, error: e } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
            preferred_locale: lang,
            display_timezone: detectBrowserTimeZone(),
            segment: 'VISIO',
            preferred_course_id: 'v-coll',
          },
        },
      });
      // Email déjà inscrit : selon le réglage Supabase, erreur explicite ou compte « vide » sans identité.
      const exists =
        (e && /already|registered|exists/i.test(e.message)) || (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0);
      if (exists) {
        setMode('login');
        setPassword('');
        throw new Error(t.errExisting(gift.months));
      }
      if (e) throw new Error(e.message);
      const userId = data.user?.id;
      if (!userId) throw new Error(t.errGeneric);
      const account = { userId, email: email.trim(), hasSession: Boolean(data.session) };
      setCreated(account);
      const result = await activateRequest(account.hasSession ? {} : { userId, email: account.email });
      setNeedsConfirm(!account.hasSession);
      setDone(result);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t.errGeneric);
      resetTurnstile();
    } finally {
      setBusy(false);
    }
  }

  const months = gift?.months ?? 0;
  const accessEnd = gift ? addMonths(gift.months) : null;
  const recipient = gift?.recipientName?.trim();
  const title = recipient && recipient !== '—' ? t.titleFor(recipient) : t.title;
  const sub = done ? t.subDone : !gift ? t.subIdle : session ? t.subLogged(months) : t.subNew(months);
  const showForm = !session && !created;

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f4f1] text-brand-ink">
      <PublicSiteHeader lang={lang === 'es' ? 'ES' : 'FR'} onToggleLang={toggleLang} activeHref="/offrir" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 md:px-8 md:pb-20">
        <section className="grid items-start gap-10 pt-10 md:grid-cols-2 md:gap-16 md:pt-16">
          <div className="min-w-0">
            <p className="fm-kicker fm-kicker--orange">{t.kicker}</p>
            <h1 className="fm-display mt-4 max-w-[34rem] text-[2.5rem] leading-[1.05] text-brand-ink md:text-[3.6rem]">{title}</h1>
            <p className="mt-4 max-w-[28rem] text-[16px] leading-relaxed text-brand-ink/65 md:text-[17px]">{sub}</p>
            <div className="mt-8 max-w-[440px]">
              <GiftCardVisual lang={lang} months={gift?.months ?? 3} from={gift?.buyerName ?? '…'} to={recipient || '…'} code={gift?.code} />
            </div>
            <ul className="mt-8 space-y-3 text-[14.5px] leading-snug text-brand-ink/75">
              {t.benefits(facts.programmes, facts.libraryHours).map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CircleCheck size={18} strokeWidth={2.2} className="mt-0.5 shrink-0 text-success" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 rounded-[1.75rem] bg-white p-6 shadow-[0_24px_60px_-20px_rgba(29,26,23,0.28)] md:p-8">
            {done ? (
              <DoneView done={done} lang={lang} monthlyPriceLabel={monthlyPriceLabel} needsConfirm={needsConfirm} />
            ) : (
              <>
                <label className="block">
                  <span className="fm-label">{t.code}</span>
                  <span className="mt-1.5 flex gap-2">
                    <span className="relative block flex-1">
                      <input
                        className={`fm-input pr-11 font-mono uppercase tracking-[0.14em] ${gift ? '!border-success/60' : ''}`}
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value);
                          setCodeError(null);
                          if (gift) setGift(null);
                        }}
                        onBlur={() => {
                          if (!gift && !checking && code.trim().length >= 12) void lookup(code, lang);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            void lookup(code, lang);
                          }
                        }}
                        placeholder="FM-XXXX-XXXX"
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        aria-invalid={codeError ? true : undefined}
                      />
                      {gift ? (
                        <CircleCheck className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-success" size={18} strokeWidth={2.4} aria-hidden />
                      ) : null}
                    </span>
                    {!gift ? (
                      <button type="button" className="btn-luxury-ghost shrink-0 !px-5" disabled={checking || !code.trim()} onClick={() => void lookup(code, lang)}>
                        {checking ? <LoaderCircle size={14} className="animate-spin" aria-hidden /> : null}
                        {t.check}
                      </button>
                    ) : null}
                  </span>
                </label>
                {gift ? (
                  <p className="mt-2.5 inline-flex items-center gap-2 rounded-xl bg-success-50 px-3 py-2 text-[12.5px] font-medium text-success">
                    <Gift size={14} aria-hidden /> {t.valid(gift.months, gift.buyerName)}
                  </p>
                ) : codeError ? (
                  <p className="mt-2.5 rounded-xl bg-red-50 px-3 py-2 text-[12.5px] text-red-800" role="alert">
                    {codeError}
                  </p>
                ) : null}

                {gift ? (
                  <form
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      void submit();
                    }}
                  >
                    <div className="my-6 h-px bg-brand-ink/[0.07]" />
                    {session ? (
                      <p className="text-[14px] text-brand-ink/70">{t.loggedAs(session.email)}</p>
                    ) : showForm ? (
                      <p className="text-[16px] font-semibold text-brand-ink">{mode === 'signup' ? t.create : t.login}</p>
                    ) : null}

                    {showForm && mode === 'signup' ? (
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="fm-label">{t.first}</span>
                          <input className="fm-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
                        </label>
                        <label className="block">
                          <span className="fm-label">{t.last}</span>
                          <input className="fm-input" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
                        </label>
                        <label className="block sm:col-span-2">
                          <span className="fm-label">{t.email}</span>
                          <input className="fm-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                        </label>
                        <label className="block sm:col-span-2">
                          <span className="fm-label">{t.phone}</span>
                          <input className="fm-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.phonePlaceholder} autoComplete="tel" />
                          <span className="fm-hint block">{t.phoneHint}</span>
                        </label>
                        <label className="block sm:col-span-2">
                          <span className="fm-label">{t.password}</span>
                          <PasswordInput value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword((v) => !v)} t={t} autoComplete="new-password" />
                          <span className="fm-hint block">{t.passwordHint}</span>
                        </label>
                      </div>
                    ) : null}

                    {showForm && mode === 'login' ? (
                      <div className="mt-4 grid gap-4">
                        <label className="block">
                          <span className="fm-label">{t.email}</span>
                          <input className="fm-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                        </label>
                        <label className="block">
                          <span className="fm-label">{t.password}</span>
                          <PasswordInput value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword((v) => !v)} t={t} autoComplete="current-password" />
                        </label>
                      </div>
                    ) : null}

                    {showForm && mode === 'signup' ? (
                      <label className="mt-5 flex cursor-pointer items-start gap-3 text-[13px] leading-snug text-brand-ink/65">
                        <input type="checkbox" className="peer sr-only" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-luxury-orange/40 ${
                            accept ? 'border-luxury-orange bg-luxury-orange text-white' : 'border-brand-ink/25 bg-white'
                          }`}
                          aria-hidden
                        >
                          {accept ? <Check size={12} strokeWidth={3} /> : null}
                        </span>
                        <span>{t.terms}</span>
                      </label>
                    ) : null}

                    <TurnstileWidget key={turnstileKey} onToken={setToken} locale={lang} />

                    {error ? (
                      <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-800" role="alert">
                        {error}
                      </p>
                    ) : null}

                    <button type="submit" disabled={busy} className="btn-luxury-primary mt-6 w-full !py-4">
                      {busy ? <LoaderCircle size={15} className="animate-spin" aria-hidden /> : <Sparkles size={15} strokeWidth={2.2} aria-hidden />}
                      {session ? t.activateOn(months) : mode === 'login' && showForm ? t.loginActivate(months) : t.activate(months)}
                    </button>
                    {accessEnd && !session && mode === 'signup' && !created ? (
                      <p className="mt-4 text-center text-[12.5px] leading-relaxed text-brand-ink/55">{t.until(fmtDate(accessEnd, lang), monthlyPriceLabel)}</p>
                    ) : null}

                    {showForm ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMode(mode === 'signup' ? 'login' : 'signup');
                          setError(null);
                        }}
                        className="mt-6 w-full rounded-2xl bg-sand px-4 py-3.5 text-center text-[13.5px] text-brand-ink/70 transition-colors hover:bg-[#efe8e0]"
                      >
                        {mode === 'signup' ? t.haveAccount(months) : t.noAccount}
                      </button>
                    ) : null}
                  </form>
                ) : null}
              </>
            )}
          </div>
        </section>
      </main>
      <PublicSiteFooter lang={lang} />
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  t,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  t: Copy;
  autoComplete: string;
}) {
  return (
    <span className="relative block">
      <input className="fm-input pr-12" type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? t.hide : t.show}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-ink/45 hover:text-brand-ink"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </span>
  );
}

function DoneView({ done, lang, monthlyPriceLabel, needsConfirm }: { done: Activated; lang: Lang; monthlyPriceLabel: string; needsConfirm: boolean }) {
  const t = COPY[lang];
  const end = fmtDate(done.accessEndsAt ?? addMonths(done.months), lang);
  const text =
    done.mode === 'balance_credit'
      ? t.doneCredit(
          new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'fr-FR', { style: 'currency', currency: 'EUR' }).format((done.creditCents ?? 0) / 100),
          done.months,
        )
      : done.mode === 'trial_extension'
        ? t.doneExtension(end)
        : t.doneTrial(end, monthlyPriceLabel);
  return (
    <div className="py-4 text-center" role="status">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-50 text-success">
        <Sparkles size={28} aria-hidden />
      </span>
      <h2 className="fm-display mt-5 text-[2.1rem] leading-tight text-brand-ink">{t.doneTitle}</h2>
      <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-brand-ink/70">{text}</p>
      {done.needsReactivation ? <p className="mx-auto mt-4 max-w-sm rounded-2xl bg-[#fff4e5] px-4 py-3 text-[13.5px] text-[#8a5a1f]">{t.reactivate}</p> : null}
      {done.paymentIssue ? <p className="mx-auto mt-4 max-w-sm rounded-2xl bg-[#fff4e5] px-4 py-3 text-[13.5px] text-[#8a5a1f]">{t.paymentIssue}</p> : null}
      {needsConfirm ? <p className="mx-auto mt-4 max-w-sm rounded-2xl bg-sand px-4 py-3 text-[13.5px] text-brand-ink/75">{t.confirmEmail}</p> : null}
      <div className="mt-7 flex flex-col items-center gap-3">
        <Link href={needsConfirm ? '/connexion' : '/compte'} className="btn-luxury-primary">
          {needsConfirm ? t.goLogin : t.go}
        </Link>
        {done.needsReactivation || done.paymentIssue ? (
          <Link href="/compte/profil" className="text-[13px] font-semibold text-luxury-orange">
            {t.billing}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
