-- Additive: self-knowledge engine columns (already applied on prod via MCP)
-- Tables self_test_results, health_consents, health_score_entries, reading_resources
-- created earlier; this file documents hrv + strengths + acq_contact_id + test_version.

ALTER TABLE public.self_test_results
  ADD COLUMN IF NOT EXISTS analysis_strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS acq_contact_id uuid NULL REFERENCES public.acq_contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS test_version text NULL;

ALTER TABLE public.health_score_entries
  ADD COLUMN IF NOT EXISTS hrv_ms numeric NULL;

CREATE INDEX IF NOT EXISTS self_test_results_email_idx
  ON public.self_test_results (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS self_test_results_profile_idx
  ON public.self_test_results (profile_id) WHERE profile_id IS NOT NULL;
