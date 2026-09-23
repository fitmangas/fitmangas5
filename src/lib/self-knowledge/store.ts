import { LEAD_SCORE_DELTA, clampLeadScore } from '@/lib/acquisition/engine/lead-score';
import {
  createNewsletterConfirmationToken,
  sendNewsletterConfirmationEmail,
} from '@/lib/blog/newsletter-double-optin';
import { createAdminClient } from '@/lib/supabase/admin';
import { promoteEmailToMemberFlow } from './email-flow-priority';
import { computeHealthScores } from './health-scores';
import { selfTestAcqTag } from './scoring';
import type {
  HealthMetricInput,
  HealthScores,
  SelfTestAnalysis,
  SelfTestAnswers,
  SelfTestLang,
  SelfTestScores,
  SelfTestSlug,
} from './types';

export const HEALTH_CONSENT_VERSION = 'health-v1';

/** Normalise email lead/compte pour rattachement fiable (trim + lower). */
export function normalizeSelfTestEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type SelfTestResultRow = {
  id: string;
  test_slug: string;
  locale: string;
  email: string | null;
  profile_id: string | null;
  answers: SelfTestAnswers;
  scores: SelfTestScores;
  analysis_teaser: string | null;
  analysis_full: string | null;
  analysis_mode: string | null;
  consent: boolean;
  consent_at: string | null;
  first_name: string | null;
  source_attribution: Record<string, unknown> | string | null;
  test_version?: string | null;
  created_at: string;
};

export type ReadingResourceRow = {
  id: string;
  title: string;
  author: string;
  theme: string;
  why_text: string;
  locale: string;
  sort_order: number;
  affiliate_url?: string | null;
  disclosure?: boolean;
  resource_type?: string;
  /** Chemin local (ex. /library/book-covers/…) ou URL — jamais photo coach. */
  cover_image_url?: string | null;
};

export type HealthEntryRow = {
  id: string;
  profile_id: string;
  scores: HealthScores;
  source: string;
  created_at: string;
  sleep_hours: number | null;
  resting_hr: number | null;
  hrv_ms: number | null;
  active_minutes: number | null;
  regularity_sessions: number | null;
  note: string | null;
};

export type HealthConsentRow = {
  id: string;
  profile_id: string;
  version: string;
  consented_at: string;
};

export type SavePublicSelfTestInput = {
  slug: SelfTestSlug;
  locale: SelfTestLang;
  email: string;
  firstName: string;
  answers: SelfTestAnswers;
  scores: SelfTestScores;
  analysis: SelfTestAnalysis;
  consent: true;
  /** Opt-in blog articles (double opt-in) — séparé du consentement acquisition. */
  blogOptIn?: boolean;
  source?: Record<string, string>;
};

export type SavePublicSelfTestResult =
  | { ok: true; resultId: string; contactId: string; blogOptInPending?: boolean }
  | { ok: false; error: string; status: number };

