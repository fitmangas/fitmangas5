-- Images uniques pour les articles publiés avant lancement.
-- Les URLs précédentes étaient distinctes mais pointaient majoritairement vers le même asset Unsplash.

update public.blog_articles
set featured_image_url = 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
    updated_at = now()
where slug_fr = 'article-pilates-5-mouvement-souffle-005';

update public.blog_articles
set featured_image_url = 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&w=1200&q=80',
    updated_at = now()
where slug_fr = 'article-pilates-2-mouvement-souffle-002';

update public.blog_articles
set featured_image_url = 'https://images.unsplash.com/photo-1510894347713-fc3ed6fdf539?auto=format&fit=crop&w=1200&q=80',
    updated_at = now()
where slug_fr = 'article-pilates-3-mouvement-souffle-003';

update public.blog_articles
set featured_image_url = 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&w=1200&q=80',
    updated_at = now()
where slug_fr = 'article-pilates-4-mouvement-souffle-004';

update public.blog_articles
set featured_image_url = 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=1200&q=80',
    updated_at = now()
where slug_fr = 'mon-premier-article-pilates-1';
