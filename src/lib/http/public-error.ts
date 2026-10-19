import { NextResponse } from 'next/server';

import { A_VALIDER_LOT1 } from '@/content/a-valider';

export const GENERIC_ERROR_FR = A_VALIDER_LOT1.errors.generic.fr;

/** Erreur serveur côté cliente : message générique, détail technique seulement dans les journaux. */
export function publicServerError(tag: string, detail: unknown, status = 500) {
  console.error(`[${tag}]`, detail instanceof Error ? detail.message : detail);
  return NextResponse.json({ error: GENERIC_ERROR_FR }, { status });
}
