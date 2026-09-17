-- Additive: score lead Acquisition (conversion)
begin;

alter table public.acq_contacts
  add column if not exists lead_score integer not null default 0
  check (lead_score >= 0 and lead_score <= 100);

create index if not exists acq_contacts_lead_score_idx
  on public.acq_contacts (lead_score desc);

comment on column public.acq_contacts.lead_score is
  'Score conversion 0–100 (inbound, tags, email, booking, Stripe).';

commit;
