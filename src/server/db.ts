import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CrmSettings,
  PipelineStage,
  Client,
  Contact,
  Engagement,
  StageHistory,
  RequestItem,
  Activity,
  Task,
  CustomFieldDef,
  QuestionnaireTemplate,
  Questionnaire,
  QuestionnaireResponse,
  Feedback,
  SamplingCost,
  Deliverable,
  Product,
  ProductOption,
  PriceTier,
  ProductRelation,
  Bundle,
  BundleItem,
  Quote,
  QuoteLine,
  Approval,
  BuildBrief,
  Asset,
  AssetUsage,
  EmailAccount,
  EmailTemplate,
  EmailSequence,
  SequenceEnrollment,
  EmailMessage,
  SuppressionItem,
  ApiKey,
  AuditLogEntry,
  WebhookEndpoint,
  WebhookDelivery,
  Integration,
  Playbook,
  NbaItem,
  AiRun,
  AppRole,
  UserProfile,
  BusinessSettings,
  Invoice,
  InvoiceItem,
  Payment,
  Retainer,
  Milestone,
  PushSubscriptionRecord,
} from '../types/crm';

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
  business_settings: BusinessSettings;
  invoices: Invoice[];
  invoice_items: InvoiceItem[];
  payments: Payment[];
  retainers: Retainer[];
  milestones: Milestone[];
  push_subscriptions: PushSubscriptionRecord[];
  idempotency_keys: { key: string; response: any; expires_at: string }[];
  counters: {
    client: number;
    engagement: number;
    quote: number;
    deliverable: number;
    asset: number;
    request_seq: number;
    invoice: number;
    project: number;
  };
}

const DB_PATH = path.resolve(process.cwd(), 'data', 'coreiq_crm_db.json');

function hashSha256(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

export function generateToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = hashSha256(token);
  return { token, hash };
}

