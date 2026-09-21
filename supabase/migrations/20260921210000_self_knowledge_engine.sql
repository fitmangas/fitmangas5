-- Additive self-knowledge engine (reference / catch-up). Applied on prod via MCP.
-- Does NOT touch quiz_leads.

CREATE TABLE IF NOT EXISTS public.self_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_slug text NOT NULL,
  locale text NOT NULL DEFAULT 'fr',
  email text NULL,
  profile_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  analysis_teaser text NULL,
  analysis_full text NULL,
  analysis_mode text NOT NULL DEFAULT 'template',
  analysis_strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  acq_contact_id uuid NULL REFERENCES public.acq_contacts(id) ON DELETE SET NULL,
  test_version text NULL,
  consent boolean NOT NULL DEFAULT false,
  consent_at timestamptz NULL,
  first_name text NULL,
  source_attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version text NOT NULL DEFAULT 'v1',
  consented_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.health_score_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_id uuid NOT NULL REFERENCES public.health_consents(id) ON DELETE RESTRICT,
  regularity_sessions numeric NULL,
  sleep_hours numeric NULL,
  resting_hr numeric NULL,
  hrv_ms numeric NULL,
  active_minutes numeric NULL,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reading_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  theme text NOT NULL DEFAULT '',
  why_text text NOT NULL DEFAULT '',
  locale text NOT NULL DEFAULT 'fr',
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.self_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_score_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_resources ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'self_test_results_owner_select'
  ) THEN
    CREATE POLICY self_test_results_owner_select ON public.self_test_results
      FOR SELECT TO authenticated
      USING (profile_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'health_consents_owner_select'
  ) THEN
    CREATE POLICY health_consents_owner_select ON public.health_consents
      FOR SELECT TO authenticated
      USING (profile_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'health_score_entries_owner_select'
  ) THEN
    CREATE POLICY health_score_entries_owner_select ON public.health_score_entries
      FOR SELECT TO authenticated
      USING (profile_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'reading_resources_public_select'
  ) THEN
    CREATE POLICY reading_resources_public_select ON public.reading_resources
      FOR SELECT TO anon, authenticated
      USING (published = true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS self_test_results_email_idx
  ON public.self_test_results (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS self_test_results_profile_idx
  ON public.self_test_results (profile_id) WHERE profile_id IS NOT NULL;
