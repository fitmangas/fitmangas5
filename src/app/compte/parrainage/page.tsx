import { createClient } from '@/lib/supabase/server';
import { getClientLang } from '@/lib/compte/i18n';
import { ParrainageShareButtons } from '@/components/Compte/ParrainageShareButtons';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  isReferralRewardProgram,
  resolveReferrerReferralProgram,
  type ReferralProgramKind,
} from '@/lib/referrals/referral-program';
import { countActiveQualifiedReferrals, REFERRAL_REWARD_THRESHOLD } from '@/lib/referrals/reward';

const APP = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com';

export default async function CompteParrainagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const lang = await getClientLang(supabase, user.id);
  const t = copy[lang === 'es' ? 'es' : 'fr'];

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'first_name, referral_code, referral_reward_active, subscription_type, last_checkout_course_id, subscription_status',
    )
    .eq('id', user.id)
    .maybeSingle();

  const program = resolveReferrerReferralProgram(profile ?? {});
  const rewardEligible = isReferralRewardProgram(program);
  const programCopy = t.program[program];

  const code = profile?.referral_code?.trim() || '';
  const base = APP.replace(/\/$/, '');
  const shareUrl = code ? `${base}/?ref=${encodeURIComponent(code)}` : base;

  const admin = createAdminClient();
  const activeCount = rewardEligible ? await countActiveQualifiedReferrals(admin, user.id) : 0;
  const remaining = Math.max(0, REFERRAL_REWARD_THRESHOLD - activeCount);
  const progressPct = rewardEligible
    ? Math.min(100, Math.round((activeCount / REFERRAL_REWARD_THRESHOLD) * 100))
    : 0;
  const rewardActive = rewardEligible && Boolean(profile?.referral_reward_active);

  const { data: filleules } = await supabase
    .from('referrals')
    .select('referred_email, status, created_at, referred_user_id')
    .eq('referrer_user_id', user.id)
    .order('created_at', { ascending: false });

  const ids = [...new Set((filleules ?? []).map((r) => r.referred_user_id).filter(Boolean))] as string[];
  const { data: names } = ids.length
    ? await supabase.from('profiles').select('id, first_name').in('id', ids)
    : { data: [] as { id: string; first_name: string | null }[] };
  const nameById = new Map((names ?? []).map((n) => [n.id, n.first_name]));

  const whatsappText = programCopy.whatsappMessage.replace('{{URL}}', shareUrl);

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-2 py-8 md:px-0">
      <div>
        <h1 className="hero-signature-title text-3xl text-luxury-ink">{t.title}</h1>
        <p className="mt-3 text-sm leading-6 text-luxury-muted">{programCopy.intro}</p>
      </div>

      {rewardEligible ? (
        <section className="glass-card rounded-3xl border border-white/45 p-6">
          <h2 className="text-lg font-semibold text-luxury-ink">{t.rewardTitle}</h2>
          <p className="mt-2 text-sm text-luxury-muted">
            {activeCount >= REFERRAL_REWARD_THRESHOLD
              ? programCopy.rewardUnlocked
              : programCopy.rewardProgress
                  .replace('{{ACTIVE}}', String(activeCount))
                  .replace('{{REMAINING}}', String(remaining))}
          </p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-luxury-orange to-[#e8a88a] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={activeCount}
              aria-valuemin={0}
              aria-valuemax={REFERRAL_REWARD_THRESHOLD}
              aria-label={t.rewardTitle}
            />
          </div>
          <p className="mt-2 text-center text-xs font-semibold tabular-nums text-luxury-ink">
            {activeCount}/{REFERRAL_REWARD_THRESHOLD} {programCopy.rewardCountLabel}
          </p>
          {rewardActive ? (
            <p className="mt-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-900">
              {programCopy.rewardActiveBadge}
            </p>
          ) : null}
        </section>
      ) : (
        <section className="glass-card rounded-3xl border border-amber-200/50 bg-amber-50/40 p-6">
          <p className="text-sm leading-relaxed text-luxury-ink">{programCopy.intro}</p>
        </section>
      )}

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
                      <td className="py-3">{labelStatus(row.status, programCopy)}</td>
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

function labelStatus(status: string, programCopy: ProgramCopySlice) {
  if (status === 'subscribed') return programCopy.stSubscribed;
  if (status === 'signed_up') return programCopy.stSignedUp;
  return programCopy.stPending;
}

type ProgramCopySlice = {
  intro: string;
  rewardProgress: string;
  rewardUnlocked: string;
  rewardCountLabel: string;
  rewardActiveBadge: string;
  stSubscribed: string;
  stSignedUp: string;
  stPending: string;
  whatsappMessage: string;
};

const copy = {
  fr: {
    title: 'Parrainage',
    rewardTitle: 'Ton abonnement offert',
    yourCode: 'Ton code et ton lien',
    noCode: 'Ton code de parrainage sera disponible sous peu. Reviens plus tard ou contacte le support.',
    listTitle: 'Tes filleules',
    colName: 'Prénom ou contact',
    colDate: 'Date',
    colStatus: 'Statut',
    empty: 'Personne n’a encore utilisé ton lien.',
    program: {
      presentiel: {
        intro: 'Le programme de parrainage est réservé aux abonnements Visio.',
        rewardProgress: '',
        rewardUnlocked: '',
        rewardCountLabel: '',
        rewardActiveBadge: '',
        stPending: 'Invitation',
        stSignedUp: 'Inscrite',
        stSubscribed: 'Abonnée',
        whatsappMessage: 'Découvre FitMangas : {{URL}}',
      },
      visio_collectif: {
        intro: 'Invite 5 amies à rejoindre l’abonnement Visio et ton abonnement sera offert !',
        rewardProgress: '{{ACTIVE}}/5 filleules actives — encore {{REMAINING}} pour ton abonnement offert !',
        rewardUnlocked: 'Bravo ! Tu as 5 filleules actives : ton abonnement Visio est offert.',
        rewardCountLabel: 'filleules actives (Visio)',
        rewardActiveBadge: 'Récompense active : ta prochaine facture Visio est couverte.',
        stPending: 'Invitation',
        stSignedUp: 'Inscrite',
        stSubscribed: 'Abonnée Visio',
        whatsappMessage: 'Rejoins FitMangas en Visio avec ce lien : {{URL}}',
      },
      visio_individuel: {
        intro: 'Invite 5 amies à rejoindre l’abonnement Visio Individuel et ton abonnement sera offert !',
        rewardProgress: '{{ACTIVE}}/5 filleules actives — encore {{REMAINING}} pour ton abonnement offert !',
        rewardUnlocked: 'Bravo ! Tu as 5 filleules actives : ton abonnement Visio Individuel est offert.',
        rewardCountLabel: 'filleules actives (Visio Individuel)',
        rewardActiveBadge: 'Récompense active : ta prochaine facture Visio Individuel est couverte.',
        stPending: 'Invitation',
        stSignedUp: 'Inscrite',
        stSubscribed: 'Abonnée Visio Individuel',
        whatsappMessage: 'Rejoins FitMangas en Visio Individuel avec ce lien : {{URL}}',
      },
      none: {
        intro: 'Invite 5 amies à rejoindre l’abonnement Visio et ton abonnement sera offert !',
        rewardProgress: '{{ACTIVE}}/5 filleules actives — encore {{REMAINING}} pour ton abonnement offert !',
        rewardUnlocked: 'Bravo ! Tu as 5 filleules actives : ton abonnement est offert.',
        rewardCountLabel: 'filleules actives',
        rewardActiveBadge: 'Récompense active : ta prochaine facture est couverte.',
        stPending: 'Invitation',
        stSignedUp: 'Inscrite',
        stSubscribed: 'Abonnée',
        whatsappMessage: 'Rejoins FitMangas avec ce lien : {{URL}}',
      },
    } satisfies Record<ReferralProgramKind, ProgramCopySlice>,
  },
  es: {
    title: 'Referidos',
    rewardTitle: 'Tu suscripción gratis',
    yourCode: 'Tu código y tu enlace',
    noCode: 'Tu código de referido estará disponible pronto. Vuelve más tarde o contacta soporte.',
    listTitle: 'Tus referidas',
    colName: 'Nombre o contacto',
    colDate: 'Fecha',
    colStatus: 'Estado',
    empty: 'Nadie ha usado aún tu enlace.',
    program: {
      presentiel: {
        intro: 'El programa de referidos está reservado a las suscripciones Visio.',
        rewardProgress: '',
        rewardUnlocked: '',
        rewardCountLabel: '',
        rewardActiveBadge: '',
        stPending: 'Invitación',
        stSignedUp: 'Registrada',
        stSubscribed: 'Suscrita',
        whatsappMessage: 'Descubre FitMangas: {{URL}}',
      },
      visio_collectif: {
        intro: '¡Invita a 5 amigas al plan Visio y tu suscripción será gratis!',
        rewardProgress: '{{ACTIVE}}/5 referidas activas — ¡faltan {{REMAINING}} para tu suscripción gratis!',
        rewardUnlocked: '¡Genial! Tienes 5 referidas activas: tu suscripción Visio es gratis.',
        rewardCountLabel: 'referidas activas (Visio)',
        rewardActiveBadge: 'Recompensa activa: tu próxima factura Visio está cubierta.',
        stPending: 'Invitación',
        stSignedUp: 'Registrada',
        stSubscribed: 'Suscrita Visio',
        whatsappMessage: 'Únete a FitMangas en Visio con este enlace: {{URL}}',
      },
      visio_individuel: {
        intro: '¡Invita a 5 amigas al plan Visio Individual y tu suscripción será gratis!',
        rewardProgress: '{{ACTIVE}}/5 referidas activas — ¡faltan {{REMAINING}} para tu suscripción gratis!',
        rewardUnlocked: '¡Genial! Tienes 5 referidas activas: tu Visio Individual es gratis.',
        rewardCountLabel: 'referidas activas (Visio Individual)',
        rewardActiveBadge: 'Recompensa activa: tu próxima factura Visio Individual está cubierta.',
        stPending: 'Invitación',
        stSignedUp: 'Registrada',
        stSubscribed: 'Suscrita Visio Individual',
        whatsappMessage: 'Únete a FitMangas en Visio Individual con este enlace: {{URL}}',
      },
      none: {
        intro: '¡Invita a 5 amigas al plan Visio y tu suscripción será gratis!',
        rewardProgress: '{{ACTIVE}}/5 referidas activas — ¡faltan {{REMAINING}}!',
        rewardUnlocked: '¡Genial! Tienes 5 referidas activas: tu suscripción es gratis.',
        rewardCountLabel: 'referidas activas',
        rewardActiveBadge: 'Recompensa activa: tu próxima factura está cubierta.',
        stPending: 'Invitación',
        stSignedUp: 'Registrada',
        stSubscribed: 'Suscrita',
        whatsappMessage: 'Únete a FitMangas con este enlace: {{URL}}',
      },
    } satisfies Record<ReferralProgramKind, ProgramCopySlice>,
  },
};
