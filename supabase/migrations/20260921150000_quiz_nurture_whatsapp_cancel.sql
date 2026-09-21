-- WhatsApp status + cancel nurture quiz

alter table public.quiz_leads
  add column if not exists nurture_whatsapp_sent_at timestamptz,
  add column if not exists nurture_whatsapp_status text,
  add column if not exists nurture_cancelled_at timestamptz,
  add column if not exists nurture_cancel_reason text;

comment on column public.quiz_leads.nurture_whatsapp_status is 'sent | failed | awaiting_optin | skipped';
comment on column public.quiz_leads.nurture_cancelled_at is 'Nurture stoppée (essai/paid/optout).';