export async function savePublicSelfTestResult(
  input: SavePublicSelfTestInput,
): Promise<SavePublicSelfTestResult> {
  const email = normalizeSelfTestEmail(input.email);
  const firstName = input.firstName.trim();
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const testTag = selfTestAcqTag(input.slug);
  const tagsWanted = ['self-test', testTag];
  const sourceAttribution = {
    channel: 'self-test',
    slug: input.slug,
    ...(input.source ?? {}),
  };

  const { data: existing } = await admin
    .from('acq_contacts')
    .select('id, tags, lead_score, email')
    .ilike('email', email)
    .limit(1)
    .maybeSingle();

  let contactId: string;

  if (existing?.id) {
    const prevTags = Array.isArray(existing.tags) ? (existing.tags as string[]) : [];
    const tags = Array.from(new Set([...prevTags, ...tagsWanted]));
    const hadEmail = Boolean(existing.email);
    const nextScore = hadEmail
      ? Number(existing.lead_score ?? 0)
      : clampLeadScore(Number(existing.lead_score ?? 0) + LEAD_SCORE_DELTA.email_captured);

    const { error: updErr } = await admin
      .from('acq_contacts')
      .update({
        email,
        display_name: firstName,
        handle: firstName,
        opt_in: true,
        lifecycle_stage: 'qualified',
        tags,
        source_attribution: `self-test/${input.slug}`,
        lead_score: nextScore,
        updated_at: now,
      })
      .eq('id', existing.id);

    if (updErr) {
      console.error('[self-test] acq update', updErr);
      return { ok: false, error: updErr.message, status: 500 };
    }
    contactId = existing.id;
  } else {
    const { data: inserted, error: insErr } = await admin
      .from('acq_contacts')
      .insert({
        channel: 'email',
        handle: firstName,
        display_name: firstName,
        email,
        opt_in: true,
        lifecycle_stage: 'qualified',
        tags: tagsWanted,
        source_attribution: `self-test/${input.slug}`,
        lead_score: LEAD_SCORE_DELTA.email_captured,
        external_ids: {},
      })
      .select('id')
      .maybeSingle();

    if (insErr || !inserted?.id) {
      console.error('[self-test] acq insert', insErr);
      return { ok: false, error: insErr?.message ?? 'Impossible de créer le contact.', status: 500 };
    }
    contactId = inserted.id;
  }

  const { data: row, error: resultErr } = await admin
    .from('self_test_results')
    .insert({
      test_slug: input.slug,
      locale: input.locale,
      email,
      profile_id: null,
      answers: input.answers,
      scores: input.scores,
      analysis_teaser: input.analysis.teaser,
      analysis_full: input.analysis.full,
      analysis_mode: input.analysis.mode,
      analysis_strengths: input.analysis.strengths ?? [],
      acq_contact_id: contactId,
      test_version:
        input.analysis.instrumentVersion ??
        (input.slug === 'big-five' ? 'ipip-50' : 'ecr-s'),
      consent: true,
      consent_at: now,
      first_name: firstName,
      source_attribution: {
        ...sourceAttribution,
        format: input.analysis.instrumentVersion ?? null,
        portrait: input.analysis.portrait?.name ?? null,
      },
    })
    .select('id')
    .maybeSingle();

  if (resultErr || !row?.id) {
    console.error('[self-test] result insert', resultErr);
    return { ok: false, error: resultErr?.message ?? 'Impossible d’enregistrer le résultat.', status: 500 };
  }

  let blogOptInPending = false;
  if (input.blogOptIn === true) {
    try {
      const { data: coach } = await admin.from('profiles').select('id').eq('role', 'admin').limit(1).maybeSingle();
      if (coach?.id) {
        const { data: sub, error: subErr } = await admin
          .from('newsletter_subscriptions')
          .upsert(
            {
              email,
              coach_id: coach.id,
              subscribed_from_article_id: null,
              confirmed: false,
              confirmed_at: null,
              unsubscribed: false,
            },
            { onConflict: 'email,coach_id' },
          )
          .select('id, confirmed')
          .maybeSingle();

        if (subErr) {
          console.error('[self-test] blog opt-in upsert', subErr);
        } else if (sub?.id && !sub.confirmed) {
          const token = await createNewsletterConfirmationToken(String(sub.id));
          await sendNewsletterConfirmationEmail(email, token);
          blogOptInPending = true;
        }
      } else {
        console.error('[self-test] blog opt-in: coach admin introuvable');
      }
    } catch (e) {
      console.error('[self-test] blog opt-in', e);
    }
  }

  return { ok: true, resultId: row.id, contactId, blogOptInPending };
}

export type SaveMemberSelfTestInput = {
  slug: SelfTestSlug;
  locale: SelfTestLang;
  profileId: string;
  email: string;
  firstName: string | null;
  answers: SelfTestAnswers;
  scores: SelfTestScores;
  analysis: SelfTestAnalysis;
};

