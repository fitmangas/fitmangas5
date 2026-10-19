'use client';

import { useEffect, useState } from 'react';
import { CircleCheck, Gift, Sparkles } from 'lucide-react';

import { GiftCardVisual } from './GiftCardVisual';
import { TurnstileWidget } from '@/components/Security/TurnstileWidget';

export function ActivateGiftClient({
  preview,
  initialCode,
}: {
  preview?: boolean;
  initialCode?: string;
}) {
  const [code, setCode] = useState(initialCode || (preview ? 'FM-7K2Q-9XW4' : ''));
  const [firstName, setFirstName] = useState(preview ? 'Julie' : '');
  const [lastName, setLastName] = useState(preview ? 'Martin' : '');
  const [email, setEmail] = useState(preview ? 'julie.m@exemple.fr' : '');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [accept, setAccept] = useState(preview);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (initialCode && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      window.history.replaceState({}, '', url.pathname);
    }
  }, [initialCode]);

  async function activate() {
    if (preview) {
      setOk(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/gifts/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, firstName, lastName, email, phone, password, accept, turnstileToken: token }),
      });
      const json = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setError(json.error || 'Activation impossible pour le moment.');
        setBusy(false);
        return;
      }
      setOk(true);
    } catch {
      setError('Activation impossible pour le moment.');
    }
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-brand-beige text-brand-ink">
      <main className="mx-auto max-w-6xl px-5 pb-10 md:px-8">
        <section className="grid items-start gap-10 pt-10 md:grid-cols-[1fr_1fr] md:gap-14 md:pt-16">
          <div className="md:sticky md:top-28">
            <p className="fm-kicker fm-kicker--orange">Activer ton cadeau</p>
            <h1 className="fm-display mt-4 text-[2.4rem] leading-[1.05] md:text-[3.4rem]">Julie, ton cadeau t&apos;attend.</h1>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-brand-ink/65">Crée ton compte en 1 minute : tes 3 mois commencent tout de suite. Aucune carte bancaire.</p>
            <div className="mt-8 max-w-[440px]">
              <GiftCardVisual months={3} from="Sandrine" to="Julie" code="FM-7K2Q-9XW4" />
            </div>
          </div>
          <div className="rounded-[1.75rem] bg-white p-6 shadow-[0_24px_60px_-20px_rgba(29,26,23,0.28)] md:p-8">
            {ok ? (
              <p className="text-[16px] font-semibold text-success">Tes mois sont activés. Tu peux rejoindre tes lives depuis ton espace.</p>
            ) : (
              <>
                <label className="block">
                  <span className="fm-label">Code cadeau</span>
                  <span className="relative block">
                    <input className="fm-input pr-11 font-mono tracking-[0.12em]" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" data-hj-suppress />
                    <CircleCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-success" size={18} />
                  </span>
                </label>
                <p className="mt-2 inline-flex items-center gap-2 rounded-xl bg-success-50 px-3 py-2 text-[12.5px] font-medium text-success">
                  <Gift size={14} /> Code cadeau — les mois commencent à l&apos;activation
                </p>
                <div className="my-6 h-px bg-brand-ink/[0.07]" />
                <p className="text-[16px] font-semibold">Crée ton compte</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="fm-label">Prénom</span>
                    <input className="fm-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </label>
                  <label className="block">
                    <span className="fm-label">Nom</span>
                    <input className="fm-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="fm-label">Email</span>
                    <input className="fm-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="fm-label">Téléphone</span>
                    <input className="fm-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12 34 56 78" />
                    <span className="fm-hint block">Pour te joindre en cas de souci avec ton accès.</span>
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="fm-label">Mot de passe</span>
                    <input className="fm-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <span className="fm-hint block">8 caractères minimum.</span>
                  </label>
                </div>
                <label className="mt-5 flex items-start gap-3 text-[13px] leading-snug text-brand-ink/65">
                  <input type="checkbox" className="mt-0.5 h-5 w-5" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
                  <span>
                    J&apos;accepte les <a href="/terms" className="underline">conditions générales</a>. En continuant, tu confirmes avoir lu la{' '}
                    <a href="/privacy" className="underline">politique de confidentialité</a>.
                  </span>
                </label>
                <div className="mt-4">
                  <TurnstileWidget onToken={setToken} />
                </div>
                {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
                <button type="button" disabled={busy || !accept} onClick={() => void activate()} className="btn-luxury-primary mt-6 w-full !py-4">
                  <Sparkles size={15} /> Activer mes mois
                </button>
                <p className="mt-4 text-center text-[12.5px] text-brand-ink/55">Ensuite, rien n&apos;est prélevé : tu choisiras de continuer (39 €/mois) ou non.</p>
                <div className="mt-6 rounded-2xl bg-sand px-4 py-3 text-center text-[13px] text-brand-ink/70">
                  Déjà un compte ? <a href="/connexion" className="font-semibold text-luxury-orange">Connecte-toi</a> pour ajouter tes mois.
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
