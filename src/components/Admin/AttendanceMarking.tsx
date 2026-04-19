'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { setEnrollmentStatusAction } from '@/app/admin/attendance/actions';

type Row = {
  enrollmentId: string;
  userLabel: string;
  status: string;
};

export function AttendanceMarking({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setStatus(enrollmentId: string, status: 'booked' | 'attended') {
    startTransition(async () => {
      const res = await setEnrollmentStatusAction({ enrollmentId, status });
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-600">
          <tr>
            <th className="px-4 py-3">Participant</th>
            <th className="px-4 py-3">Statut actuel</th>
            <th className="px-4 py-3 text-right">Pointage</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.enrollmentId} className="border-b border-neutral-100">
              <td className="px-4 py-3 font-medium text-neutral-900">{r.userLabel}</td>
              <td className="px-4 py-3 text-neutral-600">{r.status}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setStatus(r.enrollmentId, 'attended')}
                    className="rounded border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    Présent
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setStatus(r.enrollmentId, 'booked')}
                    className="rounded border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Non confirmé
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-neutral-100 px-4 py-2 text-xs text-neutral-500">
        « Présent » enregistre le statut <code className="rounded bg-neutral-100 px-1">attended</code> ; « Non confirmé »
        repasse en <code className="rounded bg-neutral-100 px-1">booked</code> (inscrit mais présence non validée).
      </p>
    </div>
  );
}
