'use client';

import { MessageCircle, X } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';

import { submitSupportTicketAction, type SupportTicketType } from '@/app/compte/support-actions';

type Props = {
  lang?: 'fr' | 'es' | 'en';
};

const copy = {
  fr: {
    aria: 'Besoin d’aide',
    title: 'Besoin d’aide ?',
    typeLabel: 'Type de demande',
    messageLabel: 'Décris ton problème',
    placeholder: 'Explique ce qui se passe, sur quelle page, et depuis quand…',
    send: 'Envoyer',
    sending: 'Envoi…',
    close: 'Fermer',
    success: 'Merci ! Ton message a bien été envoyé.',
    types: {
      bug: 'Bug technique',
      question: 'Question',
      suggestion: 'Suggestion',
      other: 'Autre',
    } as Record<SupportTicketType, string>,
  },
  es: {
    aria: 'Necesito ayuda',
    title: '¿Necesitas ayuda?',
    typeLabel: 'Tipo de solicitud',
    messageLabel: 'Describe tu problema',
    placeholder: 'Explica qué ocurre, en qué página y desde cuándo…',
    send: 'Enviar',
    sending: 'Enviando…',
    close: 'Cerrar',
    success: '¡Gracias! Tu mensaje se ha enviado correctamente.',
    types: {
      bug: 'Error técnico',
      question: 'Pregunta',
      suggestion: 'Sugerencia',
      other: 'Otro',
    } as Record<SupportTicketType, string>,
  },
  en: {
    aria: 'Get help',
    title: 'Need help?',
    typeLabel: 'Request type',
    messageLabel: 'Describe your issue',
    placeholder: 'What happened, which page, and since when…',
    send: 'Send',
    sending: 'Sending…',
    close: 'Close',
    success: 'Thanks! Your message was sent.',
    types: {
      bug: 'Technical bug',
      question: 'Question',
      suggestion: 'Suggestion',
      other: 'Other',
    } as Record<SupportTicketType, string>,
  },
};

export function SupportFloatingButton({ lang = 'fr' }: Props) {
  const t = copy[lang === 'es' ? 'es' : lang === 'en' ? 'en' : 'fr'];
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<SupportTicketType>('question');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await submitSupportTicketAction(type, message);
      if (!res.ok) {
        setFeedback(res.message);
        return;
      }
      setFeedback(t.success);
      setMessage('');
      setTimeout(() => {
        setOpen(false);
        setFeedback(null);
      }, 1800);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-[220] flex h-11 w-11 items-center justify-center rounded-full bg-luxury-ink text-white shadow-[0_8px_24px_rgba(15,23,42,0.24)] transition hover:scale-105 md:bottom-6 md:right-6 md:h-14 md:w-14 md:shadow-[0_10px_32px_rgba(15,23,42,0.28)]"
        aria-label={t.aria}
        title={t.aria}
      >
        <MessageCircle className="md:hidden" size={20} strokeWidth={2} aria-hidden />
        <MessageCircle className="hidden md:block" size={26} strokeWidth={2} aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[240] flex items-end justify-center p-4 sm:items-center" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-luxury-ink/35 backdrop-blur-[2px]"
            aria-label={t.close}
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-dialog-title"
            className="relative z-10 w-full max-w-md rounded-3xl border border-white/55 bg-[#fbf7ef] p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 id="support-dialog-title" className="font-serif text-2xl font-semibold text-luxury-ink">
                {t.title}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-luxury-muted transition hover:bg-white/70"
                aria-label={t.close}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-luxury-ink">
                {t.typeLabel}
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as SupportTicketType)}
                  className="mt-2 w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-luxury-ink outline-none ring-luxury-orange/30 focus:ring-2"
                >
                  {(Object.keys(t.types) as SupportTicketType[]).map((key) => (
                    <option key={key} value={key}>
                      {t.types[key]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-luxury-ink">
                {t.messageLabel}
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.placeholder}
                  className="mt-2 w-full resize-y rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-luxury-ink outline-none ring-luxury-orange/30 focus:ring-2"
                />
              </label>

              {feedback ? (
                <p className={`text-sm ${feedback === t.success ? 'text-emerald-800' : 'text-red-800'}`}>{feedback}</p>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                className="btn-luxury-primary w-full min-h-[46px] disabled:opacity-60"
              >
                {pending ? t.sending : t.send}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
