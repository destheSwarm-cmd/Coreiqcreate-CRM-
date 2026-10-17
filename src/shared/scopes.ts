export interface ScopeDefinition {
  scope: string;
  category: string;
  description: string;
  isHumanOnly?: boolean;
}

export const ALL_SCOPES: ScopeDefinition[] = [
  // Clients
  { scope: 'clients:read', category: 'Clients', description: 'Read clients and contact details' },
  { scope: 'clients:write', category: 'Clients', description: 'Create and update clients' },

  // Engagements & Stages
  { scope: 'engagements:read', category: 'Engagements', description: 'View pipeline journeys and stages' },
  { scope: 'engagements:write', category: 'Engagements', description: 'Create and update engagements' },
  { scope: 'stages:move', category: 'Engagements', description: 'Advance or change pipeline stage with required reason' },

  // Requests
  { scope: 'requests:read', category: 'Requests', description: 'View client project requests and scope items' },
  { scope: 'requests:write', category: 'Requests', description: 'Create and edit client requests' },

  // Activities & Tasks
  { scope: 'activities:write', category: 'Timeline', description: 'Log notes, meetings, calls, and agent events' },
  { scope: 'tasks:read', category: 'Tasks', description: 'Read operator and agent tasks' },
  { scope: 'tasks:write', category: 'Tasks', description: 'Create, assign, and mark tasks done' },

  // Discovery Questionnaires
  { scope: 'questionnaires:read', category: 'Questionnaires', description: 'Read discovery questionnaires and responses' },
  { scope: 'questionnaires:write', category: 'Questionnaires', description: 'Create and configure questionnaires' },
  { scope: 'questionnaires:send', category: 'Questionnaires', description: 'Dispatch questionnaires to clients' },

  // Feedback & Sampling
  { scope: 'feedback:read', category: 'Feedback', description: 'View sample ratings and client comments' },
  { scope: 'feedback:write', category: 'Feedback', description: 'Record sampling feedback and sentiment' },

  // Deliverables (Built)
  { scope: 'deliverables:read', category: 'Deliverables', description: 'View software builds, repos, and live URLs' },
  { scope: 'deliverables:write', category: 'Deliverables', description: 'Register new deliverables and versions' },

  // Catalog & Pricing
  { scope: 'catalog:read', category: 'Catalog', description: 'View software products and pricing tiers' },
  { scope: 'catalog:write', category: 'Catalog', description: 'Edit products, prices, and options' },
  { scope: 'pricing:read', category: 'Pricing', description: 'Run price estimation formulas' },

  // Quotes
  { scope: 'quotes:read', category: 'Quotes', description: 'View quotes, line totals, and terms' },
  { scope: 'quotes:write', category: 'Quotes', description: 'Draft and edit commercial quotes' },
  { scope: 'quotes:send', category: 'Quotes', description: 'Send approved quotes to clients' },

  // Assets
  { scope: 'assets:read', category: 'Assets', description: 'Browse reusable software asset library' },
  { scope: 'assets:write', category: 'Assets', description: 'Add assets and log reuse events' },

  // Email
  { scope: 'email:read', category: 'Email', description: 'Read threaded email history' },
  { scope: 'email:draft', category: 'Email', description: 'Compose email drafts' },
  { scope: 'email:send', category: 'Email', description: 'Dispatch live outbound emails' },

  // Analytics, Webhooks, Settings
  { scope: 'analytics:read', category: 'Analytics', description: 'Read funnel, revenue, and ROI metrics' },
  { scope: 'webhooks:manage', category: 'Integrations', description: 'Configure endpoints and test webhooks' },
  { scope: 'settings:write', category: 'Settings', description: 'Update CRM configuration and tokens' },
  { scope: 'admin:destructive', category: 'Admin', description: 'Perform soft delete and archive operations' },

  // Human-only scopes
  {
    scope: 'quotes:approve',
    category: 'Governance (Human Only)',
    description: 'Approve quotes with discounts exceeding threshold',
    isHumanOnly: true,
  },
  {
    scope: 'keys:manage',
    category: 'Governance (Human Only)',
    description: 'Create, rotate, and revoke API keys',
    isHumanOnly: true,
  },
];

export const GRANTABLE_SCOPES = ALL_SCOPES.filter((s) => !s.isHumanOnly).map((s) => s.scope);

export interface ScopePreset {
  id: string;
  label: string;
  description: string;
  scopes: string[];
}

export const SCOPE_PRESETS: ScopePreset[] = [
  {
    id: 'agent_full_operator',
    label: 'Agent: Full Operator',
    description: 'Everything needed to run pipeline, log clients, draft quotes, record feedback, excluding destructive/human approvals',
    scopes: GRANTABLE_SCOPES.filter((s) => s !== 'admin:destructive' && s !== 'settings:write'),
  },
  {
    id: 'agent_read_only',
    label: 'Agent: Read Only',
    description: 'Inspect clients, pipeline status, deliverables, catalog, and analytics without write permissions',
    scopes: ALL_SCOPES.filter((s) => s.scope.endsWith(':read') && !s.isHumanOnly).map((s) => s.scope),
  },
  {
    id: 'intake_bot',
    label: 'Intake Bot',
    description: 'Limited scope for website contact forms and inbound lead capture',
    scopes: ['clients:write', 'activities:write', 'requests:write'],
  },
  {
    id: 'admin',
    label: 'Admin',
    description: 'All grantable scopes including destructive archive operations',
    scopes: GRANTABLE_SCOPES,
  },
];

export function hasScope(grantedScopes: string[], requiredScope: string): boolean {
  if (grantedScopes.includes('admin') || grantedScopes.includes('*')) return true;
  return grantedScopes.includes(requiredScope);
}
