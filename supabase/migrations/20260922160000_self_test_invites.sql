-- Additive: invitations RGPD-safe pour le test connaissance de soi (parrainage optionnel).
-- Pas de follow-up auto à l'invitée ; un seul email invite par couple (inviter, invitee).

CREATE TABLE IF NOT EXISTS public.self_test_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_result_id uuid NULL REFERENCES public.self_test_results (id) ON DELETE SET NULL,
  inviter_email text NOT NULL,
  inviter_first_name text,
  invitee_email text NULL,
  share_token text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('share_link', 'email')),
  email_sent_at timestamptz NULL,
  email_sent_count int NOT NULL DEFAULT 0,
  consent_logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS self_test_invites_share_token_uidx
  ON public.self_test_invites (share_token);

-- Une seule invitation email par couple (inviter → invitee)
CREATE UNIQUE INDEX IF NOT EXISTS self_test_invites_email_pair_uidx
  ON public.self_test_invites (lower(inviter_email), lower(invitee_email))
  WHERE channel = 'email' AND invitee_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS self_test_invites_inviter_email_idx
  ON public.self_test_invites (lower(inviter_email));

ALTER TABLE public.self_test_invites ENABLE ROW LEVEL SECURITY;
