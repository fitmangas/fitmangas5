import { z } from 'zod';

import { LEAD_SCORE_DELTA, clampLeadScore } from '@/lib/acquisition/engine/lead-score';
import { createAdminClient } from '@/lib/supabase/admin';
import { QUIZ_SLUGS } from '@/lib/quiz/catalog';

export const quizLeadBodySchema = z.object({
  locale: z.enum(['fr', 'es']),
  quizSlug: z.string().min(1).max(80),
  firstName: z.string().trim().min(1).max(60),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().min(8).max(32),
  consent: z.literal(true),
  resultId: z.string().min(1).max(40),
  secondaryId: z.string().min(1).max(40).nullable().optional(),
  percents: z.record(z.string(), z.number()).default({}),
  answers: z.record(z.string(), z.string()).default({}),
  source: z
    .object({
      utm_source: z.string().max(80).optional(),
      utm_medium: z.string().max(80).optional(),
      utm_campaign: z.string().max(80).optional(),
    })
    .optional()
    .default({}),
});

export type QuizLeadBody = z.infer<typeof quizLeadBodySchema>;

/** Normalise un téléphone FR/ES vers un format international approximatif. */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let digits = trimmed.replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  if (digits.startsWith('0') && !digits.startsWith('00')) {
    // FR / ES nationaux → +33 / +52 non détectable : on garde 0… et on exige assez de chiffres
    const national = digits.replace(/\D/g, '');
    if (national.length < 9 || national.length > 15) return null;
    return national;
  }
  const compact = digits.startsWith('+')
    ? `+${digits.slice(1).replace(/\D/g, '')}`
    : digits.replace(/\D/g, '');
  const count = compact.replace(/\D/g, '').length;
  if (count < 8 || count > 15) return null;
  return compact;
}

export type SaveQuizLeadResult =
  | { ok: true; leadId: string; contactId: string }
  | { ok: false; error: string; status: number };

export async function saveQuizLead(input: QuizLeadBody): Promise<SaveQuizLeadResult> {
  if (!QUIZ_SLUGS.includes(input.quizSlug)) {
    return { ok: false, error: 'Quiz inconnu.', status: 400 };
  }

  const phone = normalizePhone(input.phone);
  if (!phone) {
    return { ok: false, error: 'Numéro de téléphone invalide.', status: 400 };
  }

  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName.trim();
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const quizTag = `quiz:${input.quizSlug}`;
  const resultTag = `result:${input.resultId}`;
  const tagsWanted = ['quiz', quizTag, resultTag];

  const { data: existing } = await admin
    .from('acq_contacts')
    .select('id, tags, lead_score, email, phone, display_name')
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
        phone,
        display_name: firstName,
        handle: firstName,
        opt_in: true,
        lifecycle_stage: 'qualified',
        tags,
        source_attribution: `quiz/${input.quizSlug}`,
        lead_score: nextScore,
        updated_at: now,
      })
      .eq('id', existing.id);

    if (updErr) {
      console.error('[quiz-lead] acq update', updErr);
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
        phone,
        opt_in: true,
        lifecycle_stage: 'qualified',
        tags: tagsWanted,
        source_attribution: `quiz/${input.quizSlug}`,
        lead_score: LEAD_SCORE_DELTA.email_captured,
        external_ids: {},
      })
      .select('id')
      .maybeSingle();

    if (insErr || !inserted?.id) {
      console.error('[quiz-lead] acq insert', insErr);
      return { ok: false, error: insErr?.message ?? 'Impossible de créer le contact.', status: 500 };
    }
    contactId = inserted.id;
  }

  const { data: lead, error: leadErr } = await admin
    .from('quiz_leads')
    .insert({
      locale: input.locale,
      quiz_slug: input.quizSlug,
      first_name: firstName,
      email,
      phone,
      result_id: input.resultId,
      secondary_id: input.secondaryId ?? null,
      percents: input.percents,
      answers: input.answers,
      consent_at: now,
      source: input.source ?? {},
      acq_contact_id: contactId,
    })
    .select('id')
    .maybeSingle();

  if (leadErr || !lead?.id) {
    console.error('[quiz-lead] insert', leadErr);
    return { ok: false, error: leadErr?.message ?? 'Impossible d’enregistrer le lead.', status: 500 };
  }

  return { ok: true, leadId: lead.id, contactId };
}
