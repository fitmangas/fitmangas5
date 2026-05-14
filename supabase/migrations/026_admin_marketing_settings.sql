-- Réglages SEO/marketing administrables et checklist de lancement.

create table if not exists public.admin_settings (
  key text primary key,
  value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_marketing_checklist (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label_fr text not null,
  label_es text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  category text not null check (category in ('seo', 'social', 'ads', 'community')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_admin_settings_updated_at on public.admin_settings;
create trigger trg_admin_settings_updated_at
before update on public.admin_settings
for each row execute function public.set_updated_at();

drop trigger if exists trg_admin_marketing_checklist_updated_at on public.admin_marketing_checklist;
create trigger trg_admin_marketing_checklist_updated_at
before update on public.admin_marketing_checklist
for each row execute function public.set_updated_at();

alter table public.admin_settings enable row level security;
alter table public.admin_marketing_checklist enable row level security;

drop policy if exists "Admins manage admin settings" on public.admin_settings;
create policy "Admins manage admin settings"
  on public.admin_settings
  for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Admins manage marketing checklist" on public.admin_marketing_checklist;
create policy "Admins manage marketing checklist"
  on public.admin_marketing_checklist
  for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

insert into public.admin_marketing_checklist (key, label_fr, label_es, category, sort_order)
values
  ('search_console_connected', 'Google Search Console connecté', 'Google Search Console conectado', 'seo', 10),
  ('google_analytics_configured', 'Google Analytics configuré', 'Google Analytics configurado', 'seo', 20),
  ('sitemap_submitted', 'Sitemap soumis à Google', 'Sitemap enviado a Google', 'seo', 30),
  ('seo_scores_above_80', 'Tous les articles ont un score SEO > 80%', 'Todos los artículos tienen un score SEO > 80%', 'seo', 40),
  ('instagram_linked', 'Compte Instagram lié', 'Cuenta Instagram vinculada', 'social', 10),
  ('tiktok_linked', 'Compte TikTok lié', 'Cuenta TikTok vinculada', 'social', 20),
  ('first_instagram_post', 'Première publication Instagram faite', 'Primera publicación de Instagram hecha', 'social', 30),
  ('three_reels_month', '3 reels publiés ce mois', '3 reels publicados este mes', 'social', 40),
  ('meta_ads_created', 'Compte Meta Ads créé', 'Cuenta Meta Ads creada', 'ads', 10),
  ('first_instagram_campaign', 'Première campagne Instagram lancée', 'Primera campaña de Instagram lanzada', 'ads', 20),
  ('meta_pixel_installed', 'Pixel Meta installé sur le site', 'Pixel Meta instalado en el sitio', 'ads', 30),
  ('ten_clients_registered', '10 clientes inscrites', '10 clientas inscritas', 'community', 10),
  ('first_video_testimonial', 'Premier témoignage vidéo collecté', 'Primer testimonio en video recogido', 'community', 20),
  ('referral_program_launched', 'Programme de parrainage lancé', 'Programa de referidos lanzado', 'community', 30),
  ('whatsapp_group_created', 'Groupe WhatsApp créé', 'Grupo WhatsApp creado', 'community', 40)
on conflict (key) do update
set label_fr = excluded.label_fr,
    label_es = excluded.label_es,
    category = excluded.category,
    sort_order = excluded.sort_order,
    updated_at = now();
