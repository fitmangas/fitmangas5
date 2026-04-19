'use client';

import { useState, useTransition } from 'react';

import { rescheduleCourseAction } from '@/app/admin/planning/actions';

export type PlanningCourseRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  course_format: string;
  course_category: string;
};

function toDatetimeLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PlanningCourseTable({ courses }: { courses: PlanningCourseRow[] }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {msg ? <p className="text-sm text-neutral-600">{msg}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-600">
            <tr>
              <th className="px-3 py-2">Titre</th>
              <th className="px-3 py-2">Début</th>
              <th className="px-3 py-2">Fin</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <PlanningRow
                key={c.id}
                course={c}
                disabled={pending}
                onSave={(startsLocal, endsLocal) => {
                  setMsg(null);
                  startTransition(async () => {
                    const start = new Date(startsLocal);
                    const end = new Date(endsLocal);
                    const res = await rescheduleCourseAction({
                      courseId: c.id,
                      startsAt: start.toISOString(),
                      endsAt: end.toISOString(),
                    });
                    setMsg(res.ok ? 'Dates mises à jour.' : res.message);
                  });
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-500">
        Modification rapide des horaires (fuseau navigateur). Pour un déplacement par glisser-déposer, prévoir une
        évolution UI ; la logique serveur est prête (mêmes dates).
      </p>
    </div>
  );
}

function PlanningRow({
  course,
  disabled,
  onSave,
}: {
  course: PlanningCourseRow;
  disabled: boolean;
  onSave: (start: string, end: string) => void;
}) {
  const [startL, setStartL] = useState(() => toDatetimeLocalInput(course.starts_at));
  const [endL, setEndL] = useState(() => toDatetimeLocalInput(course.ends_at));

  return (
    <tr className="border-b border-neutral-100">
      <td className="max-w-[220px] truncate px-3 py-2 font-medium">{course.title}</td>
      <td className="px-3 py-2">
        <input
          type="datetime-local"
          value={startL}
          onChange={(e) => setStartL(e.target.value)}
          className="w-full min-w-[10rem] rounded border border-neutral-200 px-2 py-1 text-xs"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="datetime-local"
          value={endL}
          onChange={(e) => setEndL(e.target.value)}
          className="w-full min-w-[10rem] rounded border border-neutral-200 px-2 py-1 text-xs"
        />
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-xs text-neutral-600">
        {course.course_format} · {course.course_category}
      </td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSave(startL, endL)}
          className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          Enregistrer
        </button>
      </td>
    </tr>
  );
}
