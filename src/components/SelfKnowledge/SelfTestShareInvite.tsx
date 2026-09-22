'use client';

import { useCallback, useState } from 'react';

import type { SelfTestLang } from '@/lib/self-knowledge/types';

type Props = {
  locale: SelfTestLang;
  firstName?: string | null;
  /** Requis pour journaliser le consentement d’invitation */
  inviterEmail?: string | null;
};

/**
 * Parrainage optionnel — PDF jamais bloqué.
 * Voie principale = lien de partage (RGPD-safe).
 * Email amie = envoi unique, aucune relance vers l’amie.
 */
export function SelfTestShareInvite({ locale, firstName, inviterEmail }: Props) {
  const fr = locale === 'fr';
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const emailOk = Boolean(inviterEmail?.trim());

  const ensureShareLink = useCallback(async () => {
    if (shareUrl) return shareUrl;
    if (!inviterEmail?.trim()) {
      setStatus(fr ? 'Email invitante manquant.' : 'Falta el email de quien invita.');
      return null;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/self-knowledge/invite/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          inviterEmail: inviterEmail.trim(),
          inviterFirstName: firstName ?? undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        shareUrl?: string;
        url?: string;
        error?: string;
      };
      if (!res.ok || !(data.shareUrl || data.url)) {
        setStatus(data.error ?? (fr ? 'Lien indisponible.' : 'Enlace no disponible.'));
        return null;
      }
      const url = (data.shareUrl ?? data.url)!;
      setShareUrl(url);
      return url;
    } finally {
      setBusy(false);
    }
  }, [firstName, fr, inviterEmail, locale, shareUrl]);

  async function copyLink() {
    const url = await ensureShareLink();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setStatus(fr ? 'Lien copié.' : 'Enlace copiado.');
    } catch {
      setStatus(url);
    }
  }

  async function shareWhatsApp() {
    const url = await ensureShareLink();
    if (!url) return;
    const text = fr
      ? `Je viens de faire un test de connaissance de soi sur FitMangas — regarde : ${url}`
      : `Acabo de hacer un test de conocimiento propio en FitMangas — mira: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  async function sendEmailInvite(e: React.FormEvent) {
    e.preventDefault();
    const invitee = email.trim();
    if (!invitee || !inviterEmail?.trim()) return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/self-knowledge/invite/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          inviterEmail: inviterEmail.trim(),
          inviterFirstName: firstName ?? undefined,
          inviteeEmail: invitee,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setStatus(
          data.error ??
            (fr
              ? 'Invitation déjà envoyée à cette adresse, ou envoi impossible.'
              : 'Invitación ya enviada a esta dirección, o envío imposible.'),
        );
        return;
      }
      setStatus(
        fr
          ? 'Invitation envoyée une seule fois — sans relance à ton amie.'
          : 'Invitación enviada una sola vez — sin recordatorio a tu amiga.',
      );
      setEmail('');
    } finally {
      setBusy(false);
    }
  }

  if (!emailOk) return null;

  return (
    <aside
      className="w-full max-w-lg rounded-[24px] border border-[#c45d3e]/15 bg-[#FFFAF5] p-5 text-center"
      data-testid="self-test-share-invite"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e]">
        {fr ? 'Bonus optionnel' : 'Bonus opcional'}
      </p>
      <h3 className="mt-2 font-serif text-[1.25rem] italic text-brand-ink">
        {fr ? 'Invite une amie — débloque un bonus' : 'Invita a una amiga — desbloquea un bonus'}
      </h3>
      <p className="mt-2 text-[12.5px] leading-relaxed text-brand-ink/55">
        {fr
          ? 'Ton PDF est libre. Le partage est optionnel : tu envoies le lien toi-même (WhatsApp / copier). Aucune relance automatique vers ton amie.'
          : 'Tu PDF es libre. El compartir es opcional: tú envías el enlace (WhatsApp / copiar). Ningún recordatorio automático a tu amiga.'}
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          data-testid="invite-whatsapp"
          disabled={busy}
          onClick={() => void shareWhatsApp()}
          className="rounded-full bg-[#c45d3e] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-60"
        >
          WhatsApp
        </button>
        <button
          type="button"
          data-testid="invite-copy"
          disabled={busy}
          onClick={() => void copyLink()}
          className="rounded-full border border-brand-ink/15 bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-ink/70 disabled:opacity-60"
        >
          {fr ? 'Copier le lien' : 'Copiar enlace'}
        </button>
      </div>

      <form className="mt-4 space-y-2" onSubmit={(e) => void sendEmailInvite(e)}>
        <label className="block text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-ink/45">
          {fr ? 'Ou invitation email (1 seule fois)' : 'O invitación email (1 sola vez)'}
          <input
            type="email"
            data-testid="invite-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            placeholder={fr ? 'email de ton amie' : 'email de tu amiga'}
            className="mt-1.5 w-full rounded-xl border border-brand-ink/10 bg-white px-3 py-2.5 text-[13px] outline-none ring-[#c45d3e]/20 focus:ring-2"
          />
        </label>
        <button
          type="submit"
          data-testid="invite-email-submit"
          disabled={busy || !email.trim()}
          className="w-full rounded-full border border-[#c45d3e]/25 bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#c45d3e] disabled:opacity-50"
        >
          {fr ? 'Envoyer l’invitation' : 'Enviar la invitación'}
        </button>
      </form>

      {status ? (
        <p className="mt-3 text-[12px] text-brand-ink/55" role="status">
          {status}
        </p>
      ) : null}
    </aside>
  );
}
