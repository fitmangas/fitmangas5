'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { setEnrollmentStatusAction } from '@/app/admin/attendance/actions';
import { ADMIN_HEAD_TR } from '@/components/Admin/adminSurfaceClasses';

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
    <div className="glass-card overflow-hidden">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className={ADMIN_HEAD_TR}>
            <th className="px-4 py-3">Participant</th>
            <th className="px-4 py-3">Statut actuel</th>
            <th className="px-4 py-3 text-right">Pointage</th>
          </tr>
        </thead>
        <tbody className="text-luxury-ink/90">
          {rows.map((r) => (
            <tr key={r.enrollmentId} className="border-b border-white/25 hover:bg-white/20">
              <td className="px-4 py-3 font-medium">{r.userLabel}</td>
              <td className="px-4 py-3 text-luxury-muted">{r.status}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setStatus(r.enrollmentId, 'attended')}
                    className="rounded-full border border-emerald-300/80 bg-emerald-50/90 px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-sm backdrop-blur-sm hover:bg-emerald-100 disabled:opacity-50"
                  >
                    Présent
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setStatus(r.enrollmentId, 'booked')}
                    className="rounded-full border border-white/60 bg-white/50 px-3 py-1.5 text-xs font-semibold text-luxury-ink shadow-sm backdrop-blur-sm hover:bg-white/70 disabled:opacity-50"
                  >
                    Non confirmé
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-white/30 bg-white/25 px-4 py-3 text-xs text-luxury-muted backdrop-blur-sm">
        « Présent » enregistre le statut <code className="rounded bg-white/50 px-1.5 py-0.5 text-luxury-ink">attended</code> ; « Non
        confirmé » repasse en <code className="rounded bg-white/50 px-1.5 py-0.5 text-luxury-ink">booked</code> (inscrit mais présence non
        validée).
      </p>
    </div>
  );
}
