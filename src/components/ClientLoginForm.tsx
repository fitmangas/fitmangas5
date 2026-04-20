'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, LogIn } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

export function ClientLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace('/compte');
      router.refresh();
    } catch {
      setError('Connexion impossible pour le moment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-[32px] border border-brand-ink/[0.08] bg-white p-8 shadow-[0_10px_40px_rgba(0,0,0,0.05)] sm:p-10">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.35em] text-brand-accent">Compte client</p>
      <h1 className="mb-3 font-serif text-3xl italic text-brand-ink">Se connecter</h1>
      <p className="mb-6 text-sm text-brand-ink/55">
        Accède à ton espace client, tes replays et ton calendrier.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-[9px] font-bold uppercase tracking-widest text-brand-ink/45">
          E-mail
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-brand-ink/[0.08] bg-brand-beige/40 px-4 py-3 text-sm outline-none ring-brand-accent/30 transition focus:ring-2"
          />
        </label>

        <label className="block text-[9px] font-bold uppercase tracking-widest text-brand-ink/45">
          Mot de passe
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-brand-ink/[0.08] bg-brand-beige/40 px-4 py-3 text-sm outline-none ring-brand-accent/30 transition focus:ring-2"
          />
        </label>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-accent py-4 text-[10px] font-bold uppercase tracking-[0.25em] text-white shadow-lg transition hover:opacity-95 disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
          Se connecter
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/" className="text-[10px] uppercase tracking-widest text-brand-ink/40 hover:text-brand-accent">
          Retour au site
        </Link>
      </div>
    </div>
  );
}
