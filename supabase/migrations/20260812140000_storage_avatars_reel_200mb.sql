-- CM Reels — MP4 montés ~85 Mo (GO Kevin 2026-08-12)
-- IMPORTANT : ce SQL ne suffit PAS si la « Global file size limit » du projet
-- reste à 50 Mo (Storage → Settings). Remonter d’abord la limite GLOBALE à 200 Mo
-- dans le Dashboard, sinon updateBucket / upload renvoient EntityTooLarge 413.

begin;

update storage.buckets
set
  file_size_limit = 209715200, -- 200 MiB (doit être ≤ limite globale projet)
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'text/html'
  ]
where id = 'avatars';

commit;