function getInitialDatabase(): DatabaseSchema {
  const seededStages: PipelineStage[] = [
    {
      id: 'stg_1',
      key: 'outreach',
      name: 'Outreach',
      position: 1,
      color: '#00e5ff',
      probability_pct: 10,
      sla_days: 3,
      is_terminal: false,
      outcome: null,
      guidance_md: 'We contacted them. Follow up within 48h. Log channel and contact responses.',
      exit_checklist: ['Verified contact details', 'Sent initial personalized note or message'],
      required_fields: ['client_name', 'contact_email'],
    },
    {
      id: 'stg_2',
      key: 'engaged',
      name: 'Engaged',
      position: 2,
      color: '#06b6d4',
      probability_pct: 20,
      sla_days: 2,
      is_terminal: false,
      outcome: null,
      guidance_md: 'Client replied or inbound came in. Send discovery questionnaire or book a 15-min discovery triage.',
      exit_checklist: ['Confirmed interest', 'Offered discovery questionnaire or intro call'],
      required_fields: [],
    },
    {
      id: 'stg_3',
      key: 'discovery',
      name: 'Discovery',
      position: 3,
      color: '#0284c7',
      probability_pct: 40,
      sla_days: 4,
      is_terminal: false,
      outcome: null,
      guidance_md: 'Questionnaire sent or returned, requirements being captured. Review answers and synthesize AI brief.',
      exit_checklist: ['Questionnaire returned or scope documented', 'Requests logged on client card'],
      required_fields: [],
    },
    {
      id: 'stg_4',
      key: 'sampling_building',
      name: 'Sampling: Building',
      position: 4,
      color: '#3b82f6',
      probability_pct: 50,
      sla_days: 5,
      is_terminal: false,
      outcome: null,
      guidance_md: 'Free sample in progress. Build working prototype using asset templates. Log hours spent in sampling costs.',
      exit_checklist: ['Sample deliverable registered', 'Demo URL or artifact ready'],
      required_fields: [],
    },
    {
      id: 'stg_5',
      key: 'sampling_review',
      name: 'Sampling: Review',
      position: 5,
      color: '#6366f1',
      probability_pct: 65,
      sla_days: 3,
      is_terminal: false,
      outcome: null,
      guidance_md: 'Ask if they are happy. Record a score. Score 4 or 5: create a quote or offer an add-on. Score 3 or below: log the changes they want and create a build task.',
      exit_checklist: ['Feedback recorded', 'Next action decided (quote or revision)'],
      required_fields: [],
    },
    {
      id: 'stg_6',
      key: 'proposal',
      name: 'Proposal',
      position: 6,
      color: '#8b5cf6',
      probability_pct: 75,
      sla_days: 5,
      is_terminal: false,
      outcome: null,
      guidance_md: 'Quote sent. Track view events. Follow up after 48h. Check valid_until expiration date.',
      exit_checklist: ['Approved quote sent to client', 'Follow-up task scheduled'],
      required_fields: [],
    },
    {
      id: 'stg_7',
      key: 'won_building',
      name: 'Won: Building',
      position: 7,
      color: '#10b981',
      probability_pct: 95,
      sla_days: 10,
      is_terminal: false,
      outcome: 'won',
      guidance_md: 'Paid build in progress. Execute Build Brief. Build live deliverables, link GitHub/hosted URLs, track hours.',
      exit_checklist: ['Build brief confirmed', 'Deliverable live URL tested'],
      required_fields: [],
    },
    {
      id: 'stg_8',
      key: 'delivered',
      name: 'Delivered',
      position: 8,
      color: '#059669',
      probability_pct: 100,
      sla_days: 14,
      is_terminal: false,
      outcome: 'won',
      guidance_md: 'Live and handed over. Send handover documentation, repo access, and request testimonial rating.',
      exit_checklist: ['Handover notes sent', 'Asset usage logged for reused templates'],
      required_fields: [],
    },
    {
      id: 'stg_9',
      key: 'growth',
      name: 'Growth',
      position: 9,
      color: '#14b8a6',
      probability_pct: 100,
      sla_days: 30,
      is_terminal: false,
      outcome: 'won',
      guidance_md: 'Upsell and expansion offers. Run product relations recommendations to propose workflows or chatbots.',
      exit_checklist: ['Quarterly review completed', 'Expansion offer presented'],
      required_fields: [],
    },
    {
      id: 'stg_lost',
      key: 'lost',
      name: 'Lost',
      position: 10,
      color: '#ef4444',
      probability_pct: 0,
      sla_days: 0,
      is_terminal: true,
      outcome: 'lost',
      guidance_md: 'Terminal stage. Requires lost_reason. Nurture for re-engagement in 6 months.',
      exit_checklist: ['Lost reason documented'],
      required_fields: ['lost_reason'],
    },
    {
      id: 'stg_paused',
      key: 'paused',
      name: 'Paused / Nurture',
      position: 11,
      color: '#64748b',
      probability_pct: 10,
      sla_days: 60,
      is_terminal: true,
      outcome: 'paused',
      guidance_md: 'On hold due to client timing or budget. Set reminder task for periodic check-in.',
      exit_checklist: ['Next check-in scheduled'],
      required_fields: [],
    },
  ];

  const seededProducts: Product[] = [
    {
      id: 'prod_agent',
      sku: 'SKU-AGENT-CORE',
      name: 'Autonomous AI Agent Node',
      category: 'AI Agent',
      description: 'Custom multi-step AI operator agent with tool calling, memory, and scheduled triggers.',
      pricing_model: 'fixed',
      base_price: null,
      unit: 'agent',
      currency: 'ZAR',
      recurring_interval: null,
      estimated_hours: 28,
      min_price: 5000,
      is_active: true,
      build_spec_template: 'Deploy an autonomous AI agent for {{company}} designed to {{request_text}}. Connect to tools: {{tools}}.',
      needs_price: true,
      custom: {},
    },
    {
      id: 'prod_auto',
      sku: 'SKU-AUTO-FLOW',
      name: 'Enterprise Workflow Automation',
      category: 'Automation',
      description: 'End-to-end event-driven webhook pipeline connecting web forms, internal databases, and notifications.',
      pricing_model: 'fixed',
      base_price: null,
      unit: 'pipeline',
      currency: 'ZAR',
      recurring_interval: null,
      estimated_hours: 16,
      min_price: 3500,
      is_active: true,
      build_spec_template: 'Configure event-driven pipeline connecting {{source}} to {{destination}} with error handling and deduplication.',
      needs_price: true,
      custom: {},
    },
    {
      id: 'prod_app',
      sku: 'SKU-APP-WEB',
      name: 'Full-Stack Web Application',
      category: 'App',
      description: 'Production React / TypeScript / Node web application with authentication, database, and responsive layout.',
      pricing_model: 'fixed',
      base_price: null,
      unit: 'application',
      currency: 'ZAR',
      recurring_interval: null,
      estimated_hours: 45,
      min_price: 15000,
      is_active: true,
      build_spec_template: 'Develop responsive full-stack application with mobile-first operator layout and backend API.',
      needs_price: true,
      custom: {},
    },
    {
      id: 'prod_web',
      sku: 'SKU-WEB-SITE',
      name: 'High-Conversion Agency Website',
      category: 'Website',
      description: 'Speed-optimized, SEO-ready modern website with interactive contact intake and analytics.',
      pricing_model: 'fixed',
      base_price: null,
      unit: 'website',
      currency: 'ZAR',
      recurring_interval: null,
      estimated_hours: 24,
      min_price: 8000,
      is_active: true,
      build_spec_template: 'Build modern responsive website adhering to high contrast, zero-pill typography, and fast loading.',
      needs_price: true,
      custom: {},
    },
    {
      id: 'prod_mob',
      sku: 'SKU-MOB-PWA',
      name: 'Progressive Mobile App (PWA)',
      category: 'Mobile App',
      description: 'Installable cross-platform web app with offline capabilities, push sync, and native touch navigation.',
      pricing_model: 'fixed',
      base_price: null,
      unit: 'app',
      currency: 'ZAR',
      recurring_interval: null,
      estimated_hours: 36,
      min_price: 12000,
      is_active: true,
      build_spec_template: 'Create installable PWA with web app manifest, offline service worker, and mobile-optimized touch UI.',
      needs_price: true,
      custom: {},
    },
    {
      id: 'prod_voice',
      sku: 'SKU-VOICE-ASSIST',
      name: 'Inbound/Outbound Voice AI Assistant',
      category: 'Voice AI',
      description: 'Real-time conversational voice bot for call routing, appointment scheduling, and lead qualification.',
      pricing_model: 'fixed',
      base_price: null,
      unit: 'assistant',
      currency: 'ZAR',
      recurring_interval: null,
      estimated_hours: 32,
      min_price: 9500,
      is_active: true,
      build_spec_template: 'Configure low-latency voice pipeline with telephony SIP/WebRTC endpoints and conversational prompts.',
      needs_price: true,
      custom: {},
    },
    {
      id: 'prod_bot',
      sku: 'SKU-BOT-CHAT',
      name: 'Smart 24/7 Support & Lead Bot',
      category: 'Chatbot',
      description: 'Knowledge-grounded chatbot with CRM lead sync, context memory, and operator escalation.',
      pricing_model: 'fixed',
      base_price: null,
      unit: 'bot',
      currency: 'ZAR',
      recurring_interval: null,
      estimated_hours: 14,
      min_price: 4000,
      is_active: true,
      build_spec_template: 'Deploy embeddable support chatbot grounded on {{company}} FAQs with lead capture to CRM.',
      needs_price: true,
      custom: {},
    },
    {
      id: 'prod_int',
      sku: 'SKU-INT-SYNC',
      name: 'Systems & API Integration Bridge',
      category: 'Integration',
      description: 'Reliable bi-directional sync adapter between ERP, billing, spreadsheets, and custom databases.',
      pricing_model: 'fixed',
      base_price: null,
      unit: 'connector',
      currency: 'ZAR',
      recurring_interval: null,
      estimated_hours: 20,
      min_price: 6000,
      is_active: true,
      build_spec_template: 'Build secure authenticated API sync adapter between {{systemA}} and {{systemB}}.',
      needs_price: true,
      custom: {},
    },
    {
      id: 'prod_oth',
      sku: 'SKU-OTH-ADV',
      name: 'Specialized Technical Advisory & Sprint',
      category: 'Other',
      description: 'Dedicated architectural review, performance tuning, and technical design sprints.',
      pricing_model: 'hourly',
      base_price: null,
      unit: 'hour',
      currency: 'ZAR',
      recurring_interval: null,
      estimated_hours: 10,
      min_price: 1500,
      is_active: true,
      build_spec_template: 'Conduct architectural sprint and technical roadmap for {{company}}.',
      needs_price: true,
      custom: {},
    },
  ];

  const seededProductRelations: ProductRelation[] = [
    {
      id: 'pr_1',
      from_product_id: 'prod_web',
      to_product_id: 'prod_bot',
      relation: 'cross_sell',
      reason: 'Every new website benefits from a 24/7 lead capture chatbot.',
    },
    {
      id: 'pr_2',
      from_product_id: 'prod_bot',
      to_product_id: 'prod_agent',
      relation: 'upsell',
      reason: 'Upgrade simple chat inquiries into an autonomous agent that takes real business actions.',
    },
    {
      id: 'pr_3',
      from_product_id: 'prod_app',
      to_product_id: 'prod_int',
      relation: 'cross_sell',
      reason: 'Connect web app workflows directly to existing ERP and accounting systems.',
    },
    {
      id: 'pr_4',
      from_product_id: 'prod_agent',
      to_product_id: 'prod_voice',
      relation: 'upsell',
      reason: 'Enable voice telephone calling capabilities on the agent logic.',
    },
  ];

  const seededAssets: Asset[] = [
    {
      id: 'ast_1',
      asset_code: 'CIQ-A-0001',
      name: 'FastAPI / Node Agent Blueprint',
      kind: 'agent_blueprint',
      version: '2.1.0',
      repo_url: 'https://github.com/coreiq/blueprint-agent-runtime',
      description: 'Production agent runtime with tool execution, state rollback, and rate limiting.',
      status: 'active',
      hours_to_build: 22,
      tags: ['agent', 'runtime', 'tools'],
      custom: {},
      created_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'ast_2',
      asset_code: 'CIQ-A-0002',
      name: 'Vite Operator CRM Starter Kit',
      kind: 'app_template',
      version: '1.4.0',
      repo_url: 'https://github.com/coreiq/vite-operator-shell',
      description: 'High-contrast 8px rounded dark UI shell with keyboard command palette.',
      status: 'active',
      hours_to_build: 30,
      tags: ['ui', 'react', 'dashboard'],
      custom: {},
      created_at: '2026-09-05T10:00:00Z',
    },
    {
      id: 'ast_3',
      asset_code: 'CIQ-A-0003',
      name: 'Resend Webhook Inbound Pipeline',
      kind: 'workflow',
      version: '1.0.2',
      repo_url: 'https://github.com/coreiq/workflow-resend-webhook',
      description: 'Inbound parsing, spam filter, and contact thread matching logic.',
      status: 'active',
      hours_to_build: 12,
      tags: ['email', 'resend', 'webhook'],
      custom: {},
      created_at: '2026-09-12T10:00:00Z',
    },
    {
      id: 'ast_4',
      asset_code: 'CIQ-A-0004',
      name: 'Voice AI Telephony Gateway',
      kind: 'integration',
      version: '1.2.0',
      repo_url: 'https://github.com/coreiq/voice-telephony-gw',
      description: 'Ultra-low latency audio bridge connecting SIP telephony to Gemini / Live voice.',
      status: 'active',
      hours_to_build: 18,
      tags: ['voice', 'telephony', 'webrtc'],
      custom: {},
      created_at: '2026-09-18T10:00:00Z',
    },
    {
      id: 'ast_5',
      asset_code: 'CIQ-A-0005',
      name: 'CoreIQ Triage Prompt Pack',
      kind: 'prompt_pack',
      version: '3.0.0',
      repo_url: 'https://github.com/coreiq/prompt-packs-crm',
      description: 'Tested zero-shot and few-shot prompts for client requirements extraction.',
      status: 'active',
      hours_to_build: 8,
      tags: ['prompts', 'governor', 'triage'],
      custom: {},
      created_at: '2026-09-22T10:00:00Z',
    },
  ];

  const seededQuestionnaireTemplate: QuestionnaireTemplate = {
    id: 'tmpl_generic_discovery',
    name: 'CoreIQ Universal Discovery Questionnaire',
    category: 'Universal',
    is_active: true,
    questions: [
      {
        id: 'q1',
        label: 'What does your business do and who are your primary customers?',
        type: 'long_text',
        required: true,
        placeholder: 'Brief summary of products/services and target audience...',
      },
      {
        id: 'q2',
        label: 'What specific business outcome or goal do you want this solution to achieve?',
        type: 'long_text',
        required: true,
        placeholder: 'e.g. Save 10 hours/week, double lead conversion, automate onboarding...',
      },
      {
        id: 'q3',
        label: 'Who will directly use or interact with this system daily?',
        type: 'short_text',
        required: true,
        placeholder: 'e.g. Sales team of 4, end customers, Desmond only...',
      },
      {
        id: 'q4',
        label: 'Which tools and software stack do you currently use?',
        type: 'short_text',
        required: true,
        placeholder: 'e.g. Google Workspace, Slack, HubSpot, PostgreSQL, Excel...',
      },
      {
        id: 'q5',
        label: 'What is the most painful, manual, or slowest bottleneck in your current process?',
        type: 'long_text',
        required: true,
        placeholder: 'Describe where hours or opportunities get lost...',
      },
      {
        id: 'q6',
        label: 'What is your target deadline for having this running live?',
        type: 'date',
        required: false,
      },
      {
        id: 'q7',
        label: 'What is your anticipated investment budget range for this phase?',
        type: 'single_choice',
        options: ['Under R10,000', 'R10,000 - R25,000', 'R25,000 - R60,000', 'R60,000+'],
        required: true,
      },
      {
        id: 'q8',
        label: 'What would make the free sample / demo an immediate success in your eyes?',
        type: 'long_text',
        required: true,
        placeholder: 'What does the prototype have to do to make you say yes?',
      },
    ],
  };

  const seededPlaybooks: Playbook[] = [
    {
      id: 'pb_stale_sla',
      name: 'Stage SLA Exceeded Warning',
      stage_id: null,
      condition: { days_in_stage_ratio: 1.0 },
      action_type: 'create_task',
      recommendation_md: 'Engagement has exceeded its stage SLA. Review blockers with the client or operator.',
      action_payload: { task_title: 'SLA Exceeded: Review engagement progress' },
      priority: 'high',
      active: true,
    },
    {
      id: 'pb_outreach_followup',
      name: 'Outreach Follow-Up Cadence',
      stage_id: 'stg_1',
      condition: { days_without_activity: 3 },
      action_type: 'create_task',
      recommendation_md: 'No outreach reply received after 3 days. Send a concise follow-up nudge.',
      action_payload: { task_title: 'Send follow-up nudge on outreach' },
      priority: 'medium',
      active: true,
    },
    {
      id: 'pb_questionnaire_reminder',
      name: 'Questionnaire Pending Reminder',
      stage_id: 'stg_3',
      condition: { questionnaire_pending_days: 3 },
      action_type: 'create_task',
      recommendation_md: 'Discovery questionnaire sent but not completed after 3 days. Ping client to offer a 10-min phone walkthrough.',
      action_payload: { task_title: 'Ping client on pending questionnaire' },
      priority: 'medium',
      active: true,
    },
    {
      id: 'pb_sample_feedback_check',
      name: 'Sample Feedback Prompt',
      stage_id: 'stg_5',
      condition: { days_sample_waiting: 3 },
      action_type: 'ask_feedback',
      recommendation_md: 'Free sample delivered 3 days ago with no feedback logged yet. Call or message to get satisfaction rating.',
      action_payload: { task_title: 'Request sample feedback from client' },
      priority: 'high',
      active: true,
    },
    {
      id: 'pb_happy_sample_quote',
      name: 'Happy Sample -> Propose Quote',
      stage_id: 'stg_5',
      condition: { satisfaction_min: 4, would_pay: ['yes', 'maybe'] },
      action_type: 'suggest_quote',
      recommendation_md: 'Client rated sample 4+! High buying intent. Generate commercial proposal quote and present related upsell modules.',
      action_payload: { next_stage: 'stg_6' },
      priority: 'high',
      active: true,
    },
    {
      id: 'pb_unhappy_sample_revision',
      name: 'Revision Tasks for Sample',
      stage_id: 'stg_5',
      condition: { satisfaction_max: 3 },
      action_type: 'create_task',
      recommendation_md: 'Client requested modifications on sample. Keep in Sampling: Building and create build revision tasks.',
      action_payload: { target_stage: 'stg_4' },
      priority: 'high',
      active: true,
    },
    {
      id: 'pb_quote_followup',
      name: 'Quote Viewed Follow-Up',
      stage_id: 'stg_6',
      condition: { quote_viewed_hours: 48 },
      action_type: 'create_task',
      recommendation_md: 'Quote viewed by client over 48 hours ago. Reach out to answer questions or negotiate scope.',
      action_payload: { task_title: 'Follow up on viewed quote' },
      priority: 'medium',
      active: true,
    },
    {
      id: 'pb_post_delivery_growth',
      name: 'Post-Delivery Expansion Review',
      stage_id: 'stg_8',
      condition: { days_since_delivery: 14 },
      action_type: 'suggest_upsell',
      recommendation_md: 'Solution has been live for 14 days. Inspect product relations and propose growth retainer or secondary chatbot/voice module.',
      action_payload: { target_stage: 'stg_9' },
      priority: 'medium',
      active: true,
    },
  ];

  // Sample client for testing and verification
  const sampleClientToken = generateToken();
  const sampleQuestionnaireToken = generateToken();
  const sampleQuoteToken = generateToken();
  const sampleFeedbackToken = generateToken();

  const now = new Date().toISOString();

  const sampleClient: Client = {
    id: 'cli_sample_1',
    client_code: 'CIQ-C-0001',
    name: 'Apex Logistics & Freight',
    type: 'company',
    industry: 'Supply Chain & Logistics',
    website: 'https://apexlogistics-demo.co.za',
    country: 'South Africa',
    timezone: 'Africa/Johannesburg',
    source: 'inbound_website',
    source_detail: 'Contact form inquiry regarding order dispatch automation',
    owner_actor: 'Desmond',
    health_score: 82,
    health_reasons: [
      'Active recent communication (+15)',
      'Free sample delivered with satisfaction score 5 (+20)',
      '1 pending follow-up task (-5)',
    ],
    tags: ['logistics', 'automation', 'priority'],
    custom: {
      fleet_size: 45,
      preferred_contact_method: 'whatsapp',
    },
    notes: 'Primary freight hauler seeking automated WhatsApp dispatch updates for drivers.',
    archived_at: null,
    created_by_actor: 'Desmond',
    created_at: '2026-10-10T09:00:00Z',
    updated_at: now,
    is_sample: true,
  };

  const sampleContact: Contact = {
    id: 'cnt_sample_1',
    client_id: 'cli_sample_1',
    full_name: 'Johan van der Merwe',
    email: 'johan@apexlogistics-demo.co.za',
    phone: '+27 82 555 0192',
    whatsapp: '+27 82 555 0192',
    role_title: 'Operations Director',
    is_primary: true,
    preferred_channel: 'whatsapp',
    custom: {},
    created_at: '2026-10-10T09:00:00Z',
  };

  const sampleEngagement: Engagement = {
    id: 'eng_sample_1',
    engagement_code: 'CIQ-E-0001',
    client_id: 'cli_sample_1',
    title: 'Fleet Dispatch Automation & Driver Portal',
    categories: ['Automation', 'App', 'AI Agent'],
    stage_id: 'stg_5', // Sampling: Review
    stage_entered_at: '2026-10-14T11:00:00Z',
    value_estimate: 24500,
    currency: 'ZAR',
    expected_close: '2026-10-25',
    owner_actor: 'Desmond',
    is_sampling: true,
    outcome: null,
    lost_reason: null,
    custom: {},
    archived_at: null,
    created_at: '2026-10-10T09:05:00Z',
    updated_at: now,
  };

  const sampleRequest: RequestItem = {
    id: 'req_sample_1',
    engagement_id: 'eng_sample_1',
    client_id: 'cli_sample_1',
    title: 'Automated WhatsApp waypoint notification for drivers',
    description: 'When truck passes depot gate, trigger WhatsApp message with route link and delivery manifest.',
    product_id: 'prod_auto',
    category: 'Automation',
    priority: 'high',
    status: 'building',
    source: 'questionnaire',
    created_by_actor: 'Desmond',
    created_at: '2026-10-10T10:00:00Z',
  };

  const sampleDeliverable: Deliverable = {
    id: 'del_sample_1',
    deliverable_code: 'CIQ-D-0001',
    client_id: 'cli_sample_1',
    engagement_id: 'eng_sample_1',
    request_id: 'req_sample_1',
    name: 'Driver Dispatch Notification Webhook Prototype',
    kind: 'workflow',
    status: 'sample_delivered',
    is_sample: true,
    live_url: 'https://demo-apex-dispatch.coreiq.app',
    repo_url: 'https://github.com/coreiq/apex-dispatch-sample',
    admin_url: 'https://demo-apex-dispatch.coreiq.app/admin',
    version: '0.9.1-sample',
    description: 'Sample automation webhook that listens to depot check-in and dispatches driver message.',
    tech_stack: ['Node.js', 'Express', 'WhatsApp Cloud API'],
    screenshots: [],
    demo_video_url: 'https://youtu.be/sample-preview',
    hours_spent: 6,
    delivered_at: '2026-10-14T10:30:00Z',
    handover_notes: 'Demo deployed in staging container with sample mock driver numbers.',
    custom: {},
    created_at: '2026-10-12T14:00:00Z',
  };

  const sampleCost: SamplingCost = {
    id: 'sc_sample_1',
    engagement_id: 'eng_sample_1',
    deliverable_id: 'del_sample_1',
    hours: 6,
    hourly_rate: 650,
    note: 'Initial prototype build and WhatsApp template registration',
    logged_by_actor: 'Desmond',
    created_at: '2026-10-14T10:30:00Z',
  };

  const sampleQuestionnaire: Questionnaire = {
    id: 'qn_sample_1',
    client_id: 'cli_sample_1',
    engagement_id: 'eng_sample_1',
    template_id: 'tmpl_generic_discovery',
    title: 'Apex Logistics Operations Discovery',
    questions: seededQuestionnaireTemplate.questions,
    token_hash: sampleQuestionnaireToken.hash,
    token: sampleQuestionnaireToken.token,
    status: 'completed',
    sent_at: '2026-10-10T10:15:00Z',
    completed_at: '2026-10-11T16:20:00Z',
    expires_at: '2026-10-25T10:15:00Z',
    ai_summary:
      'Apex Logistics operates 45 regional freight vehicles in Gauteng. Drivers lose 15-20 min per stop coordinating waybills via voice calls. Key goal is zero-touch WhatsApp dispatch when a vehicle enters the geofence. Budget R20,000-R35,000. Sample success criteria: working WhatsApp message with dynamic manifest PDF.',
    created_at: '2026-10-10T10:15:00Z',
  };

  const sampleResponse: QuestionnaireResponse = {
    id: 'qnr_sample_1',
    questionnaire_id: 'qn_sample_1',
    answers: {
      q1: 'Long-haul freight and temperature-controlled FMCG distribution in Southern Africa.',
      q2: 'Eliminate manual driver coordination calls and send automatic WhatsApp delivery links upon depot departure.',
      q3: 'Dispatch controller (1 person) and 45 company drivers.',
      q4: 'Fleet management telematics (Mix Telematics), Google Sheets, and WhatsApp.',
      q5: 'Dispatchers manually phone each driver with route changes, leading to errors and delays.',
      q6: '2026-11-01',
      q7: 'R25,000 - R60,000',
      q8: 'A test driver getting an automated WhatsApp with the correct delivery stops and one-click Google Maps link.',
    },
    submitted_at: '2026-10-11T16:20:00Z',
    ip_hash: hashSha256('197.83.10.22'),
  };

  const sampleFeedback: Feedback = {
    id: 'fb_sample_1',
    engagement_id: 'eng_sample_1',
    deliverable_id: 'del_sample_1',
    token_hash: sampleFeedbackToken.hash,
    token: sampleFeedbackToken.token,
    status: 'completed',
    satisfaction: 5,
    would_pay: 'yes',
    comments: 'The sample WhatsApp dispatch worked instantly on our test vehicle. Team loved the clear route link.',
    requested_changes: 'Can we also add a button for the driver to confirm arrival at destination?',
    source: 'call',
    recorded_by_actor: 'Desmond',
    created_at: '2026-10-15T14:00:00Z',
  };

  const sampleActivity: Activity = {
    id: 'act_sample_1',
    client_id: 'cli_sample_1',
    engagement_id: 'eng_sample_1',
    type: 'feedback',
    summary: 'Recorded 5/5 sample feedback from Johan (Call)',
    body: 'Johan confirmed sample prototype is exactly what they need. Ready to move forward with full production quote.',
    actor_type: 'human',
    actor_name: 'Desmond',
    metadata: { satisfaction: 5, would_pay: 'yes' },
    occurred_at: '2026-10-15T14:05:00Z',
  };

  const sampleTask: Task = {
    id: 'tsk_sample_1',
    client_id: 'cli_sample_1',
    engagement_id: 'eng_sample_1',
    title: 'Prepare production proposal quote for Johan',
    description: 'Include core automation workflow and WhatsApp arrival confirmation button.',
    due_at: '2026-10-18T17:00:00Z',
    priority: 'high',
    status: 'open',
    assignee_actor: 'Desmond',
    created_by_actor: 'Desmond',
    source: 'manual',
    created_at: '2026-10-15T14:10:00Z',
  };

  const sampleAudit: AuditLogEntry = {
    id: 'aud_sample_1',
    at: '2026-10-10T09:00:00Z',
    actor_type: 'human',
    actor_name: 'Desmond',
    api_key_id: null,
    action: 'client.created',
    entity_type: 'clients',
    entity_id: 'cli_sample_1',
    before: null,
    after: { client_code: 'CIQ-C-0001', name: 'Apex Logistics & Freight' },
    request_id: 'req_init_001',
    idempotency_key: null,
  };

  const sampleNba: NbaItem = {
    id: 'nba_sample_1',
    client_id: 'cli_sample_1',
    engagement_id: 'eng_sample_1',
    playbook_id: 'pb_happy_sample_quote',
    source: 'rule',
    title: 'Happy sample rating: Create Quote',
    reason: 'Client Johan gave sample 5/5 score and would pay yes. Prepare production quote.',
    action_type: 'suggest_quote',
    action_payload: { next_stage: 'stg_6' },
    status: 'open',
    created_at: '2026-10-15T14:06:00Z',
  };

  const initialSettings: CrmSettings = {
    brand_name: 'CoreIQ CRM',
    currency: 'ZAR',
    tax_rate: 0.15, // 15% VAT
    quote_validity_days: 14,
    quote_terms_md: `### Commercial Terms & Conditions
1. **Scope of Delivery**: The solution will be delivered in accordance with the specified line items and attached Build Brief.
2. **Payment Schedule**: 50% mobilization deposit upon quote acceptance, 50% upon deployment and handover.
3. **Turnaround & Support**: Build initiated within 2 business days of deposit. 30 days complimentary bug-fixing warranty included.
4. **Intellectual Property**: Full repository access and license transferred to Client upon final settlement.`,
    code_formats: {
      client_prefix: 'CIQ-C-',
      engagement_prefix: 'CIQ-E-',
      quote_prefix: 'CIQ-Q-',
      deliverable_prefix: 'CIQ-D-',
      asset_prefix: 'CIQ-A-',
    },
    agent_discount_cap_pct: 10,
    approval_threshold_pct: 20,
    stale_days: 7,
    working_timezone: 'Africa/Johannesburg',
    weekly_build_hours: 40,
    send_mode: 'draft', // default draft only
    theme_tokens: {
      background: '#04091A',
      surface: '#0A1329',
      primary: '#00E5FF',
      secondary: '#3B82F6',
      warning: '#F59E0B',
      danger: '#EF4444',
      success: '#10B981',
    },
    visible_tabs: [
      'overview',
      'requests',
      'discovery',
      'sampling',
      'built',
      'quotes',
      'emails',
      'activity',
      'tasks',
      'files',
    ],
  };

  return {
    settings: initialSettings,
    users: [
      {
        id: 'usr_desmond',
        display_name: 'Desmond (Owner)',
        avatar_url: '',
        role: 'owner',
      },
      {
        id: 'usr_admin',
        display_name: 'Operations Admin',
        avatar_url: '',
        role: 'admin',
      },
      {
        id: 'usr_operator',
        display_name: 'Lead Operator',
        avatar_url: '',
        role: 'operator',
      },
      {
        id: 'usr_viewer',
        display_name: 'External Auditor',
        avatar_url: '',
        role: 'viewer',
      },
    ],
    pipeline_stages: seededStages,
    clients: [],
    contacts: [],
    engagements: [],
    stage_history: [],
    requests: [],
    activities: [],
    tasks: [],
    custom_field_defs: [
      {
        id: 'cf_1',
        entity: 'clients',
        key: 'fleet_size',
        label: 'Fleet Size / Seats',
        type: 'number',
        options: [],
        show_on_card: true,
        show_on_board: true,
        filterable: true,
        position: 1,
      },
      {
        id: 'cf_2',
        entity: 'clients',
        key: 'preferred_contact_method',
        label: 'Preferred Channel',
        type: 'select',
        options: ['whatsapp', 'email', 'phone'],
        show_on_card: true,
        show_on_board: false,
        filterable: true,
        position: 2,
      },
    ],
    questionnaire_templates: [seededQuestionnaireTemplate],
    questionnaires: [sampleQuestionnaire],
    questionnaire_responses: [sampleResponse],
    feedback: [sampleFeedback],
    sampling_costs: [sampleCost],
    deliverables: [sampleDeliverable],
    products: seededProducts,
    product_options: [
      {
        id: 'opt_1',
        product_id: 'prod_auto',
        name: 'SMS & WhatsApp Fallback Channel',
        price_mode: 'add',
        amount: 1200,
        description: 'Multi-channel retry if primary provider reports delivery failure',
      },
      {
        id: 'opt_2',
        product_id: 'prod_app',
        name: 'Priority 99.9% Uptime SLA Retainer',
        price_mode: 'multiply',
        amount: 0.15,
        description: '15% surcharge for guaranteed 2-hour critical response SLA',
      },
    ],
    price_tiers: [
      {
        id: 'tier_1',
        product_id: 'prod_oth',
        label: 'Standard Consulting (1-10 hrs)',
        min_qty: 1,
        max_qty: 10,
        unit_price: 1500,
      },
      {
        id: 'tier_2',
        product_id: 'prod_oth',
        label: 'Volume Consulting (11+ hrs)',
        min_qty: 11,
        max_qty: null,
        unit_price: 1250,
      },
    ],
    product_relations: seededProductRelations,
    bundles: [],
    bundle_items: [],
    quotes: [],
    quote_lines: [],
    approvals: [],
    build_briefs: [],
    assets: seededAssets,
    asset_usage: [
      {
        id: 'asu_1',
        asset_id: 'ast_3',
        deliverable_id: 'del_sample_1',
        client_id: 'cli_sample_1',
        used_at: '2026-10-13T10:00:00Z',
        hours_saved: 7,
      },
    ],
    email_accounts: [
      {
        id: 'eml_acc_1',
        label: 'Desmond (CoreIQ Create)',
        from_name: 'Desmond · CoreIQ Create',
        from_email: 'desmond@coreiq.create',
        provider: 'resend',
        status: 'needs_key',
      },
    ],
    email_templates: [
      {
        id: 'tmpl_intro',
        name: 'Initial Inbound Warm Welcome',
        category: 'Outreach',
        subject: 'CoreIQ — Quick follow-up regarding {{title}}',
        body_md: `Hi {{first_name}},

Thanks for reaching out to CoreIQ Create regarding {{title}}.

We specialize in rapid, production-ready AI operators and automated pipelines. To help us build a laser-focused prototype for you, would you mind taking 3 minutes to fill in our interactive discovery questionnaire?

Discovery link: {{questionnaire_link}}

Speak soon,
Desmond · CoreIQ Create`,
        variables: ['first_name', 'title', 'questionnaire_link'],
      },
      {
        id: 'tmpl_sample_ready',
        name: 'Sample Delivered Notification',
        category: 'Sampling',
        subject: 'Your working prototype is live — {{sample_name}}',
        body_md: `Hi {{first_name}},

We've finished building your free working prototype:
{{sample_name}}

You can test it directly here: {{live_url}}

Once you've had a test run, please drop your 30-second verdict here: {{feedback_link}}

Best,
Desmond`,
        variables: ['first_name', 'sample_name', 'live_url', 'feedback_link'],
      },
      {
        id: 'tmpl_quote_sent',
        name: 'Commercial Proposal Ready',
        category: 'Quotes',
        subject: 'CoreIQ Proposal & Build Scope: {{quote_code}}',
        body_md: `Hi {{first_name}},

Following our successful sample review, your commercial proposal and build brief are ready:

Review and accept quote online: {{quote_link}}
Total: {{quote_total}} (VAT inclusive)
Valid until: {{valid_until}}

Looking forward to launching this with you.

Regards,
Desmond`,
        variables: ['first_name', 'quote_code', 'quote_link', 'quote_total', 'valid_until'],
      },
    ],
    email_sequences: [
      {
        id: 'seq_1',
        name: 'Inbound Discovery Follow-Up (3-step)',
        steps: [
          { day_offset: 0, template_id: 'tmpl_intro' },
          { day_offset: 2, template_id: 'tmpl_intro', subject_override: 'Following up: discovery link for {{first_name}}' },
        ],
        stop_on_reply: true,
        active: true,
      },
    ],
    sequence_enrollments: [],
    email_messages: [
      {
        id: 'msg_1',
        client_id: 'cli_sample_1',
        contact_id: 'cnt_sample_1',
        engagement_id: 'eng_sample_1',
        direction: 'in',
        subject: 'Freight dispatch inquiry',
        body_html: '<p>Hi Desmond, we need a way to auto-notify drivers when they leave the yard. Can you help?</p>',
        body_text: 'Hi Desmond, we need a way to auto-notify drivers when they leave the yard. Can you help?',
        provider_message_id: 'prov_in_001',
        thread_id: 'thread_apex_001',
        in_reply_to: null,
        status: 'received',
        sent_at: '2026-10-10T08:45:00Z',
        received_at: '2026-10-10T08:45:00Z',
        created_by_actor: 'Johan van der Merwe',
      },
    ],
    suppression_list: [],
    api_keys: [
      {
        id: 'key_hermes_sample',
        name: 'Hermes Full Operator Agent',
        actor_name: 'Hermes',
        actor_type: 'agent',
        key_prefix: 'ciq_crm_hermes_',
        key_hash: hashSha256('ciq_crm_hermes_secret_sample_key_999'),
        scopes: [
          'clients:read',
          'clients:write',
          'engagements:read',
          'engagements:write',
          'stages:move',
          'requests:read',
          'requests:write',
          'activities:write',
          'tasks:read',
          'tasks:write',
          'questionnaires:read',
          'questionnaires:write',
          'questionnaires:send',
          'feedback:read',
          'feedback:write',
          'deliverables:read',
          'deliverables:write',
          'catalog:read',
          'catalog:write',
          'pricing:read',
          'quotes:read',
          'quotes:write',
          'quotes:send',
          'assets:read',
          'assets:write',
          'email:read',
          'email:draft',
          'email:send',
          'analytics:read',
          'webhooks:manage',
        ],
        rate_limit_per_min: 120,
        expires_at: null,
        last_used_at: '2026-10-15T12:00:00Z',
        revoked_at: null,
        created_by: 'Desmond',
        created_at: '2026-10-01T08:00:00Z',
      },
      {
        id: 'key_readonly_sample',
        name: 'Audit Read-Only Key',
        actor_name: 'ReadBot',
        actor_type: 'service',
        key_prefix: 'ciq_crm_readonly_',
        key_hash: hashSha256('ciq_crm_readonly_sample_key_111'),
        scopes: [
          'clients:read',
          'engagements:read',
          'requests:read',
          'tasks:read',
          'questionnaires:read',
          'feedback:read',
          'deliverables:read',
          'catalog:read',
          'pricing:read',
          'quotes:read',
          'assets:read',
          'email:read',
          'analytics:read',
        ],
        rate_limit_per_min: 60,
        expires_at: null,
        last_used_at: null,
        revoked_at: null,
        created_by: 'Desmond',
        created_at: '2026-10-01T08:00:00Z',
      },
      {
        id: 'key_revoked_sample',
        name: 'Decommissioned Test Key',
        actor_name: 'OldBot',
        actor_type: 'agent',
        key_prefix: 'ciq_crm_revoked_',
        key_hash: hashSha256('ciq_crm_revoked_sample_key_000'),
        scopes: ['clients:read'],
        rate_limit_per_min: 60,
        expires_at: null,
        last_used_at: null,
        revoked_at: '2026-10-05T12:00:00Z',
        created_by: 'Desmond',
        created_at: '2026-10-01T08:00:00Z',
      },
    ],
    audit_log: [sampleAudit],
    webhook_endpoints: [
      {
        id: 'whe_1',
        name: 'Internal Operations Webhook',
        url: 'https://webhook.site/demo-coreiq',
        events: ['engagement.stage_changed', 'quote.accepted', 'feedback.received'],
        active: false,
        secret_ref: 'whsec_sample_secret_key',
      },
    ],
    webhook_deliveries: [],
    integrations: [
      {
        id: 'int_swarmhive',
        provider: 'swarmhive',
        config: {
          base_url: '',
          comms_channel: 'crm',
          payload_template: '{"sender": "crm", "recipient": "{{recipient}}", "body": "{{body}}"}',
        },
        secret_ref: 'SWARMHIVE_API_KEY',
        status: 'unconfigured',
        last_checked_at: null,
      },
      {
        id: 'int_resend',
        provider: 'resend',
        config: {
          from_domain: 'coreiq.create',
        },
        secret_ref: 'RESEND_API_KEY',
        status: 'unconfigured',
        last_checked_at: null,
      },
    ],
    playbooks: seededPlaybooks,
    nba_items: [sampleNba],
    ai_runs: [],
    business_settings: defaultBusinessSettings,
    invoices: [],
    invoice_items: [],
    payments: [],
    retainers: [],
    milestones: [],
    push_subscriptions: [],
    idempotency_keys: [],
    counters: {
      client: 1,
      engagement: 1,
      quote: 0,
      deliverable: 1,
      asset: 5,
      request_seq: 1,
      invoice: 1,
      project: 0,
    },
  };
}

