export type AppRole = 'owner' | 'admin' | 'operator' | 'viewer';

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string;
  role: AppRole;
}

export interface CrmSettings {
  brand_name: string;
  currency: string;
  tax_rate: number; // e.g. 0.15 for 15% VAT
  quote_validity_days: number;
  quote_terms_md: string;
  code_formats: {
    client_prefix: string;
    engagement_prefix: string;
    quote_prefix: string;
    deliverable_prefix: string;
    asset_prefix: string;
  };
  agent_discount_cap_pct: number;
  approval_threshold_pct: number;
  stale_days: number;
  working_timezone: string;
  weekly_build_hours: number;
  send_mode: 'draft' | 'live';
  theme_tokens: Record<string, string>;
  visible_tabs: string[];
}

export interface PipelineStage {
  id: string;
  key: string;
  name: string;
  position: number;
  color: string;
  probability_pct: number;
  sla_days: number;
  is_terminal: boolean;
  outcome: 'won' | 'lost' | 'paused' | null;
  guidance_md: string;
  exit_checklist: string[];
  required_fields: string[];
}

export interface Client {
  id: string;
  client_code: string;
  name: string;
  type: 'company' | 'individual';
  industry: string;
  website: string;
  country: string;
  timezone: string;
  source: string;
  source_detail: string;
  owner_actor: string;
  health_score: number;
  health_reasons: string[];
  tags: string[];
  custom: Record<string, any>;
  notes: string;
  archived_at: string | null;
  created_by_actor: string;
  created_at: string;
  updated_at: string;
  is_sample?: boolean;
}

export interface Contact {
  id: string;
  client_id: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  role_title: string;
  is_primary: boolean;
  preferred_channel: 'email' | 'whatsapp' | 'phone';
  custom: Record<string, any>;
  created_at: string;
}

