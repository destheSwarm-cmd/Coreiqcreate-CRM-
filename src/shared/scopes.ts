export interface ScopeDefinition {
  scope: string;
  group: 'clients' | 'pipeline' | 'work' | 'money' | 'docs' | 'comms' | 'insights' | 'system' | 'intake';
  category: string;
  description: string;
  isWrite: boolean;
  isHumanOnly?: boolean;
}

// 8 Primary Groups (each read & write) + intake + admin
export const SCOPE_GROUPS = [
  'clients',
  'pipeline',
  'work',
  'money',
  'docs',
  'comms',
  'insights',
  'system',
] as const;

export type ScopeGroup = (typeof SCOPE_GROUPS)[number];

export const PRIMARY_GROUP_SCOPES: ScopeDefinition[] = [
  // Clients
  { scope: 'clients:read', group: 'clients', category: 'Clients', description: 'Read clients, contacts, and relationship records', isWrite: false },
  { scope: 'clients:write', group: 'clients', category: 'Clients', description: 'Create and edit clients and contacts', isWrite: true },

  // Pipeline
  { scope: 'pipeline:read', group: 'pipeline', category: 'Pipeline', description: 'View pipeline journeys, stages, and stage history', isWrite: false },
  { scope: 'pipeline:write', group: 'pipeline', category: 'Pipeline', description: 'Advance stages, update outcome, and transition engagements', isWrite: true },

  // Work (Requests, Tasks, Activities, Milestones)
  { scope: 'work:read', group: 'work', category: 'Work', description: 'View requests, tasks, milestones, and deliverable items', isWrite: false },
  { scope: 'work:write', group: 'work', category: 'Work', description: 'Create and update tasks, milestones, requests, and log activity', isWrite: true },

  // Money (Catalog, Quotes, Invoices, Payments, Retainers, Pricing)
  { scope: 'money:read', group: 'money', category: 'Money', description: 'View prices, quotes, invoices, payments, and retainers', isWrite: false },
  { scope: 'money:write', group: 'money', category: 'Money', description: 'Create/void invoices, draft quotes, record payments, manage retainers', isWrite: true },

  // Docs (Deliverables, Assets, Briefs, Questionnaires, Feedback, PDF)
  { scope: 'docs:read', group: 'docs', category: 'Docs', description: 'Read build briefs, assets, questionnaires, and feedback', isWrite: false },
  { scope: 'docs:write', group: 'docs', category: 'Docs', description: 'Generate PDFs, add assets, register builds, record feedback', isWrite: true },

  // Comms (Email threads, Templates, Push alerts)
  { scope: 'comms:read', group: 'comms', category: 'Comms', description: 'Read email history and push settings', isWrite: false },
  { scope: 'comms:write', group: 'comms', category: 'Comms', description: 'Draft/send email notifications and dispatch push events', isWrite: true },

  // Insights (Analytics, Summaries, Follow-ups, Audit)
  { scope: 'insights:read', group: 'insights', category: 'Insights', description: 'Read pipeline summary, analytics, and audit logs', isWrite: false },
  { scope: 'insights:write', group: 'insights', category: 'Insights', description: 'Acknowledge alerts and snooze follow-up cadence', isWrite: true },

  // System (Business Settings, Webhooks, Backups, Human Request, Admin)
  { scope: 'system:read', group: 'system', category: 'System', description: 'Read business profile, webhooks, backups, and ping status', isWrite: false },
  { scope: 'system:write', group: 'system', category: 'System', description: 'Create backups, request human owner intervention, update business terms', isWrite: true },

  // Website Intake Scope
  { scope: 'intake', group: 'intake', category: 'Intake', description: 'Dedicated inbound website form and lead capture', isWrite: true },
];

// Legacy Scope to 8-group mapping table
export const LEGACY_SCOPE_MAP: Record<string, string> = {
  // Clients
  'clients:read': 'clients:read',
  'clients:write': 'clients:write',

  // Pipeline
  'engagements:read': 'pipeline:read',
  'engagements:write': 'pipeline:write',
  'stages:move': 'pipeline:write',

  // Work
  'requests:read': 'work:read',
  'requests:write': 'work:write',
  'tasks:read': 'work:read',
  'tasks:write': 'work:write',
  'activities:write': 'work:write',
  'milestones:read': 'work:read',
  'milestones:write': 'work:write',

  // Money
  'pricing:read': 'money:read',
  'catalog:read': 'money:read',
  'catalog:write': 'money:write',
  'quotes:read': 'money:read',
  'quotes:write': 'money:write',
  'quotes:send': 'money:write',
  'invoices:read': 'money:read',
  'invoices:write': 'money:write',
  'payments:write': 'money:write',
  'retainers:read': 'money:read',
  'retainers:write': 'money:write',

  // Docs
  'deliverables:read': 'docs:read',
  'deliverables:write': 'docs:write',
  'assets:read': 'docs:read',
  'assets:write': 'docs:write',
  'questionnaires:read': 'docs:read',
  'questionnaires:write': 'docs:write',
  'questionnaires:send': 'docs:write',
  'feedback:read': 'docs:read',
  'feedback:write': 'docs:write',

  // Comms
  'email:read': 'comms:read',
  'email:draft': 'comms:write',
  'email:send': 'comms:write',

  // Insights
  'analytics:read': 'insights:read',

  // System
  'webhooks:manage': 'system:write',
  'settings:write': 'system:write',
  'admin:destructive': 'system:write',
  'quotes:approve': 'system:write',
  'keys:manage': 'system:write',
};

export const ALL_SCOPES: ScopeDefinition[] = [...PRIMARY_GROUP_SCOPES];

export const GRANTABLE_SCOPES = [
  '*',
  ...PRIMARY_GROUP_SCOPES.map((s) => s.scope),
];

export interface ScopePreset {
  id: string;
  label: string;
  description: string;
  scopes: string[];
}

export const SCOPE_PRESETS: ScopePreset[] = [
  {
    id: 'full_access',
    label: 'Full Access (*)',
    description: 'Full unconstrained agent access to all 8 operational groups and MCP tools',
    scopes: ['*'],
  },
  {
    id: 'read_only',
    label: 'Read-Only (All Groups)',
    description: 'Inspect pipeline, deals, tasks, catalog, invoices, and analytics without write permissions',
    scopes: [
      'clients:read',
      'pipeline:read',
      'work:read',
      'money:read',
      'docs:read',
      'comms:read',
      'insights:read',
      'system:read',
    ],
  },
  {
    id: 'website_intake',
    label: 'Website Intake',
    description: 'Scoped strictly for inbound website lead form submissions and webhooks',
    scopes: ['intake'],
  },
  {
    id: 'custom',
    label: 'Custom Scope Selection',
    description: 'Select specific read or write groups as required by agent capabilities',
    scopes: ['clients:read', 'pipeline:read', 'work:read'],
  },
];

export function hasScope(grantedScopes: string[], requiredScope: string): boolean {
  if (!grantedScopes || !Array.isArray(grantedScopes)) return false;
  if (grantedScopes.includes('*') || grantedScopes.includes('admin')) return true;
  if (grantedScopes.includes(requiredScope)) return true;

  // Check group-level mapping
  const mappedGroup = LEGACY_SCOPE_MAP[requiredScope];
  if (mappedGroup && grantedScopes.includes(mappedGroup)) return true;

  // Check wildcard group (e.g. 'pipeline:*' covers 'pipeline:read')
  const [group] = requiredScope.split(':');
  if (group && grantedScopes.includes(`${group}:*`)) return true;

  return false;
}
