import { describe, expect, it } from 'vitest';

import {
  addDays,
  chosenDaysLabel,
  computeProgramState,
  isoWeekKey,
  isoWeekday,
  relativeDayLabel,
  sessionsInRange,
  shortDateLabel,
  shouldNudge,
  type EngineEnrollment,
  type EngineProgress,
  type EngineStep,
} from './engine';

function steps(weeks = 3, perWeek = 3): EngineStep[] {
  const out: EngineStep[] = [];
  for (let w = 1; w <= weeks; w += 1) {
    for (let p = 1; p <= perWeek; p += 1) {
      out.push({ id: `${w}-${p}`, week: w, position: p, kind: 'video', minutes: 20 + p, title: { fr: `S${w}.${p}`, es: `S${w}.${p}` } });
    }
    out.push({ id: `${w}-live`, week: w, position: perWeek + 1, kind: 'live', minutes: null, title: { fr: 'Live', es: 'Live' }, liveStyle: 'Pilates' });
  }
  return out;
}

const TZ = 'Europe/Paris';
// lundi 12 octobre 2026 (Paris)
const enrollment: EngineEnrollment = { id: 'e1', status: 'active', startDate: '2026-10-05', chosenDays: [1, 3, 5] };

function done(stepId: string, isoUtc: string, feeling: EngineProgress['feeling'] = 'right'): EngineProgress {
  return { stepId, completedAt: isoUtc, watchedS: 1200, feeling };
}

describe('dates', () => {
  it('jours ISO et additions', () => {
    expect(isoWeekday('2026-10-19')).toBe(1);
    expect(isoWeekday('2026-10-25')).toBe(7);
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(shortDateLabel('2026-10-12', 'fr')).toBe('lun. 12 oct.');
    expect(chosenDaysLabel([5, 1, 3], 'fr')).toBe('Lun · Mer · Ven');
    expect(chosenDaysLabel([], 'es')).toBe('Lun · Mié · Vie');
    expect(relativeDayLabel('2026-10-13', '2026-10-12', 'fr')).toBe('demain');
  });
});

