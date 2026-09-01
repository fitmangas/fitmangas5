-- Niveau de difficulté des séances live (filtres replays cliente).
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS course_skill_level text NOT NULL DEFAULT 'all_levels';

ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_skill_level_check;
ALTER TABLE public.courses
  ADD CONSTRAINT courses_skill_level_check
  CHECK (course_skill_level IN ('all_levels', 'beginner', 'intermediate', 'advanced'));

COMMENT ON COLUMN public.courses.course_skill_level IS
  'Niveau séance : all_levels | beginner | intermediate | advanced';
