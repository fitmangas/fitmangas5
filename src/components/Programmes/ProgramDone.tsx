'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Award } from 'lucide-react';

import { CompletionStats } from './CompletionStats';
import { TestsTable } from './TestsTable';
import { recordProgramFeedbackAction } from '@/app/compte/programmes/actions';

export function ProgramDone({
  firstName,
  programTitle,
  slug,
  nextSlug,
  nextTitle,
  enrollmentId,
  certificateUrl,
  storyUrl,
  preview,
}: {
  firstName: string;
  programTitle: string;
  slug: string;
  nextSlug?: string | null;
  nextTitle?: string | null;
  enrollmentId?: string;
  certificateUrl: string;
  storyUrl: string;
  preview?: boolean;
}) {
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <div className="mx-auto max-w-[1180px] min-w-0 space-y-8 pb-16 pt-3 md:space-y-10 md:px-8 md:pt-10">
      <section className="glass-card glass-card--kpi fm-card-cream relative overflow-hidden px-6 py-10 text-center md:px-12 md:py-14">
        <span className="kpi-icon-wrap kpi-icon-wrap--logo mx-auto !h-16 !w-16">
          <Award size={30} />
        </span>
        <p className="fm-kicker fm-kicker--orange mt-6">Programme terminé · {programTitle}</p>
        <h1 className="hero-signature-title mt-3 text-[3rem] text-luxury-ink md:text-[5rem]">Bravo {firstName}&nbsp;!</h1>
        <p className="hero-signature-subtitle mx-auto mt-4 max-w-xl text-[16px] leading-relaxed md:text-[18px]">
          Tu as terminé {programTitle}. Ton corps a appris quelque chose de durable : garde-le.
        </p>
        <CompletionStats sessions="9 / 9" hours="4 h 20" lives="—" days="19" hideLives />
      </section>
      <section className="glass-card p-6 md:p-8">
        <p className="fm-kicker">Tes progrès</p>
        <TestsTable
          rows={[
            { label: 'Planche sur les genoux', start: '20 s', end: '35 s' },
            { label: 'Pont fessier tenu', start: '15 s', end: '28 s' },
          ]}
        />
      </section>
      <div className="flex flex-wrap gap-3">
        <a href={certificateUrl} className="btn-luxury-primary">
          Télécharger le certificat
        </a>
        <a href={storyUrl} className="btn-luxury-ghost">
          Image story
        </a>
        {nextSlug ? (
          <Link href={`/compte/programmes/${nextSlug}`} className="btn-luxury-ghost">
            Suite : {nextTitle}
          </Link>
        ) : null}
      </div>
      <section className="glass-card p-6">
        <h2 className="text-[17px] font-semibold">Un mot pour Alejandra</h2>
        <textarea className="mt-3 w-full rounded-2xl border border-[#D9C9B4] p-3 text-sm" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
        <label className="mt-3 flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          J&apos;accepte qu&apos;Alejandra publie mon message (décoché par défaut, retirable).
        </label>
        <button
          type="button"
          className="btn-luxury-primary mt-4"
          onClick={async () => {
            if (preview || !enrollmentId) {
              setSent(true);
              return;
            }
            const res = await recordProgramFeedbackAction({ enrollmentId, rating: null, message, publishConsent: consent });
            if (res.ok) setSent(true);
          }}
        >
          Envoyer
        </button>
        {sent ? <p className="mt-2 text-sm text-success">Merci.</p> : null}
        <p className="mt-2 text-[12px] text-luxury-muted">
          <Link href={`/compte/programmes/${slug}`}>Retirer mon consentement</Link>
        </p>
      </section>
    </div>
  );
}
