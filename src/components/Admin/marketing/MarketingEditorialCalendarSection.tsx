'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { suggestEditorialTopicAction } from '@/app/admin/marketing/actions-editorial';

type Scheduled = {
  id: string;
  title_fr: string;
  scheduled_publication_at: string;
  status: string;
};

type Suggestion = {
  id: string;
  suggestion_fr: string;
  suggestion_es: string | null;
  topics_hint: string | null;
  created_at: string;
};

export function MarketingEditorialCalendarSection({
  scheduled,
  suggestions,
}: {
  scheduled: Scheduled[];
  suggestions: Suggestion[];
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-luxury-ink">Calendrier éditorial</h3>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setMsg(null);
            start(async () => {
              const r = await suggestEditorialTopicAction();
              if (r.ok) {
                setMsg(`Sujet proposé : ${r.suggestion_fr}`);
                router.refresh();
              } else setMsg(r.error);
            });
          }}
          className="btn-luxury-primary min-h-[44px] w-full px-4 text-xs sm:w-auto"
        >
          {pending ? '…' : 'Suggérer un sujet (IA)'}
        </button>
      </div>
      {msg ? <p className="text-sm text-luxury-muted">{msg}</p> : null}

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">8 prochaines publications planifiées</p>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-white/55 bg-white/50">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-[10px] uppercase tracking-[0.14em] text-luxury-soft">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Titre</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2">Édition</th>
              </tr>
            </thead>
            <tbody>
              {scheduled.map((row) => (
                <tr key={row.id} className="border-t border-white/50">
                  <td className="px-3 py-2 text-luxury-muted">{formatDate(row.scheduled_publication_at)}</td>
                  <td className="px-3 py-2 font-medium text-luxury-ink">{row.title_fr}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/blog/articles/${row.id}/edit`} className="text-xs font-semibold text-orange-700 underline underline-offset-2">
                      Éditer
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Suggestions enregistrées</p>
        <ul className="mt-3 space-y-2 text-sm text-luxury-muted">
          {suggestions.map((s) => (
            <li key={s.id} className="rounded-xl border border-white/50 bg-white/45 px-3 py-2">
              <span className="font-medium text-luxury-ink">{s.suggestion_fr}</span>
              {s.suggestion_es ? <span className="mt-1 block text-xs">ES : {s.suggestion_es}</span> : null}
              {s.topics_hint ? <span className="mt-1 block text-xs">Mots-clés : {s.topics_hint}</span> : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
