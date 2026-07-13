'use client';

import {
  COURSE_TIME_SLOT_OPTIONS,
  COURSE_TIMEZONE_OPTIONS,
  formatCourseLocalPreview,
  joinCourseDatetimeLocal,
  snapCourseTimeSlot,
  splitCourseDatetimeLocal,
} from '@/lib/course-datetime';

const FIELD =
  'mt-2 w-full rounded-2xl border border-[#D9C9B4] bg-white px-4 py-3 text-sm text-luxury-ink shadow-[inset_0_1px_3px_rgba(31,27,22,0.08)] outline-none focus:border-[#C45D3E]/60 focus:ring-2 focus:ring-[#C45D3E]/25';

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
  const timeSlot = snapCourseTimeSlot(time || '00:00');

  function updateDate(nextDate: string) {
    onChange(joinCourseDatetimeLocal(nextDate, timeSlot));
  }

  function updateTimeSlot(nextTime: string) {
    onChange(joinCourseDatetimeLocal(date, nextTime));
  }

  return (
    <div>
      <span className={LABEL}>{label}</span>
      <div className="mt-2 space-y-2">
        <input type="date" required value={date} onChange={(e) => updateDate(e.target.value)} className={FIELD} />
        <label className="block">
          <span className="sr-only">Heure</span>
          <select
            required
            value={timeSlot}
            onChange={(e) => updateTimeSlot(e.target.value)}
            className={FIELD}
            aria-label="Heure"
          >
            {COURSE_TIME_SLOT_OPTIONS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>
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
        Choisis la date puis le créneau horaire (pas de 5 min, pas de saisie clavier). Le stockage en base reste en UTC.
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
