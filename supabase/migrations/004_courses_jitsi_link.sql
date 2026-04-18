-- Phase 2 Jitsi : lien de salle pour les lives (meet.jit.si ou instance dédiée plus tard).

alter table public.courses add column if not exists jitsi_link text;

comment on column public.courses.jitsi_link is 'URL de la salle Jitsi (ex. https://meet.jit.si/NomDuCours-id); nullable.';
