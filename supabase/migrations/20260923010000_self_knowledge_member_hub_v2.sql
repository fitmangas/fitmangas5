-- Additive hub membre connaissance de soi (applied via MCP 2026-09-23)
-- See supabase MCP migration: self_knowledge_member_hub_v2

CREATE TABLE IF NOT EXISTS public.member_progress_monthly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month text NOT NULL,
  lives integer NOT NULL DEFAULT 0,
  replay_hours numeric NOT NULL DEFAULT 0,
  sessions integer NOT NULL DEFAULT 0,
  goal integer NOT NULL DEFAULT 8,
  goal_ratio numeric NOT NULL DEFAULT 0,
  active_weeks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year_month)
);

ALTER TABLE public.health_score_entries
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

CREATE TABLE IF NOT EXISTS public.wearable_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  access_token text NULL,
  refresh_token text NULL,
  token_expires_at timestamptz NULL,
  external_user_id text NULL,
  scopes text NULL,
  connected_at timestamptz NOT NULL DEFAULT now(),
  last_sync_at timestamptz NULL,
  status text NOT NULL DEFAULT 'disconnected',
  UNIQUE (profile_id, provider)
);

CREATE TABLE IF NOT EXISTS public.wearable_metric_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  sample_date date NOT NULL,
  resting_hr numeric NULL,
  hrv_ms numeric NULL,
  active_minutes numeric NULL,
  sleep_hours numeric NULL,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, provider, sample_date)
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  victory text NOT NULL DEFAULT '',
  friction text NOT NULL DEFAULT '',
  next_step text NOT NULL DEFAULT '',
  locale text NOT NULL DEFAULT 'fr',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reflection_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_fr text NOT NULL,
  title_es text NOT NULL,
  body_fr text NOT NULL,
  body_es text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reflection_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id uuid NOT NULL REFERENCES public.reflection_prompts(id) ON DELETE CASCADE,
  response text NOT NULL DEFAULT '',
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.soft_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_fr text NOT NULL,
  title_es text NOT NULL,
  body_fr text NOT NULL,
  body_es text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.challenge_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.soft_challenges(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, challenge_id)
);

ALTER TABLE public.reading_resources
  ADD COLUMN IF NOT EXISTS affiliate_url text NULL,
  ADD COLUMN IF NOT EXISTS disclosure boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resource_type text NOT NULL DEFAULT 'book';

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  resource_id uuid NOT NULL REFERENCES public.reading_resources(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
