export type StandaloneVimeoValidationStatus =
  | 'pending'
  | 'scheduled'
  | 'published'
  | 'rejected';

export type StandaloneVimeoRow = {
  id: string;
  vimeo_video_id: string;
  vimeo_uri: string | null;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  embed_url: string | null;
  vimeo_folder_name: string | null;
  validation_status: StandaloneVimeoValidationStatus;
  published_at: string | null;
  scheduled_publication_at: string | null;
  rejection_reason: string | null;
  coach_id: string | null;
  webhook_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
