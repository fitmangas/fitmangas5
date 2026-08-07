'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import {
  seoActionStatusBadgeClass,
  seoActionStatusLabel,
  type SeoExcellenceAction,
} from '@/components/Admin/marketing/seo-excellence-status';

function ActionRow({ action }: { action: SeoExcellenceAction }) {
  return (
    <li className="min-w-0 rounded-xl border border-[#C45D3E]/10 bg-[#FFFAF5]/80 px-3 py-2.5">
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${seoActionStatusBadgeClass(action.status)}`}
      >
        {seoActionStatusLabel(action.status)}
      </span>
      <p className="mt-1.5 text-sm leading-6 text-luxury-ink/80">{action.text}</p>
    </li>
  );
}

/**
 * Actions d’une colonne SEO Excellence :
 * - À faire / En cours / En observation → visibles
 * - Fait → bandeau repliable (replié par défaut)
 */
export function SeoExcellencePillarActions({ actions }: { actions?: SeoExcellenceAction[] | null }) {
  const [doneOpen, setDoneOpen] = useState(false);
  const list = Array.isArray(actions) ? actions : [];
  const openActions = list.filter((action) => action.status !== 'done');
  const doneActions = list.filter((action) => action.status === 'done');

  return (
    <div className="mt-4 space-y-3">
      {openActions.length > 0 ? (
        <ul className="space-y-3">
          {openActions.map((action) => (
            <ActionRow key={action.text} action={action} />
          ))}
        </ul>
      ) : null}

      {doneActions.length > 0 ? (
        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-semibold text-emerald-900"
            aria-expanded={doneOpen}
            onClick={() => setDoneOpen((open) => !open)}
          >
            <span>
              ✓ {doneActions.length} action{doneActions.length > 1 ? 's' : ''} faite
              {doneActions.length > 1 ? 's' : ''}
            </span>
            <ChevronDown
              size={16}
              className={`shrink-0 transition-transform ${doneOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          {doneOpen ? (
            <ul className="space-y-2 border-t border-emerald-200/60 px-2 pb-2 pt-2">
              {doneActions.map((action) => (
                <ActionRow key={action.text} action={action} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
