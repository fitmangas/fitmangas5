begin;

-- Module Acquisition — CRM léger + inbox + workflows (§9)

create table if not exists public.acq_contacts (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('instagram', 'facebook', 'whatsapp', 'email', 'blog_seo', 'referral', 'other')),
  handle text,
  email text,
  opt_in boolean not null default false,
  lifecycle_stage text not null default 'new'
    check (lifecycle_stage in ('new', 'qualified', 'trial', 'paid', 'member')),
  tags text[] not null default '{}',
  source_attribution text,
  profile_id uuid references public.profiles(id) on delete set null,
  external_ids jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists acq_contacts_channel_idx on public.acq_contacts (channel);
create index if not exists acq_contacts_lifecycle_idx on public.acq_contacts (lifecycle_stage);
create index if not exists acq_contacts_email_idx on public.acq_contacts (lower(email)) where email is not null;

create table if not exists public.acq_conversations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.acq_contacts(id) on delete cascade,
  channel text not null check (channel in ('instagram', 'facebook', 'whatsapp', 'email', 'blog_seo', 'referral', 'other')),
  status text not null default 'open' check (status in ('open', 'waiting', 'closed', 'escalated')),
  lifecycle_stage text not null default 'new'
    check (lifecycle_stage in ('new', 'qualified', 'trial', 'paid', 'member')),
  subject text,
  external_thread_id text,
  last_message_at timestamptz,
  last_message_preview text,
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists acq_conversations_contact_idx on public.acq_conversations (contact_id);
create index if not exists acq_conversations_last_msg_idx on public.acq_conversations (last_message_at desc nulls last);

create table if not exists public.acq_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.acq_conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound', 'system')),
  body text not null,
  provider text,
  external_message_id text,
  sandbox boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists acq_messages_conversation_idx on public.acq_messages (conversation_id, created_at);

create table if not exists public.acq_workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  enabled boolean not null default true,
  trigger_type text not null check (trigger_type in (
    'ig_comment_keyword', 'ig_dm_inbound', 'ig_story_reply',
    'messenger_inbound', 'whatsapp_inbound', 'email_inbound'
  )),
  trigger_config jsonb not null default '{}',
  conditions jsonb not null default '{}',
  actions jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.acq_workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid references public.acq_workflows(id) on delete set null,
  contact_id uuid references public.acq_contacts(id) on delete set null,
  conversation_id uuid references public.acq_conversations(id) on delete set null,
  status text not null check (status in ('ok', 'error', 'partial')),
  log jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists acq_workflow_runs_created_idx on public.acq_workflow_runs (created_at desc);

create table if not exists public.acq_booking_intents (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.acq_contacts(id) on delete cascade,
  course_type text not null check (course_type in ('visio_collectif', 'nantes_presentiel')),
  course_id uuid references public.courses(id) on delete set null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.acq_followups (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.acq_contacts(id) on delete cascade,
  conversation_id uuid references public.acq_conversations(id) on delete set null,
  action_type text not null,
  run_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'sent', 'cancelled', 'error')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists acq_followups_run_at_idx on public.acq_followups (run_at) where status = 'scheduled';

alter table public.acq_contacts enable row level security;
alter table public.acq_conversations enable row level security;
alter table public.acq_messages enable row level security;
alter table public.acq_workflows enable row level security;
alter table public.acq_workflow_runs enable row level security;
alter table public.acq_booking_intents enable row level security;
alter table public.acq_followups enable row level security;

revoke all on public.acq_contacts from anon, authenticated;
revoke all on public.acq_conversations from anon, authenticated;
revoke all on public.acq_messages from anon, authenticated;
revoke all on public.acq_workflows from anon, authenticated;
revoke all on public.acq_workflow_runs from anon, authenticated;
revoke all on public.acq_booking_intents from anon, authenticated;
revoke all on public.acq_followups from anon, authenticated;

grant all on public.acq_contacts to service_role;
grant all on public.acq_conversations to service_role;
grant all on public.acq_messages to service_role;
grant all on public.acq_workflows to service_role;
grant all on public.acq_workflow_runs to service_role;
grant all on public.acq_booking_intents to service_role;
grant all on public.acq_followups to service_role;

comment on table public.acq_contacts is 'CRM Acquisition — contacts multi-canal (module /admin/acquisition).';
comment on table public.acq_conversations is 'Inbox unifiée Acquisition (IG DM, Messenger, WhatsApp, email).';

insert into public.acq_workflows (id, name, enabled, trigger_type, trigger_config, actions)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'Commentaire IG « ESSAI » → lien essai',
    true,
    'ig_comment_keyword',
    '{"keyword":"essai"}'::jsonb,
    '[{"type":"send_message","config":{"body":"Merci ! Voici ton essai 7 jours FitMangas :"}},{"type":"send_trial_link"},{"type":"set_lifecycle_stage","config":{"stage":"trial"}}]'::jsonb
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'Nouveau DM → qualifier + réponse concierge',
    true,
    'ig_dm_inbound',
    '{}'::jsonb,
    '[{"type":"qualify_intent"},{"type":"send_message"}]'::jsonb
  )
on conflict (id) do nothing;

commit;
