'use client';

import {
  COURSE_HOUR_OPTIONS,
  COURSE_MINUTE_OPTIONS,
  COURSE_TIMEZONE_OPTIONS,
  formatCourseLocalPreview,
  joinCourseDatetimeLocal,
  joinCourseTimeParts,
  splitCourseDatetimeLocal,
  splitCourseTimeParts,
} from '@/lib/course-datetime';

const FIELD =
  'mt-2 w-full rounded-2xl border border-white/85 bg-white/55 px-4 py-3 text-sm text-luxury-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none focus:ring-2 focus:ring-[#C45D3E]/25';

const LABEL = 'block text-[10px] font-semibold uppercase tracking-[0.18em] text-luxury-soft';

type Props = {
  timeZone: string;
  onTimeZoneChange: (timeZone: string) => void;
  startsLocal: string;
  endsLocal: string;
  onStartsLocalChange: (value: string) => void;
  onEndsLocalChange: (value: string) => void;
  className?: string;
};

function DatetimePair({
  label,
  value,
  onChange,
  preview,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  preview: string | null;
}) {
  const { date, time } = splitCourseDatetimeLocal(value);
  const { hour, minute } = splitCourseTimeParts(time || '00:00');

  function updateDate(nextDate: string) {
    onChange(joinCourseDatetimeLocal(nextDate, hour, minute));
  }

  function updateHour(nextHour: string) {
    onChange(joinCourseDatetimeLocal(date, nextHour, minute));
  }

  function updateMinute(nextMinute: string) {
    onChange(joinCourseDatetimeLocal(date, hour, nextMinute));
  }

  return (
    <div>
      <span className={LABEL}>{label}</span>
      <div className="mt-2 space-y-2">
        <input type="date" required value={date} onChange={(e) => updateDate(e.target.value)} className={FIELD} />
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="sr-only">Heures</span>
            <select
              required
              value={hour}
              onChange={(e) => updateHour(e.target.value)}
              className={FIELD}
              aria-label="Heures"
            >
              {COURSE_HOUR_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} h
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">Minutes</span>
            <select
              required
              value={minute}
              onChange={(e) => updateMinute(e.target.value)}
              className={FIELD}
              aria-label="Minutes"
            >
              {COURSE_MINUTE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} min
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {preview ? (
        <p className="mt-1.5 text-[11px] leading-snug text-luxury-muted">{preview}</p>
      ) : null}
    </div>
  );
}

export function CourseDatetimeFields({
  timeZone,
  onTimeZoneChange,
  startsLocal,
  endsLocal,
  onStartsLocalChange,
  onEndsLocalChange,
  className = '',
}: Props) {
  const startsPreview = formatCourseLocalPreview(startsLocal, timeZone);
  const endsPreview = formatCourseLocalPreview(endsLocal, timeZone);

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      <label className={LABEL}>
        Fuseau horaire
        <select
          value={timeZone}
          onChange={(e) => onTimeZoneChange(e.target.value)}
          className={FIELD}
        >
          {COURSE_TIMEZONE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <p className="text-[11px] leading-snug text-luxury-muted">
        Choisis la date puis l&apos;heure via les listes (pas de saisie clavier). Le stockage en base reste en UTC.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <DatetimePair
          label="Début *"
          value={startsLocal}
          onChange={onStartsLocalChange}
          preview={startsPreview}
        />
        <DatetimePair
          label="Fin *"
          value={endsLocal}
          onChange={onEndsLocalChange}
          preview={endsPreview}
        />
      </div>
    </div>
  );
}