export async function saveMemberSelfTestResult(
  input: SaveMemberSelfTestInput,
): Promise<{ ok: true; resultId: string } | { ok: false; error: string; status: number }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const email = normalizeSelfTestEmail(input.email);

  const { data: row, error } = await admin
    .from('self_test_results')
    .insert({
      test_slug: input.slug,
      locale: input.locale,
      email,
      profile_id: input.profileId,
      answers: input.answers,
      scores: input.scores,
      analysis_teaser: input.analysis.teaser,
      analysis_full: input.analysis.full,
      analysis_mode: input.analysis.mode,
      analysis_strengths: input.analysis.strengths ?? [],
      test_version:
        input.analysis.instrumentVersion ??
        (input.slug === 'big-five' ? 'ipip-50' : 'ecr-s'),
      consent: true,
      consent_at: now,
      first_name: input.firstName,
      source_attribution: {
        channel: 'compte',
        slug: input.slug,
        format: input.analysis.instrumentVersion ?? null,
        portrait: input.analysis.portrait?.name ?? null,
      },
    })
    .select('id')
    .maybeSingle();

  if (error || !row?.id) {
    console.error('[self-test] member result insert', error);
    return { ok: false, error: error?.message ?? 'Enregistrement impossible.', status: 500 };
  }

  return { ok: true, resultId: row.id };
}

/**
 * Rattache les résultats publics (profile_id null) au compte nouvellement créé.
 * Email normalisé en lower — même logique que le sync Stripe.
 * Idempotent : ne touche pas aux lignes déjà liées.
 */
export async function attachSelfTestResultsToProfile(
  email: string | null | undefined,
  profileId: string,
): Promise<number> {
  if (!email?.trim() || !profileId) return 0;
  const normalized = normalizeSelfTestEmail(email);

  const admin = createAdminClient();
  // eq sur email déjà stocké en lower ; filet ilike si ancienne casse résiduelle
  const { data: byExact, error: errExact } = await admin
    .from('self_test_results')
    .update({ profile_id: profileId, updated_at: new Date().toISOString() })
    .eq('email', normalized)
    .is('profile_id', null)
    .select('id');

  if (errExact) {
    console.error('[self-test] attach to profile (eq)', errExact);
  }

  let attached = byExact?.length ?? 0;

  // Filet : emails à casse différente encore orphelins
  const { data: byIlike, error: errIlike } = await admin
    .from('self_test_results')
    .update({ profile_id: profileId, updated_at: new Date().toISOString() })
    .ilike('email', normalized)
    .is('profile_id', null)
    .select('id');

  if (errIlike) {
    console.error('[self-test] attach to profile (ilike)', errIlike);
  } else {
    attached += byIlike?.length ?? 0;
  }

  // Déduplication email : membre gagne sur acquisition + blog public
  try {
    await promoteEmailToMemberFlow(normalized, profileId);
  } catch (e) {
    console.error('[self-test] promoteEmailToMemberFlow', e);
  }

  return attached;
}

export async function listResultsForProfile(profileId: string): Promise<SelfTestResultRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('self_test_results')
    .select(
      'id, test_slug, locale, email, profile_id, answers, scores, analysis_teaser, analysis_full, analysis_mode, consent, consent_at, first_name, source_attribution, test_version, created_at',
    )
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[self-test] list results', error);
    return [];
  }
  return (data ?? []) as SelfTestResultRow[];
}

/** Une passation appartenant au profil (rapport membre). */
export async function getResultByIdForProfile(
  profileId: string,
  resultId: string,
): Promise<SelfTestResultRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('self_test_results')
    .select(
      'id, test_slug, locale, email, profile_id, answers, scores, analysis_teaser, analysis_full, analysis_mode, consent, consent_at, first_name, source_attribution, test_version, created_at',
    )
    .eq('id', resultId)
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) {
    console.error('[self-test] get result', error);
    return null;
  }
  return (data as SelfTestResultRow | null) ?? null;
}

