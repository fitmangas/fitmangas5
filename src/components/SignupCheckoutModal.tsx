'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Lock, ChevronDown, Ticket, Eye, EyeOff } from 'lucide-react';
import type { Course, Language, Segment } from '@/types';
import { detectBrowserLocale, detectBrowserTimeZone, type DetectedLocale } from '@/lib/locale-timezone-detection';
import { createClient } from '@/lib/supabase/client';
import { REF_COOKIE } from '@/lib/referrals/cookie';
import { trackBeginCheckout } from '@/lib/analytics/ga4-client';
import { COURSE_PRICE_CENTS } from '@/lib/checkout-courses';
import { isProgrammesEnabled } from '@/lib/programmes/flag';

function readReferralCookie(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${REF_COOKIE}=([^;]*)`));
  if (!match?.[1]) return '';
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

type Props = {
  course: Course | null;
  courseOptions: Course[];
  onSelectCourse: (course: Course) => void;
  lang: Language;
  onClose: () => void;
  /** « Déjà un compte ? » : ouvre la connexion (sinon lien vers /?compte=connexion-requise). */
  onLogin?: () => void;
};

export function SignupCheckoutModal({ course, courseOptions, onSelectCourse, lang, onClose, onLogin }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [offerCode, setOfferCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formulaMenuOpen, setFormulaMenuOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [immediateAccess, setImmediateAccess] = useState(false);
  const [detectedLocale, setDetectedLocale] = useState<DetectedLocale>('fr');
  const [detectedTimeZone, setDetectedTimeZone] = useState('Europe/Paris');
  const visioOnlyOptions = courseOptions.filter((option) => option.id.startsWith('v-'));
  const effectiveSegment: Segment = 'VISIO';
  const isIndividuel = course?.id === 'v-ind';

  useEffect(() => {
    setDetectedLocale(detectBrowserLocale());
    setDetectedTimeZone(detectBrowserTimeZone());
    const fromCookie = readReferralCookie();
    if (fromCookie) setOfferCode(fromCookie);
  }, []);

  useEffect(() => {
    if (!course) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [course]);

  const programmes = isProgrammesEnabled();
  const labels =
    lang === 'FR'
      ? {
          title: 'Commence ton essai gratuit',
          subtitle: 'Des lives avec Alejandra, qui te voit et te corrige en direct. Tu ne paies rien aujourd’hui.',
          firstName: 'Prénom',
          lastName: 'Nom',
          email: 'Email',
          password: 'Mot de passe',
          cta: 'Je commence mon essai',
          close: 'Fermer',
          missingSupabase: 'Configuration incomplète. Paiement indisponible pour le moment.',
          offerCode: 'J’ai un code (promo, parrainage ou cadeau)',
          phone: 'Téléphone',
          phoneHint: 'Pour te joindre en cas de souci avec ton inscription.',
          birthDate: 'Date d’anniversaire (facultatif)',
          birthHint: 'Pour une petite attention le jour J (jour et mois seulement).',
          legal: '0 € aujourd’hui · 7 jours gratuits, puis {price}',
          legalSub: 'Carte demandée · Annulable en ligne en 3 clics',
          passwordHint: '8 caractères minimum.',
          showPassword: 'Afficher le mot de passe',
          hidePassword: 'Masquer le mot de passe',
          optional: '(facultatif)',
          birthLabel: 'Date d’anniversaire',
          secure: 'Paiement sécurisé Stripe',
          already: 'Déjà un compte ?',
          consentA: 'En continuant, tu acceptes les ',
          cgv: 'CGV',
          consentB: ' et tu confirmes avoir lu la ',
          privacy: 'politique de confidentialité',
          kicker: 'Essai gratuit · 7 jours',
          planCollectif: programmes ? 'Lives FR + bonus ES, replays, programmes, vidéothèque' : 'Lives FR + bonus ES, replays, vidéothèque',
          planIndividuel: '5 cours individuels par mois + les lives collectifs',
          change: 'Changer',
          immediate: 'Je demande à commencer tout de suite. Si je me rétracte dans les 14 jours, seule la période déjà utilisée me sera facturée.',
        }
      : {
          title: 'Empieza tu prueba gratis',
          subtitle: 'Clases en vivo con Alejandra, que te ve y te corrige en directo. Hoy no pagas nada.',
          firstName: 'Nombre',
          lastName: 'Apellido',
          email: 'Correo',
          password: 'Contraseña',
          cta: 'Empiezo mi prueba',
          close: 'Cerrar',
          missingSupabase: 'Configuración incompleta. Pago no disponible por ahora.',
          offerCode: 'Tengo un código (promoción, referido o regalo)',
          phone: 'Teléfono',
          phoneHint: 'Para contactarte si hay algún problema con tu inscripción.',
          birthDate: 'Cumpleaños (opcional)',
          birthHint: 'Para un detalle especial en tu cumpleaños (día y mes).',
          legal: '0 € hoy · 7 días gratis, luego {price}',
          legalSub: 'Se pide tarjeta · Cancelas en línea en 3 clics',
          passwordHint: 'Mínimo 8 caracteres.',
          showPassword: 'Mostrar la contraseña',
          hidePassword: 'Ocultar la contraseña',
          optional: '(opcional)',
          birthLabel: 'Cumpleaños',
          secure: 'Pago seguro con Stripe',
          already: '¿Ya tienes cuenta?',
          consentA: 'Al continuar, aceptas las ',
          cgv: 'condiciones de venta',
          consentB: ' y confirmas haber leído la ',
          privacy: 'política de privacidad',
          kicker: 'Prueba gratis · 7 días',
          planCollectif: programmes ? 'Lives en francés + bonus en español, replays, programas, videoteca' : 'Lives en francés + bonus en español, replays, videoteca',
          planIndividuel: '5 clases individuales al mes + los lives grupales',
          change: 'Cambiar',
          immediate: 'Pido empezar de inmediato. Si desisto en los 14 días, solo se me cobrará el periodo ya utilizado.',
        };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;
    setError(null);

    if (password.length < 8) {
      setError(lang === 'FR' ? 'Le mot de passe doit contenir au moins 8 caractères.' : 'Mínimo 8 caracteres.');
      return;
    }

    if (!phone.trim()) {
      setError(lang === 'FR' ? 'Indique ton numéro de téléphone.' : 'Indica tu número de teléfono.');
      return;
    }

    if (isIndividuel && !immediateAccess) {
      setError(lang === 'FR' ? 'Coche la case pour commencer tout de suite.' : 'Marca la casilla para empezar de inmediato.');
      return;
    }

    if (offerCode.trim()) {
      try {
        const res = await fetch('/api/gifts/resolve-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: offerCode.trim() }),
        });
        const json = (await res.json()) as { resolved?: { kind?: string; code?: string } };
        if (json.resolved?.kind === 'gift' && json.resolved.code) {
          window.location.href = `/offrir/activer?code=${encodeURIComponent(json.resolved.code)}`;
          return;
        }
      } catch {
        /* continue checkout */
      }
    }

    setLoading(true);
    try {
      const supabaseConfigured =
        typeof window !== 'undefined' &&
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseConfigured) {
        setError(labels.missingSupabase);
        return;
      }

      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            ...(birthDate.trim() ? { birth_date: birthDate.trim() } : {}),
            phone: phone.trim(),
            preferred_locale: detectedLocale,
            display_timezone: detectedTimeZone,
            segment: effectiveSegment,
            preferred_course_id: course.id,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setError(lang === 'FR' ? 'Compte créé mais identifiant manquant. Réessaie ou connecte-toi.' : 'Cuenta creada sin ID. Reintenta o inicia sesión.');
        return;
      }

      // Le cookie de parrainage vient du lien partagé ; le champ unique est résolu côté serveur
      // (promo vs parrainage). On n’écrase pas le cookie avec un éventuel code promo.
      void fetch('/api/welcome-email', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: email.trim() }),
      }).catch(() => {});

      if (data.session || offerCode.trim()) {
        void fetch('/api/referrals/attach', {
          method: 'POST',
          credentials: 'include',
          headers: offerCode.trim() ? { 'Content-Type': 'application/json' } : undefined,
          body: offerCode.trim() ? JSON.stringify({ code: offerCode.trim() }) : undefined,
        }).catch(() => {});
      }

      const checkoutBody: {
        courseId: string;
        offerCode?: string;
        firstName: string;
        lastName: string;
        phone: string;
      } = {
        courseId: course.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      };
      if (offerCode.trim()) checkoutBody.offerCode = offerCode.trim().toUpperCase();

      const checkoutRes = data.session
        ? await fetch('/api/checkout', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(checkoutBody),
          })
        : await fetch('/api/checkout/post-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...checkoutBody, userId, email: email.trim() }),
          });

      const checkoutJson = (await checkoutRes.json()) as { url?: string; error?: string };

      if (!checkoutRes.ok) {
        setError(checkoutJson.error ?? (lang === 'FR' ? 'Paiement indisponible.' : 'Pago no disponible.'));
        return;
      }

      if (checkoutJson.url) {
        const catalogueEur = COURSE_PRICE_CENTS[course.id] != null ? COURSE_PRICE_CENTS[course.id] / 100 : undefined;
        trackBeginCheckout({
          courseId: course.id,
          value: catalogueEur,
          currency: 'EUR',
        });
        window.location.href = checkoutJson.url;
        return;
      }

      setError(lang === 'FR' ? 'URL de paiement manquante.' : 'Falta la URL de pago.');
    } catch {
      setError(lang === 'FR' ? 'Une erreur est survenue.' : 'Ha ocurrido un error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {course && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-[rgba(29,26,23,0.45)] backdrop-blur-[5px] md:items-center md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative flex max-h-[96vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-[0_40px_100px_-20px_rgba(29,26,23,0.55)] md:rounded-[2rem]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-title"
          >
            <div className="shrink-0 px-6 pb-4 pt-6 md:px-8 md:pt-7">
              <span className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-black/15 md:hidden" />
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-brand-ink/45 hover:bg-black/[0.04]"
                aria-label={labels.close}
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/landing/alejandra-avatar.jpg"
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full object-cover object-top shadow ring-2 ring-white"
                />
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-luxury-orange">{labels.kicker}</p>
              </div>
              <h2 id="signup-title" className="fm-display mt-4 text-[2rem] leading-[1.05] text-brand-ink">
                {labels.title}
              </h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-brand-ink/60">{labels.subtitle}</p>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-brand-ink/10 bg-sand/60 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-brand-ink">{course.title}</p>
                  <p className="text-[12px] text-brand-ink/55">{isIndividuel ? labels.planIndividuel : labels.planCollectif}</p>
                </div>
                <div className="relative shrink-0 text-right">
                  <p className="text-[13.5px] font-semibold text-brand-ink">{course.price}</p>
                  {visioOnlyOptions.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setFormulaMenuOpen((prev) => !prev)}
                      className="text-[11.5px] font-semibold text-luxury-orange"
                      aria-haspopup="listbox"
                      aria-expanded={formulaMenuOpen}
                    >
                      {labels.change}
                      <ChevronDown size={12} className="ml-0.5 inline" />
                    </button>
                  ) : null}
                  <AnimatePresence>
                    {formulaMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="absolute right-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-2xl border border-brand-ink/10 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.08)]"
                        role="listbox"
                      >
                        {visioOnlyOptions.map((option) => {
                          const isActive = option.id === course.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              role="option"
                              aria-selected={isActive}
                              onClick={() => {
                                onSelectCourse(option);
                                setFormulaMenuOpen(false);
                              }}
                              className={`flex w-full items-center justify-between gap-4 whitespace-nowrap px-4 py-3 text-left text-[12px] font-semibold transition ${
                                isActive
                                  ? 'bg-brand-accent/10 text-brand-accent'
                                  : 'text-brand-ink/70 hover:bg-brand-sand/25 hover:text-brand-ink'
                              }`}
                            >
                              <span className="whitespace-nowrap">{option.title}</span>
                              <span className="whitespace-nowrap text-xs font-normal opacity-80">{option.price}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              {/* Corps scrollable */}
              <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 md:px-8">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="fm-label">{labels.firstName}</span>
                    <input
                      required
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="fm-input outline-none focus:border-luxury-orange focus:ring-4 focus:ring-luxury-orange/10"
                    />
                  </label>
                  <label className="block">
                    <span className="fm-label">{labels.lastName}</span>
                    <input
                      required
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="fm-input outline-none focus:border-luxury-orange focus:ring-4 focus:ring-luxury-orange/10"
                    />
                  </label>
                </div>
                <label className="mt-3 block">
                  <span className="fm-label">{labels.email}</span>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="fm-input outline-none focus:border-luxury-orange focus:ring-4 focus:ring-luxury-orange/10"
                  />
                </label>
                <label className="mt-3 block">
                  <span className="fm-label">{labels.phone}</span>
                  <input
                    required
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={lang === 'FR' ? '06 12 34 56 78' : '55 1234 5678'}
                    className="fm-input outline-none focus:border-luxury-orange focus:ring-4 focus:ring-luxury-orange/10"
                  />
                  <span className="fm-hint block">{labels.phoneHint}</span>
                </label>
                <label className="mt-3 block">
                  <span className="fm-label">{labels.password}</span>
                  <span className="relative block">
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="fm-input pr-12 outline-none focus:border-luxury-orange focus:ring-4 focus:ring-luxury-orange/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-brand-ink/40 hover:text-brand-ink/70"
                      aria-label={showPassword ? labels.hidePassword : labels.showPassword}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </span>
                  <span className="fm-hint block">{labels.passwordHint}</span>
                </label>
                <label className="mt-3 block">
                  <span className="fm-label">
                    {labels.birthLabel} <span className="font-normal text-brand-ink/45">{labels.optional}</span>
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder={lang === 'FR' ? 'jj / mm' : 'dd / mm'}
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="fm-input outline-none focus:border-luxury-orange focus:ring-4 focus:ring-luxury-orange/10"
                  />
                  <span className="fm-hint block">{labels.birthHint}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setCodeOpen((v) => !v)}
                  className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-brand-ink/70"
                  aria-expanded={codeOpen}
                >
                  <Ticket size={16} className="text-luxury-orange" />
                  {labels.offerCode}
                </button>
                {codeOpen ? (
                  <input
                    type="text"
                    autoComplete="off"
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                    aria-label={labels.offerCode}
                    className="fm-input mt-2 font-mono uppercase tracking-wide outline-none focus:border-luxury-orange focus:ring-4 focus:ring-luxury-orange/10"
                  />
                ) : null}
                {isIndividuel ? (
                  <label className="mt-4 flex items-start gap-3 text-[13px] leading-relaxed text-brand-ink/80">
                    <input type="checkbox" checked={immediateAccess} onChange={(e) => setImmediateAccess(e.target.checked)} className="mt-1 accent-[#c45d3e]" />
                    {labels.immediate}
                  </label>
                ) : null}

                {error ? (
                  <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800" role="alert">
                    {error}
                  </p>
                ) : null}
                <div className="h-3" aria-hidden />
              </div>

              {/* Pied fixe */}
              <div className="shrink-0 border-t border-brand-ink/[0.06] px-6 pb-6 pt-4 md:px-8">
                <button type="submit" disabled={loading} className="btn-luxury-primary flex w-full items-center justify-center gap-2 !py-4 !text-[12px] disabled:opacity-60">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                  {labels.cta}
                </button>
                <p className="mt-3 text-center text-[12.5px] font-medium leading-relaxed text-brand-ink/70">
                  {labels.legal.replace('{price}', course.price)}
                  <br />
                  <span className="font-normal text-brand-ink/50">{labels.legalSub}</span>
                </p>
                <div className="mt-3 flex items-center justify-center gap-4 text-[12px] text-brand-ink/45">
                  <span className="inline-flex items-center gap-1.5">
                    <Lock size={13} aria-hidden />
                    {labels.secure}
                  </span>
                  {onLogin ? (
                    <button type="button" onClick={onLogin} className="underline underline-offset-2 hover:text-brand-ink/70">
                      {labels.already}
                    </button>
                  ) : (
                    <a href="/connexion" className="underline underline-offset-2 hover:text-brand-ink/70">
                      {labels.already}
                    </a>
                  )}
                </div>
                <p className="mt-2 text-center text-[11px] leading-snug text-brand-ink/40">
                  {labels.consentA}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline">
                    {labels.cgv}
                  </a>
                  {labels.consentB}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                    {labels.privacy}
                  </a>
                  .
                </p>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
