'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, ArrowRight, Lock } from 'lucide-react';
import type { Course, Language, Segment } from '@/types';
import { createClient } from '@/lib/supabase/client';

type Props = {
  course: Course | null;
  segment: Segment;
  lang: Language;
  onClose: () => void;
};

export function SignupCheckoutModal({ course, segment, lang, onClose }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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
          fallbackPay: 'Payer avec le lien Stripe (secours)',
          needConfirm:
            'Compte créé. Confirme ton e-mail pour activer la session, puis reconnecte-toi et clique à nouveau sur Réserver pour payer.',
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
          fallbackPay: 'Pagar con enlace Stripe (respaldo)',
          needConfirm:
            'Cuenta creada. Confirma tu correo para activar la sesión; luego vuelve a iniciar sesión y pulsa Reservar para pagar.',
        };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;
    setError(null);
    setInfo(null);

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
        window.open(course.stripeUrl, '_blank', 'noopener,noreferrer');
        setInfo(
          lang === 'FR'
            ? 'Supabase n’est pas configuré : ouverture du lien de paiement Stripe direct.'
            : 'Supabase no configurado: abriendo el enlace de pago Stripe.',
        );
        return;
      }

      const supabase = createClient();
      const origin = window.location.origin;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/compte`,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            ...(birthDate.trim() ? { birth_date: birthDate.trim() } : {}),
            segment,
            preferred_course_id: course.id,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.session) {
        setInfo(labels.needConfirm);
        return;
      }

      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id }),
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

  function openFallbackStripe() {
    if (course?.stripeUrl) {
      window.open(course.stripeUrl, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <AnimatePresence>
      {course && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-brand-ink/40 p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-md rounded-t-[32px] border border-brand-ink/[0.06] bg-white shadow-2xl sm:rounded-[32px]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-title"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-brand-ink/40 transition hover:bg-brand-sand/40 hover:text-brand-ink"
              aria-label={labels.close}
            >
              <X size={18} />
            </button>

            <div className="border-b border-brand-ink/[0.06] px-8 pb-6 pt-8">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.35em] text-brand-accent">
                {segment === 'VISIO'
                  ? lang === 'FR'
                    ? 'Visio'
                    : 'Online'
                  : 'Nantes'}
              </p>
              <h2 id="signup-title" className="font-serif text-2xl italic tracking-tight text-brand-ink">
                {labels.title}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-brand-ink/50">{labels.subtitle}</p>
              <p className="mt-3 font-medium text-brand-ink">{course.title}</p>
              <p className="text-sm text-brand-accent">{course.price}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-8 py-8">
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
                {lang === 'FR' ? 'Date de naissance (optionnel)' : 'Fecha de nacimiento (opcional)'}
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-brand-ink/[0.08] bg-brand-beige/40 px-4 py-3 text-sm text-brand-ink outline-none ring-brand-accent/30 transition focus:ring-2"
                />
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

              {error && (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">{error}</p>
              )}
              {info && (
                <p className="rounded-2xl border border-brand-accent/20 bg-brand-sand/30 px-4 py-3 text-xs text-brand-ink/80">
                  {info}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-accent py-4 text-[10px] font-bold uppercase tracking-[0.25em] text-white shadow-lg transition hover:opacity-95 disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                {labels.cta}
              </button>

              <button
                type="button"
                onClick={openFallbackStripe}
                className="w-full text-center text-[10px] uppercase tracking-widest text-brand-ink/35 underline-offset-4 hover:text-brand-accent hover:underline"
              >
                {labels.fallbackPay}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