describe('computeProgramState', () => {
  it('planifie les séances à faire sur les jours choisis, à partir d’aujourd’hui', () => {
    const progress = [
      done('1-1', '2026-10-05T16:00:00Z'),
      done('1-2', '2026-10-07T16:00:00Z'),
      done('1-3', '2026-10-09T16:00:00Z'),
      done('2-1', '2026-10-12T07:00:00Z'),
    ];
    // mercredi 14 octobre
    const s = computeProgramState({ steps: steps(), progress, enrollment, todayKey: '2026-10-14', timeZone: TZ });
    expect(s.done).toBe(4);
    expect(s.total).toBe(9);
    expect(s.percent).toBe(44);
    expect(s.next?.n).toBe(5);
    expect(s.next?.status).toBe('today');
    expect(s.next?.dateKey).toBe('2026-10-14');
    expect(s.sessions[5].dateKey).toBe('2026-10-16');
    expect(s.sessions[6].dateKey).toBe('2026-10-19');
    expect(s.currentWeek).toBe(2);
    expect(s.weekDone).toBe(1);
    expect(s.liveStepForWeek?.id).toBe('2-live');
  });

  it('une séance manquée glisse au prochain jour choisi (jamais dans le passé)', () => {
    const s = computeProgramState({ steps: steps(), progress: [], enrollment, todayKey: '2026-10-13', timeZone: TZ });
    expect(s.next?.dateKey).toBe('2026-10-14');
    expect(s.next?.status).toBe('planned');
    expect(s.daysSinceActivity).toBe(8);
  });

  it('pas deux séances le même jour', () => {
    const s = computeProgramState({
      steps: steps(),
      progress: [done('1-1', '2026-10-05T08:00:00Z')],
      enrollment: { ...enrollment, startDate: '2026-10-05' },
      todayKey: '2026-10-05',
      timeZone: TZ,
    });
    expect(s.next?.dateKey).toBe('2026-10-07');
  });

  it('« Décaler à demain » repousse la séance du jour', () => {
    const s = computeProgramState({
      steps: steps(),
      progress: [],
      enrollment: { ...enrollment, chosenDays: [1, 2, 3, 4, 5, 6, 7], postponedUntil: '2026-10-15' },
      todayKey: '2026-10-14',
      timeZone: TZ,
    });
    expect(s.next?.dateKey).toBe('2026-10-15');
  });

  it('début dans le futur : rien avant la date de début', () => {
    const s = computeProgramState({
      steps: steps(),
      progress: [],
      enrollment: { ...enrollment, startDate: '2026-10-19' },
      todayKey: '2026-10-14',
      timeZone: TZ,
    });
    expect(s.next?.dateKey).toBe('2026-10-19');
  });

  it('programme en pause : aucune date prévue', () => {
    const s = computeProgramState({ steps: steps(), progress: [], enrollment: { ...enrollment, status: 'paused' }, todayKey: '2026-10-14', timeZone: TZ });
    expect(s.sessions.every((x) => x.dateKey === null)).toBe(true);
  });

  it('jour de validation dans le fuseau de la cliente', () => {
    const s = computeProgramState({
      steps: steps(),
      progress: [done('1-1', '2026-10-12T23:30:00Z')],
      enrollment,
      todayKey: '2026-10-13',
      timeZone: TZ,
    });
    // 23:30 UTC = 01:30 le 13 à Paris
    expect(s.sessions[0].dateKey).toBe('2026-10-13');
    const mx = computeProgramState({
      steps: steps(),
      progress: [done('1-1', '2026-10-12T23:30:00Z')],
      enrollment,
      todayKey: '2026-10-13',
      timeZone: 'America/Mexico_City',
    });
    expect(mx.sessions[0].dateKey).toBe('2026-10-12');
  });

  it('deux « Difficile » d’affilée → version plus douce', () => {
    const s = computeProgramState({
      steps: steps(),
      progress: [done('1-1', '2026-10-05T10:00:00Z', 'right'), done('1-2', '2026-10-07T10:00:00Z', 'hard'), done('1-3', '2026-10-09T10:00:00Z', 'hard')],
      enrollment,
      todayKey: '2026-10-12',
      timeZone: TZ,
    });
    expect(s.suggestSofter).toBe(true);
  });

  it('programme terminé', () => {
    const all = steps().filter((x) => x.kind === 'video').map((x, i) => done(x.id, `2026-10-${String(5 + i).padStart(2, '0')}T10:00:00Z`));
    const s = computeProgramState({ steps: steps(), progress: all, enrollment, todayKey: '2026-10-20', timeZone: TZ });
    expect(s.isComplete).toBe(true);
    expect(s.next).toBeNull();
    expect(s.currentWeek).toBe(3);
  });

  it('séances d’une semaine de planning', () => {
    const s = computeProgramState({ steps: steps(), progress: [done('1-1', '2026-10-12T10:00:00Z')], enrollment, todayKey: '2026-10-14', timeZone: TZ });
    const week = sessionsInRange(s, '2026-10-12', '2026-10-19');
    expect(week.map((x) => [x.n, x.dateKey, x.status])).toEqual([
      [1, '2026-10-12', 'done'],
      [2, '2026-10-14', 'today'],
      [3, '2026-10-16', 'planned'],
    ]);
  });
});

describe('relance douce', () => {
  it('4 jours sans séance, au plus une fois par semaine', () => {
    const s = computeProgramState({ steps: steps(), progress: [done('1-1', '2026-10-05T10:00:00Z')], enrollment, todayKey: '2026-10-09', timeZone: TZ });
    expect(shouldNudge(s, null, '2026-10-09', 'active')).toBe(true);
    expect(shouldNudge(s, '2026-10-05', '2026-10-09', 'active')).toBe(false);
    expect(shouldNudge(s, null, '2026-10-09', 'paused')).toBe(false);
    const recent = computeProgramState({ steps: steps(), progress: [done('1-1', '2026-10-07T10:00:00Z')], enrollment, todayKey: '2026-10-09', timeZone: TZ });
    expect(shouldNudge(recent, null, '2026-10-09', 'active')).toBe(false);
  });
});

describe('isoWeekKey', () => {
  it('donne la semaine ISO, y compris à cheval sur deux années', () => {
    expect(isoWeekKey('2026-10-19')).toBe('2026-W43');
    expect(isoWeekKey('2026-10-25')).toBe('2026-W43');
    expect(isoWeekKey('2027-01-01')).toBe('2026-W53');
    expect(isoWeekKey('2026-01-01')).toBe('2026-W01');
  });
});
