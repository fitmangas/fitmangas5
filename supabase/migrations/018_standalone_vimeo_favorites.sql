create table if not exists public.standalone_vimeo_favorites (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.standalone_vimeo_videos (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (video_id, user_id)
);

create index if not exists idx_standalone_vimeo_favorites_user on public.standalone_vimeo_favorites (user_id);
create index if not exists idx_standalone_vimeo_favorites_video on public.standalone_vimeo_favorites (video_id);

alter table public.standalone_vimeo_favorites enable row level security;

drop policy if exists "standalone_vimeo_favorites_select_own" on public.standalone_vimeo_favorites;
create policy "standalone_vimeo_favorites_select_own"
  on public.standalone_vimeo_favorites for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "standalone_vimeo_favorites_insert_own" on public.standalone_vimeo_favorites;
create policy "standalone_vimeo_favorites_insert_own"
  on public.standalone_vimeo_favorites for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "standalone_vimeo_favorites_delete_own" on public.standalone_vimeo_favorites;
create policy "standalone_vimeo_favorites_delete_own"
  on public.standalone_vimeo_favorites for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.standalone_vimeo_favorites to authenticated;
