-- FitMangas — DÉPUBLICATION des 8 articles fallback publiés (à valider avant exécution)
-- Statut choisi : archived (quitte le blog public, non supprimé, enum blog_article_status)
-- Ne touche PAS aux 13 articles publiés "bons".
--
-- LISTE EXACTE :
-- 1) Article pilates 2  — id 20bffcbd-d853-49a6-ad1d-48c1a72b15e8 — slug article-pilates-2-mouvement-souffle-002
-- 2) Article pilates 15 — id dab1119e-09e9-4c99-96e9-ff62616159dd — slug article-pilates-15-mouvement-souffle-015
-- 3) Article pilates 16 — id 85b21dfe-6334-464e-88d7-de022d1843a9 — slug article-pilates-16-mouvement-souffle-016
-- 4) Article pilates 17 — id 80f84234-f14a-465f-8250-341ec914478d — slug article-pilates-17-mouvement-souffle-017
-- 5) Article pilates 18 — id b6bb1868-fce0-476f-bb79-89a0896b7e0c — slug article-pilates-18-mouvement-souffle-018
-- 6) Article pilates 19 — id 8b8b995b-c7a4-460b-88d9-bc43b08a0abb — slug article-pilates-19-mouvement-souffle-019
-- 7) Article pilates 20 — id 97d4bc38-b650-4910-b9ab-ce5cbbabf535 — slug article-pilates-20-mouvement-souffle-020
-- 8) Article pilates 21 — id da2721fc-dd1d-45d4-aac1-6b2c644550d7 — slug article-pilates-21-mouvement-souffle-021

-- ========== FORWARD (dépublier) ==========
BEGIN;

UPDATE public.blog_articles
SET
  status = 'archived',
  updated_at = now()
WHERE id IN (
  '20bffcbd-d853-49a6-ad1d-48c1a72b15e8', -- Article pilates 2
  'dab1119e-09e9-4c99-96e9-ff62616159dd', -- Article pilates 15
  '85b21dfe-6334-464e-88d7-de022d1843a9', -- Article pilates 16
  '80f84234-f14a-465f-8250-341ec914478d', -- Article pilates 17
  'b6bb1868-fce0-476f-bb79-89a0896b7e0c', -- Article pilates 18
  '8b8b995b-c7a4-460b-88d9-bc43b08a0abb', -- Article pilates 19
  '97d4bc38-b650-4910-b9ab-ce5cbbabf535', -- Article pilates 20
  'da2721fc-dd1d-45d4-aac1-6b2c644550d7'  -- Article pilates 21
)
AND status = 'published';

-- Contrôle attendu : 8 lignes
-- SELECT id, title_fr, status FROM public.blog_articles
-- WHERE id IN (...ids...);

COMMIT;

-- ========== INVERSE (re-publier tel quel, si besoin) ==========
-- BEGIN;
-- UPDATE public.blog_articles
-- SET status = 'published', updated_at = now()
-- WHERE id IN (
--   '20bffcbd-d853-49a6-ad1d-48c1a72b15e8',
--   'dab1119e-09e9-4c99-96e9-ff62616159dd',
--   '85b21dfe-6334-464e-88d7-de022d1843a9',
--   '80f84234-f14a-465f-8250-341ec914478d',
--   'b6bb1868-fce0-476f-bb79-89a0896b7e0c',
--   '8b8b995b-c7a4-460b-88d9-bc43b08a0abb',
--   '97d4bc38-b650-4910-b9ab-ce5cbbabf535',
--   'da2721fc-dd1d-45d4-aac1-6b2c644550d7'
-- )
-- AND status = 'archived';
-- COMMIT;
