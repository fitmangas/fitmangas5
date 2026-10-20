/**
 * Données fictives des aperçus de développement (/dev/apercu) : catalogue « Les Fondations »,
 * commencé le lundi 5 octobre (lun · mer · ven), 4 séances faites, « aujourd'hui » = mercredi 14 octobre.
 */
import { programBySlug } from '@/lib/programmes/catalogue';
import { computeProgramState, type EngineProgress } from '@/lib/programmes/engine';
import { catalogCover, catalogSteps, type EnrollmentData, type ProgramDefinition, type WeeklyLive } from '@/lib/programmes/load';

export const DEMO_TODAY = '2026-10-14';
export const DEMO_TZ = 'Europe/Paris';

export function demoDefinition(slug = 'les-fondations'): ProgramDefinition {
  const program = programBySlug(slug)!;
  return { program, programId: 'demo', steps: catalogSteps(program), videos: {}, coverUrl: catalogCover(program) };
}

export function demoEnrollment(def: ProgramDefinition, doneCount = 4): EnrollmentData {
  const dates = ['2026-10-05', '2026-10-07', '2026-10-09', '2026-10-12', '2026-10-14', '2026-10-16'];
  const feelings: EngineProgress['feeling'][] = ['right', 'easy', 'right', 'right', 'hard', 'hard'];
  const videos = def.steps.filter((s) => s.kind === 'video');
  return {
    enrollment: { id: 'demo-enrollment', status: 'active', startDate: '2026-10-05', chosenDays: [1, 3, 5], reminderTime: '18:00' },
    progress: videos.slice(0, doneCount).map((s, i) => ({
      stepId: s.id,
      completedAt: `${dates[i] ?? '2026-10-12'}T16:30:00Z`,
      watchedS: 1500,
      feeling: feelings[i] ?? 'right',
    })),
    testPhases: ['start'],
    certificateNumber: null,
    completedAt: null,
  };
}

export function demoState(def: ProgramDefinition, data: EnrollmentData) {
  return computeProgramState({ steps: def.steps, progress: data.progress, enrollment: data.enrollment, todayKey: DEMO_TODAY, timeZone: DEMO_TZ });
}

export const DEMO_LIVE: WeeklyLive = {
  id: 'demo-live',
  title: 'Barre/Pilates Flow',
  startsAt: '2026-10-17T08:30:00Z',
  endsAt: '2026-10-17T09:25:00Z',
  language: 'fr',
};
