-- Additive: cover images for reading club (Open Library cache paths)
ALTER TABLE public.reading_resources
  ADD COLUMN IF NOT EXISTS cover_image_url text NULL;
