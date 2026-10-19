import Link from 'next/link';
import { Activity, CalendarX, Inbox, TriangleAlert } from 'lucide-react';

export type SanteProps = {
  noLiveAlert: boolean;
  backlog: number;
  heartbeats: Array<{ job: string; last_run_at: string | null; late: boolean }>;
  sent7d: { email: number; fail: number; push: number };
  errors: string[];
};

export function AdminSanteV2({ noLiveAlert, backlog, heartbeats, sent7d, errors }: SanteProps) {
  const issues = (noLiveAlert ? 1 : 0) + (backlog > 0 ? 1 : 0);
  return (
    <div className="mx-auto max-w-[1240px] space-y-6 pb-16 pt-8 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="fm-kicker">Admin · Santé</p>
          <h1 className="hero-signature-title mt-2 text-[3rem] text-luxury-ink">Santé des envois</h1>
          <p className="hero-signature-subtitle mt-2 text-[14px]">Tâches planifiées, rappels, emails. Aucun taux d’ouverture.</p>
        </div>
        {issues > 0 ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fff4e5] px-4 py-2 text-[12px] font-semibold text-[#8a5a1f] ring-1 ring-[#f3c58e]">
            <TriangleAlert size={15} />
            {issues} point{issues > 1 ? 's' : ''} à traiter
          </span>
        ) : null}
      </header>

      <section className="space-y-3">
        {noLiveAlert ? (
          <div className="flex flex-wrap items-center gap-4 rounded-[1.4rem] border border-[#f1c9bd] bg-[#fdf1ed] p-5">
            <span className="kpi-icon-wrap kpi-icon-wrap--rose">
              <CalendarX size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-luxury-ink">Aucun live publié dans les 7 prochains jours</p>
              <p className="mt-0.5 text-[13px] text-luxury-muted">Sans live au planning, pas de rappels et « Ta semaine » sera vide dimanche.</p>
            </div>
            <Link href="/admin/courses" className="btn-luxury-primary !px-5 !py-2.5">
              Créer les lives récurrents
            </Link>
          </div>
        ) : null}
        {backlog > 0 ? (
          <div className="flex flex-wrap items-center gap-4 rounded-[1.4rem] border border-[#f3dfb8] bg-[#fff8ec] p-5">
            <span className="kpi-icon-wrap kpi-icon-wrap--amber">
              <Inbox size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-luxury-ink">{backlog} anciennes notifications en attente de récapitulatif</p>
              <p className="mt-0.5 text-[13px] text-luxury-muted">
                Les envoyer maintenant inonderait les clientes : on les archive <b>sans envoi</b> après GO écrit.
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="glass-card glass-card--kpi rounded-[1.75rem] p-5">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold">
          <Activity size={16} /> Tâches planifiées
        </h2>
        <ul className="mt-3 space-y-2 text-[13.5px]">
          {heartbeats.map((h) => (
            <li key={h.job} className="flex justify-between">
              <span>{h.job}</span>
              <span className={h.late ? 'font-semibold text-[#c45d3e]' : 'text-luxury-muted'}>
                {h.last_run_at ?? 'jamais'} {h.late ? '· en retard' : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass-card glass-card--kpi rounded-[1.75rem] p-5">
        <h2 className="text-[16px] font-semibold">Envois des 7 derniers jours</h2>
        <p className="mt-2 text-[14px]">
          Emails envoyés {sent7d.email} · échecs {sent7d.fail} · push {sent7d.push}
        </p>
      </section>

      <section className="glass-card glass-card--kpi rounded-[1.75rem] p-5">
        <h2 className="text-[16px] font-semibold">Dernières erreurs</h2>
        <ul className="mt-2 space-y-1 text-[13px] text-luxury-muted">
          {errors.length ? errors.map((e) => <li key={e}>{e}</li>) : <li>Aucune.</li>}
        </ul>
        <Link href="/admin/sante/apercu-emails" className="btn-luxury-ghost mt-4 inline-flex !px-4 !py-2">
          Aperçu des emails
        </Link>
      </section>
    </div>
  );
}
