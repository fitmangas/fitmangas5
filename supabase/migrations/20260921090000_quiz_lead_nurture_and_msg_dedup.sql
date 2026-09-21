-- Quiz lead nurture (email immédiat + J+2 / J+5) + anti-doublon mid IG

alter table public.quiz_leads
  add column if not exists nurture_welcome_sent_at timestamptz,
  add column if not exists nurture_j2_due_at timestamptz,
  add column if not exists nurture_j2_sent_at timestamptz,
  add column if not exists nurture_j5_due_at timestamptz,
  add column if not exists nurture_j5_sent_at timestamptz;

create index if not exists quiz_leads_nurture_j2_due_idx
  on public.quiz_leads (nurture_j2_due_at)
  where nurture_j2_sent_at is null and nurture_j2_due_at is not null;

create index if not exists quiz_leads_nurture_j5_due_idx
  on public.quiz_leads (nurture_j5_due_at)
  where nurture_j5_sent_at is null and nurture_j5_due_at is not null;

comment on column public.quiz_leads.nurture_welcome_sent_at is 'Email profil + CTA essai envoyé (immédiat).';
comment on column public.quiz_leads.nurture_j2_due_at is 'Relance email J+2 planifiée.';
comment on column public.quiz_leads.nurture_j5_due_at is 'Relance email J+5 planifiée.';

-- Anti-doublon Meta : un mid = un seul message stocké
create unique index if not exists acq_messages_external_message_id_uidx
  on public.acq_messages (external_message_id)
  where external_message_id is not null;
