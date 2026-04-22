import type { StandaloneVimeoValidationStatus } from '@/types/standalone-vimeo';

/** Données sérialisées côté serveur → client admin Vimeo. */
export type AdminVimeoVideoCard = {
  id: string;
  vimeo_video_id: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  embed_url: string | null;
  validation_status: StandaloneVimeoValidationStatus;
  vimeo_folder_name: string | null;
  published_at: string | null;
  scheduled_publication_at: string | null;
  rejection_reason: string | null;
  created_at: string;
};

export type VimeoValidateAction = 'approve' | 'reject';

export type VimeoScheduleBody = {
  /** ISO 8601 futur, ou `null` pour annuler la programmation (retour `pending`). */
  scheduled_at: string | null;
};
