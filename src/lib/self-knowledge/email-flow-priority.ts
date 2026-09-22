/**
 * Priorité des flux email FitMangas (anti double-liste).
 *
 * member (abonnement active|trialing) > acquisition > blog_public
 *
 * Une membre ne doit PAS recevoir la newsletter blog publique ni le nurture acquisition :
 * elle est gérée via profiles.marketing_email_opt_in uniquement.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { findUserIdByEmail } from '@/lib/stripe/find-user-by-email';

export type EmailFlowPriority = 'member' | 'acquisition' | 'blog_public' | 'none';

const MEMBER_STATUSES = new Set(['active', 'trialing']);

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type ResolveEmailFlowInput = {
  email: string;
  /** Statut abonnement profil si déjà connu (évite un round-trip). */
  subscriptionStatus?: string | null;
  /** Présence d’un contact acquisition opt-in. */
  hasAcquisitionOptIn?: boolean;
  /** Présence d’une inscription newsletter blog confirmée non désabonnée. */
  hasBlogPublic?: boolean;
};

/**
 * Résout la priorité pure (sans I/O) — utile pour tests et filtres en mémoire.
 */
export function resolveEmailFlowPriority(input: ResolveEmailFlowInput): EmailFlowPriority {
  const status = (input.subscriptionStatus ?? '').trim().toLowerCase();
  if (MEMBER_STATUSES.has(status)) return 'member';
  if (input.hasAcquisitionOptIn) return 'acquisition';
  if (input.hasBlogPublic) return 'blog_public';
  return 'none';
}

/**
 * Charge le statut réel depuis Supabase puis résout la priorité.
 * Membre = auth user + profiles.subscription_status active|trialing.
 */
export async function resolveEmailFlowPriorityFromDb(email: string): Promise<EmailFlowPriority> {
  const normalized = normalizeEmail(email);
  if (!normalized) return 'none';

  const admin = createAdminClient();

  const userId = await findUserIdByEmail(admin, normalized);
  if (userId) {
    const { data: profile } = await admin
      .from('profiles')
      .select('id, subscription_status')
      .eq('id', userId)
      .maybeSingle();
    const status = (profile?.subscription_status as string | null) ?? null;
    if (status && MEMBER_STATUSES.has(status.toLowerCase())) {
      return 'member';
    }
  }

  const { data: acq } = await admin
    .from('acq_contacts')
    .select('id, opt_in, tags, lifecycle_stage')
    .ilike('email', normalized)
    .eq('opt_in', true)
    .limit(1)
    .maybeSingle();

  const tags = Array.isArray(acq?.tags) ? (acq!.tags as string[]) : [];
  const isMemberTagged =
    tags.includes('member') ||
    acq?.lifecycle_stage === 'member' ||
    acq?.lifecycle_stage === 'trial' ||
    acq?.lifecycle_stage === 'paid';

  if (acq && !isMemberTagged) {
    return 'acquisition';
  }

  const { data: blog } = await admin
    .from('newsletter_subscriptions')
    .select('id')
    .ilike('email', normalized)
    .eq('confirmed', true)
    .eq('unsubscribed', false)
    .limit(1)
    .maybeSingle();

  if (blog) return 'blog_public';
  return 'none';
}

export type PromoteEmailResult = {
  ok: boolean;
  newsletterUnsubscribed: number;
  acqUpdated: number;
  detail: string;
};

/**
 * Passe un email en flux « membre » exclusif :
 * 1. newsletter_subscriptions → unsubscribed=true (sortie liste blog public)
 * 2. acq_contacts → opt_in=false + tag `member` + lifecycle_stage=member
 *    (le cron followups annule déjà trial/paid/member)
 *
 * À appeler depuis attachSelfTestResultsToProfile et checkout Stripe.
 */
export async function promoteEmailToMemberFlow(
  email: string,
  profileId: string,
): Promise<PromoteEmailResult> {
  const normalized = normalizeEmail(email);
  if (!normalized || !profileId) {
    return { ok: false, newsletterUnsubscribed: 0, acqUpdated: 0, detail: 'email ou profileId manquant' };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  let newsletterUnsubscribed = 0;
  let acqUpdated = 0;

  // 1) Sortie liste blog public
  const { data: newsRows, error: newsErr } = await admin
    .from('newsletter_subscriptions')
    .update({
      unsubscribed: true,
    })
    .ilike('email', normalized)
    .eq('unsubscribed', false)
    .select('id');

  if (newsErr) {
    console.error('[email-flow] newsletter unsubscribe', newsErr);
  } else {
    newsletterUnsubscribed = newsRows?.length ?? 0;
  }

  // 2) Acquisition : opt_in false + tag member (skip nurture)
  const { data: contacts, error: acqFindErr } = await admin
    .from('acq_contacts')
    .select('id, tags, lifecycle_stage')
    .ilike('email', normalized);

  if (acqFindErr) {
    console.error('[email-flow] acq find', acqFindErr);
  } else {
    for (const c of contacts ?? []) {
      const prevTags = Array.isArray(c.tags) ? (c.tags as string[]) : [];
      const tags = Array.from(new Set([...prevTags, 'member']));
      const { error: updErr } = await admin
        .from('acq_contacts')
        .update({
          opt_in: false,
          tags,
          lifecycle_stage: 'member',
          updated_at: now,
          profile_id: profileId,
        })
        .eq('id', c.id);
      if (updErr) {
        console.error('[email-flow] acq update', updErr);
      } else {
        acqUpdated += 1;
      }
    }
  }

  return {
    ok: true,
    newsletterUnsubscribed,
    acqUpdated,
    detail: `member flow: blog−${newsletterUnsubscribed}, acq−${acqUpdated}`,
  };
}

/**
 * Filtre une liste d’emails pour un envoi newsletter blog :
 * exclut ceux dont la priorité n’est pas blog_public (membres / acquisition win).
 * Documenté pour sendPublicationNewsletter — à brancher côté appelant.
 */
export function filterEmailsForBlogPublicSend(
  emails: string[],
  memberEmails: Set<string>,
): string[] {
  return emails.filter((e) => !memberEmails.has(normalizeEmail(e)));
}
