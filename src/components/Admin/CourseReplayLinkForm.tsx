'use client';

import { useState, useTransition } from 'react';

import { linkCourseReplayAction } from '@/app/admin/replays/actions';

type Props = {
  courseId: string;
  courseTitle: string;
  existingStatus?: 'pending' | 'approved' | 'rejected' | null;
};

export function CourseReplayLinkForm({ courseId, courseTitle, existingStatus }: Props) {
  const [vimeoInput, setVimeoInput] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (existingStatus === 'approved') {
    return (
      <p className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-3 text-xs text-emerald-900">
        Replay validé et visible pour les clientes.
      </p>
    );
  }

  if (existingStatus === 'pending') {
    return (
      <p className="rounded-2xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-xs text-amber-950">
        Replay lié — en attente de validation dans{' '}
        <a href="/admin/replays" className="font-semibold underline">
          Replays séances
        </a>
        .
      </p>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await linkCourseReplayAction({ courseId, vimeoInput });
      if (!res.ok) {
        setMessage(res.message);
        return;
      }
      setVimeoInput('');
      setMessage('Replay lié — validez-le dans Replays séances.');
    });
  }

  return (
    <div className="rounded-2xl border border-white/70 bg-white/40 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft">Replay Vimeo</p>
      <p className="mt-1 text-xs text-brand-ink/55">
        Séance « {courseTitle} » terminée — colle l’URL ou l’ID Vimeo après upload.
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={vimeoInput}
          onChange={(e) => setVimeoInput(e.target.value)}
          placeholder="https://vimeo.com/123456789"
          className="min-w-0 flex-1 rounded-2xl border border-white/85 bg-white/55 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#C45D3E]/25"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={isPending || !vimeoInput.trim()}
          className="btn-luxury-primary shrink-0 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
        >
          Ajouter le replay
        </button>
      </form>
      {message ? <p className="mt-2 text-xs text-brand-ink/70">{message}</p> : null}
    </div>
  );
}
