-- Lecture blog réservée aux abonnés Visio et admins.

drop policy if exists "blog_articles_read_published" on public.blog_articles;
create policy "blog_articles_read_published"
  on public.blog_articles
  for select
  to authenticated
  using (
    status = 'published'::public.blog_article_status
    and (
      public.tier_is_online(public.current_customer_tier(auth.uid()))
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'admin'
      )
    )
  );
