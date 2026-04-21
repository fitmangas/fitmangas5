-- Dossiers Vimeo (Barre flow, Booty power, …) + libellés dérivés (Replays Lives, Non classé).

alter table public.standalone_vimeo_videos
  add column if not exists vimeo_folder_name text;

create index if not exists idx_standalone_vimeo_folder_name
  on public.standalone_vimeo_videos (vimeo_folder_name);

comment on column public.standalone_vimeo_videos.vimeo_folder_name is
  'Dossier Vimeo (parent_folder) ou libellé déduit : Replays Lives (replay Jitsi sans dossier), Non classé, etc.';