export const defaultBusinessSettings: BusinessSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  trading_name: 'CoreIQ Create',
  tagline: 'Ideas | Intelligence | Action',
  email: 'operator@coreiq.com',
  website: 'https://coreiq.com',
  address: 'Johannesburg, South Africa',
  registration_number: '',
  vat_number: '',
  vat_enabled: false,
  vat_rate: 0.15,
  logo_url: '',
  currency: 'ZAR',
  currency_symbol: 'R',
  payment_due_days: 7,
  quote_validity_days: 14,
  deposit_pct: 50,
  invoice_prefix: 'CIQ-',
  quote_prefix: 'CIQ-Q-',
  project_prefix: 'CIQ-P-',
  timezone: 'Africa/Johannesburg',
  next_invoice_number: 2,
  next_quote_number: 1,
  payment_methods: [
    {
      id: 'eft',
      type: 'eft',
      label: 'Electronic Funds Transfer (EFT)',
      enabled: true,
      rows: [
        { label: 'Bank', value: '' },
        { label: 'Account Holder', value: '' },
        { label: 'Account Type', value: '' },
        { label: 'Account Number', value: '' },
        { label: 'Branch Code', value: '' },
      ],
      instructions: 'Please use invoice number as payment reference and send POP to operator@coreiq.com',
    },
  ],
  terms_blocks: {
    payment_terms: 'Starter text: review before use. Payment is due within 7 days of invoice date.',
    deposit_cancellation: 'Starter text: review before use. A 50% deposit is required before build initiation. Work is non-refundable once started.',
    scope_revisions: 'Starter text: review before use. Specifications detailed in the Build Brief govern scope. Extra revisions billed at standard catalog rates.',
    delivery_maintenance: 'Starter text: review before use. Handover includes repository access. Maintenance retainers available separately.',
    late_payment: 'Starter text: review before use. Overdue invoices incur 2% per month penalty interest.',
    general: 'Starter text: review before use. South African commercial law applies.',
  },
  agents_paused: false,
  send_mode: 'draft',
  followup_min_hours: 24,
  followup_max_per_stage: 3,
  invoice_reminder_days: [2, -1, -7, -14],
  quote_followup_days: 3,
  push_events: {
    new_lead: true,
    money_in: true,
    build_needed: true,
    retainer_due: true,
  },
};

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const loaded = JSON.parse(raw);
        // Additive fields ensure Cloud Run & local memory persistence
        if (!loaded.business_settings) loaded.business_settings = { ...defaultBusinessSettings };
        if (!loaded.invoices) loaded.invoices = [];
        if (!loaded.invoice_items) loaded.invoice_items = [];
        if (!loaded.payments) loaded.payments = [];
        if (!loaded.retainers) loaded.retainers = [];
        if (!loaded.milestones) loaded.milestones = [];
        if (!loaded.push_subscriptions) loaded.push_subscriptions = [];
        if (!loaded.idempotency_keys) loaded.idempotency_keys = [];
        if (!loaded.counters) loaded.counters = {};
        if (loaded.counters.invoice === undefined) loaded.counters.invoice = 1;
        if (loaded.counters.project === undefined) loaded.counters.project = 0;
        return loaded;
      }
    } catch (e) {
      console.warn('Failed to read db file, initializing with defaults:', e);
    }
    const fresh = getInitialDatabase();
    this.save(fresh);
    return fresh;
  }

  public save(dataToSave?: DatabaseSchema) {
    if (dataToSave) {
      this.data = dataToSave;
    }
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  public get(): DatabaseSchema {
    return this.data;
  }

  public getBusinessSettings(): BusinessSettings {
    if (!this.data.business_settings) {
      this.data.business_settings = { ...defaultBusinessSettings };
      this.save();
    }
    return this.data.business_settings;
  }

  public updateBusinessSettings(updates: Partial<BusinessSettings>): BusinessSettings {
    this.data.business_settings = {
      ...this.getBusinessSettings(),
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.save();
    return this.data.business_settings;
  }

  // Sequential code generators
  public nextClientCode(): string {
    this.data.counters.client += 1;
    this.save();
    const num = String(this.data.counters.client).padStart(4, '0');
    return `${this.data.settings.code_formats.client_prefix || 'CIQ-C-'}${num}`;
  }

  public nextEngagementCode(): string {
    this.data.counters.engagement += 1;
    this.save();
    const num = String(this.data.counters.engagement).padStart(4, '0');
    return `${this.data.settings.code_formats.engagement_prefix || 'CIQ-E-'}${num}`;
  }

  public nextHumanEngagementCode(): string {
    this.data.counters.project = (this.data.counters.project || 0) + 1;
    this.save();
    const num = String(this.data.counters.project).padStart(4, '0');
    return `${this.data.business_settings?.project_prefix || 'CIQ-P-'}${num}`;
  }

  public nextInvoiceCode(): string {
    const current = this.data.business_settings?.next_invoice_number || (this.data.counters.invoice || 1) + 1;
    const num = String(current).padStart(4, '0');
    const prefix = this.data.business_settings?.invoice_prefix || 'CIQ-';
    const code = `${prefix}${num}`;
    if (this.data.business_settings) {
      this.data.business_settings.next_invoice_number = current + 1;
    }
    this.data.counters.invoice = current;
    this.save();
    return code;
  }

  public nextQuoteCode(version: number = 1): string {
    this.data.counters.quote += 1;
    this.save();
    const num = String(this.data.counters.quote).padStart(4, '0');
    return `${this.data.settings.code_formats.quote_prefix || 'CIQ-Q-'}${num}-v${version}`;
  }

  public nextDeliverableCode(): string {
    this.data.counters.deliverable += 1;
    this.save();
    const num = String(this.data.counters.deliverable).padStart(4, '0');
    return `${this.data.settings.code_formats.deliverable_prefix || 'CIQ-D-'}${num}`;
  }

  public nextAssetCode(): string {
    this.data.counters.asset += 1;
    this.save();
    const num = String(this.data.counters.asset).padStart(4, '0');
    return `${this.data.settings.code_formats.asset_prefix || 'CIQ-A-'}${num}`;
  }

  // Append-only audit logger
  public logAudit(entry: Omit<AuditLogEntry, 'id' | 'at'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      id: `aud_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      at: new Date().toISOString(),
      ...entry,
    };
    this.data.audit_log.push(fullEntry);
    this.save();
    return fullEntry;
  }

  // Health Score computation
  public computeClientHealth(client: Client): { score: number; reasons: string[] } {
    let score = 100;
    const reasons: string[] = [];

    // Check last activity
    const clientActivities = this.data.activities.filter((a) => a.client_id === client.id);
    if (clientActivities.length === 0) {
      score -= 20;
      reasons.push('No recorded timeline activities (-20)');
    } else {
      const sorted = [...clientActivities].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
      const daysSince = Math.floor((Date.now() - new Date(sorted[0].occurred_at).getTime()) / (1000 * 3600 * 24));
      if (daysSince > 14) {
        score -= 30;
        reasons.push(`No activity in ${daysSince} days (-30)`);
      } else if (daysSince > 7) {
        score -= 15;
        reasons.push(`Inactive for ${daysSince} days (-15)`);
      } else {
        reasons.push('Recent contact within last 7 days (+10)');
      }
    }

    // Overdue tasks
    const now = new Date();
    const overdueTasks = this.data.tasks.filter((t) => t.client_id === client.id && t.status === 'open' && new Date(t.due_at) < now);
    if (overdueTasks.length > 0) {
      const penalty = Math.min(30, overdueTasks.length * 10);
      score -= penalty;
      reasons.push(`${overdueTasks.length} overdue task(s) (-${penalty})`);
    }

    // Latest feedback
    const engagements = this.data.engagements.filter((e) => e.client_id === client.id);
    const engIds = engagements.map((e) => e.id);
    const clientFeedback = this.data.feedback.filter((f) => engIds.includes(f.engagement_id));
    if (clientFeedback.length > 0) {
      const latest = clientFeedback[clientFeedback.length - 1];
      if (latest.satisfaction >= 4) {
        score += 15;
        reasons.push(`Positive sample review score ${latest.satisfaction}/5 (+15)`);
      } else if (latest.satisfaction <= 2) {
        score -= 25;
        reasons.push(`Low sample satisfaction ${latest.satisfaction}/5 (-25)`);
      }
    }

    const finalScore = Math.max(0, Math.min(100, score));
    return { score: finalScore, reasons };
  }

  // Purge sample data (One-click in Settings)
  public purgeSampleData(): { purgedCount: number } {
    const sampleClients = this.data.clients.filter((c) => c.is_sample);
    const sampleClientIds = sampleClients.map((c) => c.id);

    this.data.clients = this.data.clients.filter((c) => !c.is_sample);
    this.data.contacts = this.data.contacts.filter((c) => !sampleClientIds.includes(c.client_id));
    this.data.engagements = this.data.engagements.filter((e) => !sampleClientIds.includes(e.client_id));
    this.data.requests = this.data.requests.filter((r) => !sampleClientIds.includes(r.client_id));
    this.data.activities = this.data.activities.filter((a) => !sampleClientIds.includes(a.client_id));
    this.data.tasks = this.data.tasks.filter((t) => !sampleClientIds.includes(t.client_id));
    this.data.deliverables = this.data.deliverables.filter((d) => !sampleClientIds.includes(d.client_id));
    this.data.quotes = this.data.quotes.filter((q) => !sampleClientIds.includes(q.client_id));

    this.save();
    return { purgedCount: sampleClients.length };
  }

  // Reset/reseed database
  public resetToDefaults() {
    this.data = getInitialDatabase();
    this.save();
  }
}

export const db = new DatabaseManager();
