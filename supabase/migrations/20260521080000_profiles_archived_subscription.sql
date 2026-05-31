-- Archivage admin + champs d’abonnement dénormalisés sur le profil (affichage fiche client).

alter table public.profiles
  add column if not exists archived boolean not null default false,
  add column if not exists subscription_status text,
  add column if not exists subscription_type text;

comment on column public.profiles.archived is 'Client archivé : masqué des listes admin par défaut.';
comment on column public.profiles.subscription_status is 'Statut abonnement lisible admin (ex. active, canceled).';
comment on column public.profiles.subscription_type is 'Type d’offre lisible admin (ex. visio_collectif).';

create index if not exists idx_profiles_not_archived on public.profiles (updated_at desc)
  where archived = false and role = 'member';