export async function saveHealthConsent(profileId: string): Promise<HealthConsentRow | null> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('health_consents')
    .insert({
      profile_id: profileId,
      version: HEALTH_CONSENT_VERSION,
      consented_at: now,
    })
    .select('id, profile_id, version, consented_at')
    .maybeSingle();

  if (error) {
    console.error('[self-test] health consent', error);
    return null;
  }
  return data as HealthConsentRow;
}

export async function getLatestHealthConsent(profileId: string): Promise<HealthConsentRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('health_consents')
    .select('id, profile_id, version, consented_at')
    .eq('profile_id', profileId)
    .order('consented_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[self-test] get health consent', error);
    return null;
  }
  return data as HealthConsentRow | null;
}

export type SaveHealthEntryInput = {
  profileId: string;
  consentId: string;
  metrics: HealthMetricInput;
  note?: string | null;
};

export async function saveHealthEntry(
  input: SaveHealthEntryInput,
): Promise<{ ok: true; entryId: string; scores: HealthScores } | { ok: false; error: string; status: number }> {
  const admin = createAdminClient();
  const consent = await getLatestHealthConsent(input.profileId);
  if (!consent || consent.id !== input.consentId) {
    return { ok: false, error: 'Consentement santé requis.', status: 403 };
  }

  const scores = computeHealthScores(input.metrics);
  const payload: Record<string, unknown> = {
    profile_id: input.profileId,
    consent_id: input.consentId,
    regularity_sessions: input.metrics.sessionsPerWeek,
    sleep_hours: input.metrics.sleepHours,
    resting_hr: input.metrics.restingHr,
    active_minutes: input.metrics.activeMinutes,
    scores,
    note: input.note ?? null,
    source: 'manual',
  };
  if (input.metrics.hrvMs != null) {
    payload.hrv_ms = input.metrics.hrvMs;
  }

  const { data, error } = await admin.from('health_score_entries').insert(payload).select('id').maybeSingle();

  if (error || !data?.id) {
    console.error('[self-test] health entry', error);
    return { ok: false, error: error?.message ?? 'Enregistrement impossible.', status: 500 };
  }

  return { ok: true, entryId: data.id, scores };
}

export async function listReadingResources(locale: SelfTestLang): Promise<ReadingResourceRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('reading_resources')
    .select(
      'id, title, author, theme, why_text, locale, sort_order, affiliate_url, disclosure, resource_type, cover_image_url',
    )
    .eq('published', true)
    .eq('locale', locale)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[self-test] reading resources', error);
    return [];
  }
  return (data ?? []) as ReadingResourceRow[];
}

export async function listHealthEntries(
  profileId: string,
  limit = 24,
): Promise<HealthEntryRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('health_score_entries')
    .select(
      'id, profile_id, scores, source, created_at, sleep_hours, resting_hr, hrv_ms, active_minutes, regularity_sessions, note',
    )
    .eq('profile_id', profileId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[self-test] list health entries', error);
    return [];
  }
  return (data ?? []) as HealthEntryRow[];
}

export type JournalEntryRow = {
  id: string;
  victory: string;
  friction: string;
  next_step: string;
  created_at: string;
};

export async function listJournalEntries(profileId: string, limit = 20): Promise<JournalEntryRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('journal_entries')
    .select('id, victory, friction, next_step, created_at')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[journal] list', error);
    return [];
  }
  return (data ?? []) as JournalEntryRow[];
}

export async function insertJournalEntry(input: {
  profileId: string;
  victory: string;
  friction: string;
  nextStep: string;
  locale: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('journal_entries')
    .insert({
      profile_id: input.profileId,
      victory: input.victory.trim(),
      friction: input.friction.trim(),
      next_step: input.nextStep.trim(),
      locale: input.locale,
    })
    .select('id')
    .maybeSingle();
  if (error || !data?.id) return { ok: false, error: error?.message ?? 'Erreur' };
  return { ok: true, id: data.id };
}

