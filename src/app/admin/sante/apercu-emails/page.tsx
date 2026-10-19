import { notFound } from 'next/navigation';

import { requireAdmin } from '@/lib/auth/require-admin';
import { isNotifV2Enabled } from '@/lib/notifications/v2/flag';
import { isProgrammesEnabled } from '@/lib/programmes/flag';
import { renderV2Email, type V2EmailId } from '@/lib/email/v2-templates';

const IDS: V2EmailId[] = ['A01', 'A02', 'A03', 'A04', 'A05', 'A06'];

export default async function ApercuEmailsPage() {
  if (!isNotifV2Enabled()) notFound();
  await requireAdmin();
  const omitProgramme = !isProgrammesEnabled();
  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6">
      <h1 className="font-serif text-3xl italic">Aperçu emails v2 (données fictives)</h1>
      {IDS.map((id) => {
        const fr = renderV2Email(id, { locale: 'fr', firstName: 'Margaux', omitProgramme });
        const es = renderV2Email(id, { locale: 'es', firstName: 'Margaux', omitProgramme });
        return (
          <section key={id} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest">{id} — {fr.subject}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <iframe title={`${id}-desktop`} className="h-[640px] w-full rounded-[1.75rem] border bg-white" srcDoc={fr.html} />
              <iframe title={`${id}-mobile`} className="mx-auto h-[640px] w-[390px] rounded-[1.75rem] border bg-white" srcDoc={es.html} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
