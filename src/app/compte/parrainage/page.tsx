import { createClient } from '@/lib/supabase/server';
import { getClientLang } from '@/lib/compte/i18n';

import { ParrainageShareButtons } from '@/components/Compte/ParrainageShareButtons';

const APP = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com';

export default async function CompteParrainagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const lang = await getClientLang(supabase, user.id);
  const t = copy[lang === 'es' ? 'es' : 'fr'];

  const { data: profile } = await supabase.from('profiles').select('first_name, referral_code').eq('id', user.id).maybeSingle();

  const code = profile?.referral_code?.trim() || '';
  const base = APP.replace(/\/$/, '');
  const shareUrl = code ? `${base}/?ref=${encodeURIComponent(code)}` : base;

  const { data: filleules } = await supabase
    .from('referrals')
    .select('referred_email, status, created_at, referred_user_id')
    .eq('referrer_user_id', user.id)
    .order('created_at', { ascending: false });

  const ids = [...new Set((filleules ?? []).map((r) => r.referred_user_id).filter(Boolean))] as string[];
  const { data: names } = ids.length ? await supabase.from('profiles').select('id, first_name').in('id', ids) : { data: [] as { id: string; first_name: string | null }[] };
  const nameById = new Map((names ?? []).map((n) => [n.id, n.first_name]));

  const whatsappText = t.whatsappMessage.replace('{{URL}}', shareUrl);

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-2 py-8 md:px-0">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">{t.kicker}</p>
        <h1 className="hero-signature-title mt-2 text-3xl text-luxury-ink">{t.title}</h1>
        <p className="mt-3 text-sm leading-6 text-luxury-muted">{t.intro}</p>
      </div>

      <section className="glass-card rounded-3xl border border-white/45 p-6">
        <h2 className="text-lg font-semibold text-luxury-ink">{t.yourCode}</h2>
        {code ? (
          <>
            <p className="mt-2 font-mono text-2xl font-bold tracking-wide text-luxury-ink">{code}</p>
            <p className="mt-2 break-all text-sm text-luxury-muted">{shareUrl}</p>
            <ParrainageShareButtons shareUrl={shareUrl} whatsappText={whatsappText} />
          </>
        ) : (
          <p className="mt-2 text-sm text-luxury-muted">{t.noCode}</p>
        )}
      </section>

      <section className="glass-card rounded-3xl border border-white/45 p-6">
        <h2 className="text-lg font-semibold text-luxury-ink">{t.listTitle}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead className="text-[10px] uppercase tracking-[0.14em] text-luxury-soft">
              <tr>
                <th className="py-2 pr-3">{t.colName}</th>
                <th className="py-2 pr-3">{t.colDate}</th>
                <th className="py-2">{t.colStatus}</th>
              </tr>
            </thead>
            <tbody>
              {(filleules ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-luxury-muted">
                    {t.empty}
                  </td>
                </tr>
              ) : (
                (filleules ?? []).map((row) => {
                  const displayName =
                    row.referred_user_id && nameById.has(row.referred_user_id)
                      ? (nameById.get(row.referred_user_id) ?? '—')
                      : maskEmail(row.referred_email);
                  return (
                    <tr key={`${row.referred_email}-${row.created_at}`} className="border-t border-black/5">
                      <td className="py-3 pr-3 font-medium text-luxury-ink">{displayName}</td>
                      <td className="py-3 pr-3 text-luxury-muted">
                        {new Date(row.created_at).toLocaleDateString(lang === 'es' ? 'es-ES' : 'fr-FR')}
                      </td>
                      <td className="py-3">{labelStatus(row.status, t)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function maskEmail(email: string) {
  const [a, b] = email.split('@');
  if (!b) return email;
  const short = a.length > 2 ? `${a.slice(0, 2)}…` : a;
  return `${short}@${b}`;
}

function labelStatus(status: string, t: (typeof copy)['fr']) {
  if (status === 'subscribed') return t.stSubscribed;
  if (status === 'signed_up') return t.stSignedUp;
  return t.stPending;
}

const copy = {
  fr: {
    kicker: 'Communauté',
    title: 'Parrainage',
    intro:
      'Le parrainage sert uniquement à suivre qui invite qui : il n’y a pas de réduction ni d’avantage automatique. Partage ton lien FitMangas avec ton code.',
    yourCode: 'Ton code et ton lien',
    noCode: 'Ton code de parrainage sera disponible sous peu. Reviens plus tard ou contacte le support.',
    listTitle: 'Tes filleules',
    colName: 'Prénom ou contact',
    colDate: 'Date',
    colStatus: 'Statut',
    empty: 'Personne n’a encore utilisé ton lien.',
    stPending: 'Invitation',
    stSignedUp: 'Inscrite',
    stSubscribed: 'Abonnée',
    whatsappMessage: 'Rejoins les cours FitMangas avec ce lien : {{URL}}',
  },
  es: {
    kicker: 'Comunidad',
    title: 'Referidos',
    intro:
      'El referido sirve solo para saber quién invita a quién: no hay descuento ni ventaja automática. Comparte tu enlace FitMangas con tu código.',
    yourCode: 'Tu código y tu enlace',
    noCode: 'Tu código de referido estará disponible pronto. Vuelve más tarde o contacta soporte.',
    listTitle: 'Tus referidas',
    colName: 'Nombre o contacto',
    colDate: 'Fecha',
    colStatus: 'Estado',
    empty: 'Nadie ha usado aún tu enlace.',
    stPending: 'Invitación',
    stSignedUp: 'Registrada',
    stSubscribed: 'Suscrita',
    whatsappMessage: 'Únete a FitMangas con este enlace: {{URL}}',
  },
};