export interface Engagement {
  id: string;
  engagement_code: string;
  client_id: string;
  title: string;
  categories: string[];
  stage_id: string;
  stage_entered_at: string;
  value_estimate: number;
  currency: string;
  expected_close: string | null;
  owner_actor: string;
  is_sampling: boolean;
  outcome: 'won' | 'lost' | 'paused' | null;
  lost_reason: string | null;
  custom: Record<string, any>;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StageHistory {
  id: string;
  engagement_id: string;
  from_stage_id: string;
  to_stage_id: string;
  actor_type: 'human' | 'agent' | 'system' | 'ai' | 'service';
  actor_name: string;
  reason: string;
  created_at: string;
}

export interface RequestItem {
  id: string;
  engagement_id: string;
  client_id: string;
  title: string;
  description: string;
  product_id: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'requested' | 'scoped' | 'quoted' | 'building' | 'delivered' | 'dropped';
  source: 'questionnaire' | 'email' | 'call' | 'manual' | 'agent' | 'website';
  created_by_actor: string;
  created_at: string;
}

export interface Activity {
  id: string;
  client_id: string;
  engagement_id: string | null;
  type:
    | 'note'
    | 'call'
    | 'meeting'
    | 'email_in'
    | 'email_out'
    | 'stage_change'
    | 'quote_event'
    | 'questionnaire'
    | 'feedback'
    | 'deliverable'
    | 'system'
    | 'agent';
  summary: string;
  body: string;
  actor_type: 'human' | 'agent' | 'system' | 'ai' | 'service';
  actor_name: string;
  metadata: Record<string, any>;
  occurred_at: string;
}

export interface Task {
  id: string;
  client_id: string;
  engagement_id: string | null;
  title: string;
  description: string;
  due_at: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'done' | 'cancelled';
  assignee_actor: string;
  created_by_actor: string;
  source: 'manual' | 'playbook' | 'ai';
  created_at: string;
}

export interface CustomFieldDef {
  id: string;
  entity: 'clients' | 'contacts' | 'engagements' | 'deliverables';
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'url' | 'boolean';
  options: string[];
  show_on_card: boolean;
  show_on_board: boolean;
  filterable: boolean;
  position: number;
}

export interface SavedView {
  id: string;
  user_id: string;
  entity: string;
  name: string;
  layout: 'board' | 'table' | 'calendar';
  filters: Record<string, any>;
  columns: string[];
  sort: { field: string; direction: 'asc' | 'desc' };
  shared: boolean;
}

export interface DashboardLayout {
  user_id: string;
  widgets: string[];
}

export interface AuditLogEntry {
  id: string;
  at: string;
  actor_type: 'human' | 'agent' | 'system' | 'ai' | 'service';
  actor_name: string;
  api_key_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before: any;
  after: any;
  request_id: string;
  idempotency_key: string | null;
}

export interface QuestionnaireQuestion {
  id: string;
  label: string;
  type: 'short_text' | 'long_text' | 'single_choice' | 'multi_choice' | 'number' | 'yes_no' | 'date' | 'file_link';
  options?: string[];
  required: boolean;
  placeholder?: string;
  help_text?: string;
}

export interface QuestionnaireTemplate {
  id: string;
  name: string;
  category: string;
  questions: QuestionnaireQuestion[];
  is_active: boolean;
}

export interface Questionnaire {
  id: string;
  client_id: string;
  engagement_id: string;
  template_id: string | null;
  title: string;
  questions: QuestionnaireQuestion[];
  token_hash: string;
  token?: string;
  status: 'draft' | 'sent' | 'opened' | 'completed' | 'expired';
  sent_at: string | null;
  completed_at: string | null;
  expires_at: string;
  ai_summary: string | null;
  created_at: string;
}

export interface QuestionnaireResponse {
  id: string;
  questionnaire_id: string;
  answers: Record<string, any>;
  submitted_at: string;
  ip_hash: string;
}

export interface Feedback {
  id: string;
  engagement_id: string;
  deliverable_id: string | null;
  token_hash: string;
  token?: string;
  status: string;
  satisfaction: number; // 1-5
  would_pay: 'yes' | 'maybe' | 'no';
  comments: string;
  requested_changes: string;
  source: 'form' | 'call' | 'email' | 'agent';
  recorded_by_actor: string;
  created_at: string;
}

export interface SamplingCost {
  id: string;
  engagement_id: string;
  deliverable_id: string | null;
  hours: number;
  hourly_rate: number;
  note: string;
  logged_by_actor: string;
  created_at: string;
}

export interface Deliverable {
  id: string;
  deliverable_code: string;
  client_id: string;
  engagement_id: string;
  request_id: string | null;
  name: string;
  kind: 'app' | 'website' | 'workflow' | 'agent' | 'integration' | 'voice' | 'chatbot' | 'other';
  status: 'in_build' | 'sample_delivered' | 'live' | 'retired';
  is_sample: boolean;
  live_url: string;
  repo_url: string;
  admin_url: string;
  version: string;
  description: string;
  tech_stack: string[];
  screenshots: string[];
  demo_video_url: string;
  hours_spent: number;
  delivered_at: string | null;
  handover_notes: string;
  custom: Record<string, any>;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  pricing_model: 'fixed' | 'hourly' | 'tiered' | 'recurring' | 'per_unit' | 'custom';
  base_price: number | null;
  unit: string;
  currency: string;
  recurring_interval: 'month' | 'year' | null;
  estimated_hours: number;
  min_price: number;
  is_active: boolean;
  build_spec_template: string;
  needs_price: boolean;
  custom: Record<string, any>;
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  price_mode: 'add' | 'multiply';
  amount: number;
  description: string;
}

export interface PriceTier {
  id: string;
  product_id: string;
  label: string;
  min_qty: number;
  max_qty: number | null;
  unit_price: number;
}

export interface ProductRelation {
  id: string;
  from_product_id: string;
  to_product_id: string;
  relation: 'cross_sell' | 'upsell' | 'requires';
  reason: string;
}

export interface Bundle {
  id: string;
  name: string;
  sku: string;
  description: string;
}

export interface BundleItem {
  id: string;
  bundle_id: string;
  product_id: string;
  qty: number;
  discount_pct: number;
}

export interface Quote {
  id: string;
  quote_code: string;
  client_id: string;
  engagement_id: string;
  version: number;
  parent_quote_id: string | null;
  status: 'draft' | 'pending_approval' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'superseded';
  currency: string;
  subtotal: number;
  discount_total: number;
  tax_rate: number;
  tax_total: number;
  total: number;
  valid_until: string;
  terms_md: string;
  notes: string;
  token_hash: string;
  token?: string;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  accepted_by_name: string | null;
  accepted_ip_hash: string | null;
  declined_reason: string | null;
  payment_link_url: string;
  created_by_actor: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteLine {
  id: string;
  quote_id: string;
  position: number;
  product_id: string | null;
  request_id: string | null;
  description: string;
  qty: number;
  unit_price: number;
  discount_pct: number;
  line_total: number;
  options: Record<string, any>;
  is_recurring: boolean;
}

export interface Approval {
  id: string;
  entity_type: 'quote';
  entity_id: string;
  requested_by_actor: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface BuildBrief {
  id: string;
  quote_id: string;
  engagement_id: string;
  brief_md: string;
  scope: Record<string, any>;
  created_by_actor: string;
  created_at: string;
}

export interface Asset {
  id: string;
  asset_code: string;
  name: string;
  kind: 'template' | 'workflow' | 'agent_blueprint' | 'component' | 'app_template' | 'prompt_pack' | 'integration';
  version: string;
  repo_url: string;
  description: string;
  status: 'active' | 'deprecated';
  hours_to_build: number;
  tags: string[];
  custom: Record<string, any>;
  created_at: string;
}

export interface AssetUsage {
  id: string;
  asset_id: string;
  deliverable_id: string | null;
  client_id: string;
  used_at: string;
  hours_saved: number;
}

export interface EmailAccount {
  id: string;
  label: string;
  from_name: string;
  from_email: string;
  provider: 'resend' | 'custom_smtp';
  status: 'connected' | 'needs_key';
}

export interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body_md: string;
  variables: string[];
}

export interface EmailSequence {
  id: string;
  name: string;
  steps: {
    day_offset: number;
    template_id: string;
    subject_override?: string;
  }[];
  stop_on_reply: boolean;
  active: boolean;
}

export interface SequenceEnrollment {
  id: string;
  sequence_id: string;
  contact_id: string;
  engagement_id: string;
  step: number;
  next_run_at: string;
  status: 'active' | 'completed' | 'stopped' | 'replied';
}

export interface EmailMessage {
  id: string;
  client_id: string;
  contact_id: string | null;
  engagement_id: string | null;
  direction: 'in' | 'out';
  subject: string;
  body_html: string;
  body_text: string;
  provider_message_id: string | null;
  thread_id: string;
  in_reply_to: string | null;
  status: 'queued' | 'sent' | 'failed' | 'received' | 'bounced';
  sent_at: string | null;
  received_at: string | null;
  created_by_actor: string;
}

export interface SuppressionItem {
  email: string;
  reason: 'unsubscribe' | 'bounce' | 'complaint' | 'manual';
  created_at: string;
}

export interface ApiKey {
  id: string;
  name: string;
  actor_name: string;
  actor_type: 'agent' | 'service' | 'human';
  key_prefix: string;
  key_hash: string;
  scopes: string[];
  rate_limit_per_min: number;
  expires_at: string | null;
  last_used_at: string | null;
  revoked_at: string | null;
  created_by: string;
  created_at: string;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret_ref: string;
}

export interface WebhookDelivery {
  id: string;
  endpoint_id: string;
  event: string;
  payload: any;
  status: 'success' | 'failed' | 'retrying';
  response_code: number | null;
  attempt: number;
  next_retry_at: string | null;
  created_at: string;
}

export interface Integration {
  id: string;
  provider: 'swarmhive' | 'turnstile' | 'resend' | 'custom';
  config: Record<string, any>;
  secret_ref: string;
  status: 'configured' | 'unconfigured' | 'error';
  last_checked_at: string | null;
}

export interface Playbook {
  id: string;
  name: string;
  stage_id: string | null;
  condition: Record<string, any>;
  action_type: 'create_task' | 'suggest_stage' | 'suggest_quote' | 'suggest_upsell' | 'send_template' | 'ask_feedback';
  recommendation_md: string;
  action_payload: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  active: boolean;
}

export interface NbaItem {
  id: string;
  client_id: string;
  engagement_id: string;
  playbook_id: string | null;
  source: 'rule' | 'ai';
  title: string;
  reason: string;
  action_type: string;
  action_payload: Record<string, any>;
  status: 'open' | 'done' | 'dismissed';
  created_at: string;
}

export interface AiRun {
  id: string;
  job: string;
  entity_ref: string;
  input_summary: string;
  output: string;
  model: string;
  status: 'completed' | 'failed' | 'undone';
  created_at: string;
}

export interface DatabaseSchema {
  settings: CrmSettings;
  users: UserProfile[];
  pipeline_stages: PipelineStage[];
  clients: Client[];
  contacts: Contact[];
  engagements: Engagement[];
  stage_history: StageHistory[];
  requests: RequestItem[];
  activities: Activity[];
  tasks: Task[];
  custom_field_defs: CustomFieldDef[];
  questionnaire_templates: QuestionnaireTemplate[];
  questionnaires: Questionnaire[];
  questionnaire_responses: QuestionnaireResponse[];
  feedback: Feedback[];
  sampling_costs: SamplingCost[];
  deliverables: Deliverable[];
  products: Product[];
  product_options: ProductOption[];
  price_tiers: PriceTier[];
  product_relations: ProductRelation[];
  bundles: Bundle[];
  bundle_items: BundleItem[];
  quotes: Quote[];
  quote_lines: QuoteLine[];
  approvals: Approval[];
  build_briefs: BuildBrief[];
  assets: Asset[];
  asset_usage: AssetUsage[];
  email_accounts: EmailAccount[];
  email_templates: EmailTemplate[];
  email_sequences: EmailSequence[];
  sequence_enrollments: SequenceEnrollment[];
  email_messages: EmailMessage[];
  suppression_list: SuppressionItem[];
  api_keys: ApiKey[];
  audit_log: AuditLogEntry[];
  webhook_endpoints: WebhookEndpoint[];
  webhook_deliveries: WebhookDelivery[];
  integrations: Integration[];
  playbooks: Playbook[];
  nba_items: NbaItem[];
  ai_runs: AiRun[];
  counters: {
    client: number;
    engagement: number;
    quote: number;
    deliverable: number;
    asset: number;
    request_seq: number;
  };
}

