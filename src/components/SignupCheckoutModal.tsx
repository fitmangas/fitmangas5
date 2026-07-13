'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, ArrowRight, Lock, ChevronDown } from 'lucide-react';
import type { Course, Language, Segment } from '@/types';
import { detectBrowserLocale, detectBrowserTimeZone, type DetectedLocale } from '@/lib/locale-timezone-detection';
import { createClient } from '@/lib/supabase/client';
import { REF_COOKIE, normalizeReferralCode, isValidReferralCode } from '@/lib/referrals/cookie';

function persistReferralCookie(code: string) {
  const normalized = normalizeReferralCode(code);
  if (!isValidReferralCode(normalized)) return;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${REF_COOKIE}=${encodeURIComponent(normalized)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax${secure}`;
}

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
};

export function SignupCheckoutModal({ course, courseOptions, onSelectCourse, lang, onClose }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formulaMenuOpen, setFormulaMenuOpen] = useState(false);
  const [detectedLocale, setDetectedLocale] = useState<DetectedLocale>('fr');
  const [detectedTimeZone, setDetectedTimeZone] = useState('Europe/Paris');
  const effectiveSegment: Segment = course?.id.startsWith('v-') ? 'VISIO' : 'NANTES';

  useEffect(() => {
    setDetectedLocale(detectBrowserLocale());
    setDetectedTimeZone(detectBrowserTimeZone());
    const fromCookie = readReferralCookie();
    if (fromCookie) setReferralCode(fromCookie);
  }, []);

  useEffect(() => {
    if (!course) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [course]);

  const labels =
    lang === 'FR'
      ? {
          title: 'Réserver',
          subtitle: 'Crée ton compte puis passe au paiement sécurisé.',
          firstName: 'Prénom',
          lastName: 'Nom',
          email: 'E-mail',
          password: 'Mot de passe',
          cta: 'Continuer vers le paiement',
          close: 'Fermer',
          missingSupabase: 'Configuration incomplète. Paiement indisponible pour le moment.',
          referralCode: 'Code parrainage (optionnel)',
          referralHint: 'Si une amie t’a partagé son lien, le code est pré-rempli.',
        }
      : {
          title: 'Reservar',
          subtitle: 'Crea tu cuenta y continúa al pago seguro.',
          firstName: 'Nombre',
          lastName: 'Apellido',
          email: 'Correo',
          password: 'Contraseña',
          cta: 'Continuar al pago',
          close: 'Cerrar',
          missingSupabase: 'Configuración incompleta. Pago no disponible por ahora.',
          referralCode: 'Código de referido (opcional)',
          referralHint: 'Si una amiga compartió su enlace, el código ya está rellenado.',
        };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;
    setError(null);

    if (password.length < 8) {
      setError(lang === 'FR' ? 'Le mot de passe doit contenir au moins 8 caractères.' : 'Mínimo 8 caracteres.');
      return;
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

      if (referralCode.trim()) {
        persistReferralCookie(referralCode);
      }

      void fetch('/api/welcome-email', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: email.trim() }),
      }).catch(() => {});

      const refPayload = referralCode.trim()
        ? { code: referralCode.trim() }
        : undefined;
      if (data.session || refPayload) {
        void fetch('/api/referrals/attach', {
          method: 'POST',
          credentials: 'include',
          headers: refPayload ? { 'Content-Type': 'application/json' } : undefined,
          body: refPayload ? JSON.stringify(refPayload) : undefined,
        }).catch(() => {});
      }

      const checkoutRes = data.session
        ? await fetch('/api/checkout', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId: course.id }),
          })
        : await fetch('/api/checkout/post-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId: course.id, userId, email: email.trim() }),
          });

      const checkoutJson = (await checkoutRes.json()) as { url?: string; error?: string };

      if (!checkoutRes.ok) {
        setError(checkoutJson.error ?? (lang === 'FR' ? 'Paiement indisponible.' : 'Pago no disponible.'));
        return;
      }

      if (checkoutJson.url) {
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-ink/40 p-4"
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
            className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[32px] border border-brand-ink/[0.06] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-title"
          >
            {/* En-tête fixe */}
            <div className="shrink-0 border-b border-brand-ink/[0.06] px-6 pb-5 pt-6 sm:px-8 sm:pt-8">
              <div className="flex items-start justify-between gap-4 pr-8">
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.35em] text-brand-accent">
                    {effectiveSegment === 'VISIO'
                      ? lang === 'FR'
                        ? 'Visio'
                        : 'Online'
                      : 'Nantes'}
                  </p>
                  <h2 id="signup-title" className="font-serif text-2xl italic tracking-tight text-brand-ink">
                    {labels.title}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-brand-ink/50">{labels.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 rounded-full p-2 text-brand-ink/40 transition hover:bg-brand-sand/40 hover:text-brand-ink sm:right-5 sm:top-5"
                  aria-label={labels.close}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.22em] text-brand-ink/40">
                  {lang === 'FR' ? 'Formule' : 'Fórmula'}
                </p>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setFormulaMenuOpen((prev) => !prev)}
                    className="inline-flex max-w-full items-center gap-2 rounded-full border border-brand-ink/10 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-ink/75 transition hover:border-brand-accent/35 hover:text-brand-accent"
                    aria-haspopup="listbox"
                    aria-expanded={formulaMenuOpen}
                  >
                    <span className="truncate">
                      {course.title} — {course.price}
                    </span>
                    <ChevronDown size={13} className={`shrink-0 transition ${formulaMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {formulaMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="absolute left-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-2xl border border-brand-ink/10 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.08)]"
                        role="listbox"
                      >
                        {courseOptions.map((option) => {
                          const isActive = option.id === course.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => {
                                onSelectCourse(option);
                                setFormulaMenuOpen(false);
                              }}
                              className={`flex w-full items-center justify-between gap-4 whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                                isActive
                                  ? 'bg-brand-accent/10 text-brand-accent'
                                  : 'text-brand-ink/70 hover:bg-brand-sand/25 hover:text-brand-ink'
                              }`}
                            >
                              <span className="whitespace-nowrap">{option.title}</span>
                              <span className="whitespace-nowrap text-[10px] normal-case tracking-normal opacity-80">{option.price}</span>
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
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-brand-ink/40">
                      {labels.firstName}
                      <input
                        required
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-brand-ink/[0.08] bg-brand-beige/40 px-4 py-3 text-sm text-brand-ink outline-none ring-brand-accent/30 transition focus:ring-2"
                      />
                    </label>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-brand-ink/40">
                      {labels.lastName}
                      <input
                        required
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-brand-ink/[0.08] bg-brand-beige/40 px-4 py-3 text-sm text-brand-ink outline-none ring-brand-accent/30 transition focus:ring-2"
                      />
                    </label>
                  </div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-brand-ink/40">
                    {labels.email}
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-brand-ink/[0.08] bg-brand-beige/40 px-4 py-3 text-sm text-brand-ink outline-none ring-brand-accent/30 transition focus:ring-2"
                    />
                  </label>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-brand-ink/40">
                    {lang === 'FR' ? 'Date de naissance' : 'Fecha de nacimiento'}
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-brand-ink/[0.08] bg-brand-beige/40 px-4 py-3 text-sm text-brand-ink outline-none ring-brand-accent/30 transition focus:ring-2"
                    />
                  </label>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-brand-ink/40">
                    {labels.referralCode}
                    <input
                      type="text"
                      autoComplete="off"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="EX: MARIE-1234"
                      className="mt-2 w-full rounded-2xl border border-brand-ink/[0.08] bg-brand-beige/40 px-4 py-3 font-mono text-sm uppercase tracking-wide text-brand-ink placeholder:text-brand-ink/25 outline-none ring-brand-accent/30 transition focus:ring-2"
                    />
                    <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal text-brand-ink/45">
                      {labels.referralHint}
                    </span>
                  </label>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-brand-ink/40">
                    <span className="inline-flex items-center gap-1">
                      <Lock size={10} className="opacity-50" />
                      {labels.password}
                    </span>
                    <input
                      required
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-brand-ink/[0.08] bg-brand-beige/40 px-4 py-3 text-sm text-brand-ink outline-none ring-brand-accent/30 transition focus:ring-2"
                    />
                  </label>

                  {error ? (
                    <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">{error}</p>
                  ) : null}
                </div>
              </div>

              {/* Pied fixe */}
              <div className="shrink-0 border-t border-brand-ink/[0.06] bg-white px-6 py-4 sm:px-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-luxury-primary flex w-full items-center justify-center gap-2 py-4 text-[10px] font-bold uppercase tracking-[0.25em] disabled:opacity-60"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                  {labels.cta}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
