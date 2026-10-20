import { notFound } from 'next/navigation';

import { requireAdmin } from '@/lib/auth/require-admin';
import { isNotifV2Enabled } from '@/lib/notifications/v2/flag';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { demoV2Vars, renderV2Email, type V2EmailId } from '@/lib/email/v2-templates';

const IDS: Array<{ id: V2EmailId; label: string }> = [
  { id: 'A01', label: 'Rappel la veille (FR)' },
  { id: 'A02', label: 'Rappel la veille (ES)' },
  { id: 'A03', label: 'Rappel 1 h avant' },
  { id: 'A04', label: 'Nouveautés du jour' },
  { id: 'A05', label: 'Live annulé' },
  { id: 'A06', label: '« Ta semaine »' },
  { id: 'A07', label: 'Séance du jour (programme)' },
];

export default async function ApercuEmailsPage() {
  if (!isNotifV2Enabled()) notFound();
  await requireAdmin();
  const omitProgramme = !isProgrammesEnabled();
  return (
    <div className="mx-auto max-w-6xl space-y-10 p-6">
      <header>
        <p className="fm-kicker">Admin · Santé</p>
        <h1 className="hero-signature-title mt-2 text-[2.6rem] text-luxury-ink">Aperçu des emails</h1>
        <p className="hero-signature-subtitle mt-2 text-[14px]">Données fictives. À gauche : ordinateur (français) ; à droite : téléphone (espagnol).</p>
      </header>
      {IDS.filter(({ id }) => !(omitProgramme && id === 'A07')).map(({ id, label }) => {
        const fr = renderV2Email(id, { ...demoV2Vars(id, 'fr'), omitProgramme });
        const es = renderV2Email(id === 'A01' ? 'A02' : id, { ...demoV2Vars(id, 'es'), omitProgramme });
        return (
          <section key={id} className="space-y-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-luxury-ink">
              {id} · {label} — <span className="normal-case tracking-normal text-luxury-muted">{fr.subject}</span>
            </h2>
            <div className="grid items-start gap-4 lg:grid-cols-[1fr_auto]">
              <iframe title={`${id}-desktop`} className="h-[760px] w-full rounded-[1.75rem] border border-black/10 bg-white" srcDoc={fr.html} />
              <iframe title={`${id}-mobile`} className="mx-auto h-[760px] w-[390px] rounded-[1.75rem] border border-black/10 bg-white" srcDoc={es.html} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
