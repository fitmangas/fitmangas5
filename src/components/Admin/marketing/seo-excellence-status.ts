/** Helpers partagés Server + Client (pas de 'use client' ici). */

export type SeoActionStatus = 'done' | 'in_progress' | 'watching' | 'todo';

export type SeoExcellenceAction = {
  text: string;
  status: SeoActionStatus;
};

export function seoActionStatusLabel(status: SeoActionStatus): string {
  if (status === 'done') return 'Fait';
  if (status === 'in_progress') return 'En cours';
  if (status === 'watching') return 'En observation';
  return 'À faire';
}

export function seoActionStatusBadgeClass(status: SeoActionStatus): string {
  if (status === 'done') return 'bg-emerald-50 text-emerald-900';
  if (status === 'in_progress') return 'bg-amber-50 text-amber-950';
  if (status === 'watching') return 'bg-sky-50 text-sky-950 ring-1 ring-sky-200/80';
  return 'bg-stone-100 text-stone-600';
}

export function seoPillarStatusBadgeClass(status: SeoActionStatus): string {
  if (status === 'done') return 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200';
  if (status === 'in_progress') return 'bg-amber-50 text-amber-950 ring-1 ring-amber-200';
  if (status === 'watching') return 'bg-sky-50 text-sky-950 ring-1 ring-sky-200';
  return 'bg-stone-100 text-stone-700 ring-1 ring-stone-200';
}
