export type CustomerTier =
  | 'online_individual_monthly'
  | 'online_group_monthly'
  | 'onsite_group_single'
  | 'onsite_individual_single';

export type AccessType = 'full' | 'preview' | 'locked';
export type CourseFormat = 'online' | 'onsite';
export type CourseCategory = 'individual' | 'group';

export type AccessPolicy = {
  access_level: AccessType;
  can_purchase_single: boolean;
  cta_label: string | null;
  cta_url: string | null;
  upsell_tier: CustomerTier | null;
  note: string | null;
};

export type SmartCourse = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  course_format: CourseFormat;
  course_category: CourseCategory;
  starts_at: string;
  ends_at: string;
  timezone: string;
  location: string | null;
  live_url: string | null;
  replay_url: string | null;
  capacity_max: number | null;
  access_type: AccessType;
  can_purchase_single: boolean;
  cta_label: string | null;
  cta_url: string | null;
  upsell_tier: CustomerTier | null;
  status_label: 'Accès complet' | 'Accès limité' | 'Accès refusé' | 'À venir';
};
