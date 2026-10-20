import Link from 'next/link';
import { CalendarX, CircleCheck, Clock, Inbox, Info, MailX, TriangleAlert } from 'lucide-react';

import type { SanteData } from '@/lib/notifications/v2/sante-data';

export type SanteProps = { data: SanteData };

function Dot({ state }: { state: SanteData['tasks'][number]['state'] }) {
  if (state === 'ok') return <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-success shadow-[0_0_0_3px_rgba(47,125,91,0.15)]" />;
  if (state === 'late') return <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#c45d3e] shadow-[0_0_0_3px_rgba(196,93,62,0.18)]" />;
  return <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-luxury-soft" />;
}

export function AdminSanteV2({ data }: SanteProps) {
  const late = data.tasks.filter((t) => t.state === 'late').length;
  const issues = (data.noLiveAlert ? 1 : 0) + (data.backlog > 0 ? 1 : 0) + late;
  return (
    <div className="mx-auto max-w-[1240px] space-y-6 pb-16 pt-8 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 px-1">
        <div>
          <p className="fm-kicker">Admin · Santé</p>
          <h1 className="hero-signature-title mt-2 text-[3rem] text-luxury-ink">Santé des envois</h1>
          <p className="hero-signature-subtitle mt-2 text-[14px]">
            Tâches planifiées, rappels, emails. Mis à jour à chaque ouverture · dernier contrôle {data.checkedAt}
          </p>
        </div>
        {issues > 0 ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fff4e5] px-4 py-2 text-[12px] font-semibold text-[#8a5a1f] ring-1 ring-[#f3c58e]">
            <TriangleAlert size={15} />
            {issues} point{issues > 1 ? 's' : ''} à traiter
          </span>
        ) : null}
      </header>

      {data.noLiveAlert || data.backlog > 0 ? (
        <section className="space-y-3">
          {data.noLiveAlert ? (
            <div className="flex flex-wrap items-center gap-4 rounded-[1.4rem] border border-[#f1c9bd] bg-[#fdf1ed] p-5">
              <span className="kpi-icon-wrap kpi-icon-wrap--rose">
                <CalendarX size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-luxury-ink">
                  {data.noLiveAfter ? `Aucun live publié après le ${data.noLiveAfter}` : 'Aucun live publié dans les 7 prochains jours'}
                </p>
                <p className="mt-0.5 text-[13px] text-luxury-muted">
                  Sans live au planning, pas de rappels et « Ta semaine » sera vide dimanche. Objectif : 2 lives FR + 2 lives ES par semaine.
                </p>
              </div>
              <Link href="/admin/courses" className="btn-luxury-primary !px-5 !py-2.5">
                Créer les lives récurrents
              </Link>
            </div>
          ) : null}
          {data.backlog > 0 ? (
            <details className="group rounded-[1.4rem] border border-[#f3dfb8] bg-[#fff8ec] p-5">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-4">
                <span className="kpi-icon-wrap kpi-icon-wrap--amber">
                  <Inbox size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-luxury-ink">
                    {data.backlog.toLocaleString('fr-FR')} anciennes notifications en attente de récapitulatif
                  </p>
                  <p className="mt-0.5 text-[13px] text-luxury-muted">
                    Créées avant la correction. Les envoyer maintenant inonderait les clientes : on les archive{' '}
                    <b className="font-semibold text-luxury-ink">sans envoi</b>.
                  </p>
                </div>
                <span className="btn-luxury-ghost !px-5 !py-2.5">Voir le détail par type</span>
              </summary>
              <ul className="mt-4 grid gap-1.5 text-[12.5px] text-luxury-muted md:grid-cols-2">
                {data.backlogDetail.map((r) => (
                  <li key={`${r.digest_bucket}-${r.event_type}`} className="flex justify-between gap-3 rounded-xl bg-white/70 px-3 py-2">
                    <span className="truncate">
                      {r.digest_bucket} · {r.event_type}
                    </span>
                    <span className="tabular-nums font-semibold text-luxury-ink">{r.n.toLocaleString('fr-FR')}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12px] text-luxury-muted">
                L’archivage sans envoi est une modification en masse : il attend le GO écrit de Kevin (requête prête dans PROPOSITIONS_MIGRATIONS.md).
              </p>
            </details>
          ) : null}
        </section>
      ) : null}

      <section className="glass-card admin-form-refined overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 pb-3 pt-5">
          <h2 className="text-[17px] font-semibold text-luxury-ink">Tâches planifiées</h2>
          <span className="text-[12px] text-luxury-muted">Déclenchées par Supabase Cron · horaires en heure de Paris</span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="admin-calendar-surface grid grid-cols-[1.6fr_1fr_1fr_1.3fr_0.9fr] gap-3 border-b border-[rgba(255,255,255,0.22)] px-6 py-3 text-[10px] uppercase tracking-wider text-white/85">
              <span>Tâche</span>
              <span>Fréquence</span>
              <span>Dernier passage</span>
              <span>Résultat</span>
              <span>Prochain</span>
            </div>
            {data.tasks.map((t) => (
              <div
                key={t.job}
                className="grid grid-cols-[1.6fr_1fr_1fr_1.3fr_0.9fr] items-center gap-3 border-b border-black/[0.05] px-6 py-3.5 text-[13px] last:border-0"
              >
                <span className="flex items-center gap-2.5 font-medium text-luxury-ink">
                  <Dot state={t.state} />
                  {t.label}
                </span>
                <span className="text-luxury-muted">{t.frequency}</span>
                <span className={t.state === 'late' ? 'font-semibold text-[#c45d3e]' : 'text-luxury-ink'}>
                  {t.last}
                  {t.state === 'late' ? ' · en retard' : ''}
                </span>
                <span className="text-luxury-muted">{t.result}</span>
                <span className="text-luxury-muted">{t.next}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 bg-black/[0.02] px-6 py-3 text-[12px] text-luxury-muted">
          <Info size={14} />
          Une tâche passe au rouge si elle n’a pas tourné depuis 2 fois sa fréquence. Kevin reçoit alors un email d’alerte.
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="glass-card admin-form-refined overflow-hidden">
          <div className="px-6 pb-3 pt-5">
            <h2 className="text-[17px] font-semibold text-luxury-ink">Rappels des prochains lives</h2>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="admin-calendar-surface grid grid-cols-[1.6fr_0.8fr_1fr_1fr] gap-3 px-6 py-3 text-[10px] uppercase tracking-wider text-white/85">
                <span>Live</span>
                <span>Abonnées</span>
                <span>La veille</span>
                <span>1 h avant</span>
              </div>
              {data.lives.length === 0 ? (
                <p className="px-6 py-4 text-[13px] text-luxury-muted">Aucun live publié à venir.</p>
              ) : (
                data.lives.map((l) => (
                  <div
                    key={l.label}
                    className="grid grid-cols-[1.6fr_0.8fr_1fr_1fr] items-center gap-3 border-b border-black/[0.05] px-6 py-3.5 text-[13px] last:border-0"
                  >
                    <span className="font-medium text-luxury-ink">{l.label}</span>
                    <span className="tabular-nums text-luxury-ink">{l.recipients}</span>
                    {[l.eve, l.hour].map((s, i) => (
                      <span key={i} className={`inline-flex items-center gap-1.5 ${s.done ? 'text-success' : 'text-luxury-muted'}`}>
                        {s.done ? <CircleCheck size={14} /> : <Clock size={14} />}
                        {s.text}
                      </span>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="px-6 py-3 text-[12px] text-luxury-muted">
            Destinataires = abonnées actives ou en essai, dans la langue du live (+ celles qui ont choisi l’autre langue).
          </div>
        </section>

        <section className="glass-card admin-form-refined p-6">
          <h2 className="text-[17px] font-semibold text-luxury-ink">Envois des 7 derniers jours</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { k: 'Emails envoyés', v: data.sent7d.email, h: `${data.sent7d.failed} échec${data.sent7d.failed > 1 ? 's' : ''}` },
              { k: 'Échecs d’envoi', v: data.sent7d.failed, h: data.sent7d.failed ? 'voir ci-dessous' : 'aucun' },
              {
                k: 'Push envoyés',
                v: data.sent7d.push,
                h: `${data.sent7d.pushEquipped} appareil${data.sent7d.pushEquipped > 1 ? 's' : ''} équipé${data.sent7d.pushEquipped > 1 ? 's' : ''}`,
              },
              { k: 'Dans l’appli', v: data.sent7d.inApp, h: 'notifications créées' },
            ].map((tile) => (
              <div key={tile.k} className="rounded-2xl border border-white/80 bg-white/70 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-luxury-soft">{tile.k}</p>
                <p className="mt-1 text-[24px] font-semibold tabular-nums text-luxury-ink">{tile.v.toLocaleString('fr-FR')}</p>
                <p className="text-[11.5px] text-luxury-muted">{tile.h}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] font-semibold text-luxury-ink">Dernières erreurs</p>
          <ul className="mt-2 space-y-2 text-[12.5px]">
            {data.errors.length ? (
              data.errors.map((e) => (
                <li key={e} className="flex items-start gap-2 text-luxury-muted">
                  <MailX size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-[#b45309]" />
                  <span>{e}</span>
                </li>
              ))
            ) : (
              <li className="text-luxury-muted">Aucune erreur sur 7 jours.</li>
            )}
          </ul>
          <Link href="/admin/sante/apercu-emails" className="btn-luxury-ghost mt-5 inline-flex !px-4 !py-2">
            Aperçu des emails
          </Link>
        </section>
      </div>
    </div>
  );
}
