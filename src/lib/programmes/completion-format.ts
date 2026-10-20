/**
 * Bilan d'un programme terminé : types et libellés partagés par la page B07 (navigateur),
 * le certificat PDF (B08) et le visuel story (B09). Module pur (aucun accès base).
 */
import { hoursMinutesLabel, keyToUtcNoon, type Lang } from '@/lib/programmes/engine';
import type { TestItem } from '@/lib/programmes/view-models';

export type CompletionTest = {
  key: string;
  label: string;
  type: string;
  scale: string[] | null;
  start: number | null;
  end: number | null;
};

export type CompletionData = {
  lang: Lang;
  enrollmentId: string;
  userId: string;
  status: string;
  slug: string;
  title: string;
  level: number;
  coverUrl: string;
  weeks: number;
  firstName: string | null;
  fullName: string;
  certificateNumber: string | null;
  startKey: string;
  endKey: string;
  days: number;
  done: number;
  total: number;
  minutes: number;
  tests: CompletionTest[];
  testStartKey: string | null;
  testEndKey: string | null;
  canRecordEndTest: boolean;
  testItems: TestItem[];
  nextSlug: string | null;
  /** Dernier message laissé pour Alejandra (B07). */
  feedback: { rating: number | null; message: string; consent: boolean } | null;
};

const MONTH_LONG: Record<Lang, string[]> = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
};

/** « Du 5 au 23 octobre 2026 », « Du 28 septembre au 16 octobre 2026 », « Del 5 al 23 de octubre de 2026 » */
export function periodLabel(startKey: string, endKey: string, lang: Lang): string {
  const a = keyToUtcNoon(startKey);
  const b = keyToUtcNoon(endKey);
  const [da, ma, ya] = [a.getUTCDate(), a.getUTCMonth(), a.getUTCFullYear()];
  const [db, mb, yb] = [b.getUTCDate(), b.getUTCMonth(), b.getUTCFullYear()];
  if (lang === 'es') {
    if (ya !== yb) return `Del ${da} de ${MONTH_LONG.es[ma]} de ${ya} al ${db} de ${MONTH_LONG.es[mb]} de ${yb}`;
    if (ma !== mb) return `Del ${da} de ${MONTH_LONG.es[ma]} al ${db} de ${MONTH_LONG.es[mb]} de ${yb}`;
    return `Del ${da} al ${db} de ${MONTH_LONG.es[mb]} de ${yb}`;
  }
  if (ya !== yb) return `Du ${da} ${MONTH_LONG.fr[ma]} ${ya} au ${db} ${MONTH_LONG.fr[mb]} ${yb}`;
  if (ma !== mb) return `Du ${da} ${MONTH_LONG.fr[ma]} au ${db} ${MONTH_LONG.fr[mb]} ${yb}`;
  return `Du ${da} au ${db} ${MONTH_LONG.fr[mb]} ${yb}`;
}

/** « 3 semaines · 9 séances · 4 h 20 d'entraînement » */
export function statsLine(d: Pick<CompletionData, 'weeks' | 'done' | 'minutes'>, lang: Lang): string {
  const h = hoursMinutesLabel(d.minutes);
  return lang === 'es'
    ? `${d.weeks} semana${d.weeks > 1 ? 's' : ''} · ${d.done} sesion${d.done > 1 ? 'es' : ''} · ${h} de entrenamiento`
    : `${d.weeks} semaine${d.weeks > 1 ? 's' : ''} · ${d.done} séance${d.done > 1 ? 's' : ''} · ${h} d’entraînement`;
}

