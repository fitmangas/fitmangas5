import type { ProgramSession } from '@/components/Compte/PlanningV3';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { addDays, isoWeekday, sessionsInRange } from '@/lib/programmes/engine';
import { loadActiveProgram } from '@/lib/programmes/load';

/**
 * Séances du programme à placer dans le planning (liseré abricot, « Ta séance N ») :
 * séances faites et prévues de la semaine passée à trois semaines devant.
 * [] tant que le drapeau est coupé, que les tables du lot 3 n'existent pas ou sans programme actif.
 */
export async function loadPlanningProgramSessions(
  userId: string,
  timeZone: string,
  lang: 'fr' | 'es' | 'en',
): Promise<ProgramSession[]> {
  if (!isProgrammesEnabled()) return [];
  try {
    const active = await loadActiveProgram(userId, timeZone);
    if (!active) return [];
    const l = lang === 'es' ? 'es' : 'fr';
    const monday = addDays(active.todayKey, -(isoWeekday(active.todayKey) - 1));
    const slug = active.definition.program.slug;
    return sessionsInRange(active.state, addDays(monday, -7), addDays(monday, 28)).map((s) => ({
      id: s.step.id,
      dayKey: s.dateKey as string,
      title: s.step.title[l] || s.step.videoTitle || '',
      stepLabel: `${l === 'es' ? 'Tu sesión' : 'Ta séance'} ${s.n}`,
      durationMin: s.step.minutes ?? 0,
      href: `/compte/programmes/${slug}/seance/${s.step.id}`,
      done: s.status === 'done',
    }));
  } catch (e) {
    console.error('[programmes] planning', e);
    return [];
  }
}
