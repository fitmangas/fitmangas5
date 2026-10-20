'use client';

import { Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type AdminMfaStep =
  | { kind: 'loading' }
  | { kind: 'enroll'; factorId: string; qrCode: string; secret: string }
  | { kind: 'challenge'; factorId: string }
  | { kind: 'error'; message: string };

/** `preview` : aperçu de développement uniquement — aucun appel Supabase. */
export function AdminMfaClient({ email, preview }: { email: string; preview?: AdminMfaStep }) {
  const router = useRouter();
  const [step, setStep] = useState<AdminMfaStep>(preview ?? { kind: 'loading' });
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (preview) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (cancelled) return;
      if (listError) {
        setStep({ kind: 'error', message: `Lecture des facteurs impossible : ${listError.message}` });
        return;
      }
      const verified = data?.totp?.find((f) => f.status === 'verified');
      if (verified) {
        setStep({ kind: 'challenge', factorId: verified.id });
        return;
      }
      for (const stale of data?.all ?? []) {
        if (stale.factor_type === 'totp' && stale.status === 'unverified') {
          await supabase.auth.mfa.unenroll({ factorId: stale.id });
        }
      }
      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `FitMangas admin ${new Date().toISOString()}`,
      });
      if (cancelled) return;
      if (enrollError || !enrolled) {
        setStep({ kind: 'error', message: `Enrôlement impossible : ${enrollError?.message ?? 'réponse vide'}` });
        return;
      }
      setStep({ kind: 'enroll', factorId: enrolled.id, qrCode: enrolled.totp.qr_code, secret: enrolled.totp.secret });
    })();
    return () => {
      cancelled = true;
    };
  }, [preview]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (step.kind !== 'enroll' && step.kind !== 'challenge') return;
    setBusy(true);
    setError('');
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: step.factorId,
      code: code.replace(/\s/g, ''),
    });
    setBusy(false);
    if (verifyError) {
      setError('Code incorrect ou expiré. Saisis le code à 6 chiffres affiché maintenant dans ton application.');
      return;
    }
    router.replace('/admin');
    router.refresh();
  }

  return (
    <div className="glass-card w-full max-w-md rounded-[1.75rem] p-8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-luxury-orange" aria-hidden />
        <h1 className="text-lg font-semibold text-luxury-ink">Double authentification</h1>
      </div>
      <p className="mt-2 text-sm text-luxury-muted">{email}</p>

      {step.kind === 'loading' ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-luxury-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Chargement…
        </p>
      ) : null}

      {step.kind === 'error' ? <p className="mt-6 text-sm text-red-700">{step.message}</p> : null}

      {step.kind === 'enroll' ? (
        <div className="mt-6 space-y-3 text-sm text-luxury-ink">
          <p>
            1. Ouvre une application d’authentification (Google Authenticator, 1Password, Authy…) et scanne ce code.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={step.qrCode} alt="QR code de double authentification" className="mx-auto h-44 w-44 rounded-xl bg-white p-2" />
          <p className="text-xs text-luxury-muted">
            Impossible de scanner ? Clé à saisir : <code className="break-all font-mono">{step.secret}</code>
          </p>
          <p>2. Saisis le code à 6 chiffres affiché.</p>
        </div>
      ) : null}

      {step.kind === 'challenge' ? (
        <p className="mt-6 text-sm text-luxury-ink">Saisis le code à 6 chiffres de ton application d’authentification.</p>
      ) : null}

      {step.kind === 'enroll' || step.kind === 'challenge' ? (
        <form onSubmit={verify} className="mt-4 space-y-3">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,7}"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-center font-mono text-lg tracking-[0.4em] text-luxury-ink outline-none ring-luxury-orange/30 focus:ring-2"
            aria-label="Code à 6 chiffres"
          />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button type="submit" disabled={busy} className="btn-luxury-primary w-full min-h-[46px] disabled:opacity-60">
            {busy ? 'Vérification…' : 'Valider'}
          </button>
        </form>
      ) : null}
    </div>
  );
}
