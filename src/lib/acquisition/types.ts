export type AcquisitionChannel =
  | 'instagram'
  | 'facebook'
  | 'whatsapp'
  | 'email'
  | 'blog_seo'
  | 'referral'
  | 'other';

export type LifecycleStage = 'new' | 'qualified' | 'trial' | 'paid' | 'member';

export type ConversationStatus = 'open' | 'waiting' | 'closed' | 'escalated';

export type AcqMessageDirection = 'inbound' | 'outbound' | 'system';

export type WorkflowTriggerType =
  | 'ig_comment_keyword'
  | 'ig_dm_inbound'
  | 'ig_story_reply'
  | 'messenger_inbound'
  | 'whatsapp_inbound'
  | 'email_inbound';

export type WorkflowActionType =
  | 'send_message'
  | 'qualify_intent'
  | 'tag_contact'
  | 'set_lifecycle_stage'
  | 'send_trial_link'
  | 'book_session_intent'
  | 'capture_email_optin'
  | 'schedule_followup'
  | 'broadcast_optin'
  | 'escalate_human';

export type AcqContact = {
  id: string;
  channel: AcquisitionChannel;
  handle: string | null;
  email: string | null;
  optIn: boolean;
  lifecycleStage: LifecycleStage;
  tags: string[];
  sourceAttribution: string | null;
  createdAt: string;
};

export type AcqConversation = {
  id: string;
  contactId: string;
  channel: AcquisitionChannel;
  status: ConversationStatus;
  lifecycleStage: LifecycleStage;
  subject: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  assignedTo: string | null;
  contactHandle?: string | null;
};

export type AcqMessage = {
  id: string;
  conversationId: string;
  direction: AcqMessageDirection;
  body: string;
  provider: string | null;
  sandbox: boolean;
  createdAt: string;
};

export type AcqWorkflow = {
  id: string;
  name: string;
  enabled: boolean;
  triggerType: WorkflowTriggerType;
  triggerConfig: Record<string, unknown>;
  conditions: Record<string, unknown>;
  actions: WorkflowActionSpec[];
};

export type WorkflowActionSpec = {
  type: WorkflowActionType;
  config?: Record<string, unknown>;
};

export type FunnelStep = {
  id: string;
  label: string;
  value: number;
  rateFromPrevious: number | null;
};

export type AcquisitionKpi = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'good' | 'watch' | 'bad';
};

export type PerformanceHookRow = {
  id: string;
  hook: string;
  channel: string;
  saves: number | null;
  reach: number | null;
  conversions: number | null;
  score: number | null;
  pilier?: string | null;
  format?: string | null;
};

export type SourceError = {
  provider: string;
  error: string;
};

export type AcquisitionOverview = {
  channel: AcquisitionChannel | 'all';
  funnel: FunnelStep[];
  kpis: AcquisitionKpi[];
  performanceHooks: PerformanceHookRow[];
  sourceErrors: SourceError[];
  schemaReady: boolean;
  messagingMode: 'sandbox' | 'live';
  metaLiveReadiness?: import('@/lib/acquisition/providers/meta-live').MetaLiveReadiness;
};
