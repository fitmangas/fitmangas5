-- Favoris blog côté espace client

create table if not exists public.blog_article_favorites (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_articles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (article_id, user_id)
);

create index if not exists idx_blog_favorites_user on public.blog_article_favorites (user_id);
create index if not exists idx_blog_favorites_article on public.blog_article_favorites (article_id);

alter table public.blog_article_favorites enable row level security;

drop policy if exists "blog_favorites_select_own" on public.blog_article_favorites;
create policy "blog_favorites_select_own"
  on public.blog_article_favorites for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "blog_favorites_insert_own" on public.blog_article_favorites;
create policy "blog_favorites_insert_own"
  on public.blog_article_favorites for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "blog_favorites_delete_own" on public.blog_article_favorites;
create policy "blog_favorites_delete_own"
  on public.blog_article_favorites for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.blog_article_favorites to authenticated;
