import crypto from 'crypto';
import { db, generateToken } from './db';
import { hasScope } from './scopes';
import { computeLinePrice, computeQuoteTotals } from './pricingEngine';
import { governor } from './governor';
import {
  ApiKey,
  Client,
  Engagement,
  Deliverable,
  Quote,
  QuoteLine,
  RequestItem,
  Task,
  Activity,
  Feedback,
  Invoice,
  InvoiceItem,
  Payment,
  Retainer,
  Milestone,
} from '../types/crm';
import { MCP_TOOLS, McpToolDefinition } from '../shared/mcpToolList';
import { generateInvoicePdf, generateQuotePdf } from './pdfGenerator';
import { sendPushNotification } from './pushNotifier';

export { MCP_TOOLS };
export type { McpToolDefinition };

// Baseline MCP tools imported from shared/mcpToolList
const UNUSED_LEGACY_TOOLS: any[] = [
  {
    name: 'crm_search_clients',
    description: 'Search clients by query string (name, industry, tags, code) or stage',
    requiredScope: 'clients:read',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term for name or tags' },
        stage_id: { type: 'string', description: 'Filter by current engagement stage' },
        limit: { type: 'number', description: 'Maximum results to return' },
      },
    },
  },
  {
    name: 'crm_get_client_card',
    description: 'Get complete 360-degree client card (contacts, engagements, requests, questionnaires, feedback, deliverables, quotes, timeline, tasks, health)',
    requiredScope: 'clients:read',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Client ID or Client Code (CIQ-C-XXXX)' },
      },
      required: ['client_id'],
    },
  },
  {
    name: 'crm_create_client',
    description: 'Create a new client with auto-assigned CIQ-C-XXXX human code',
    requiredScope: 'clients:write',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { type: 'string', enum: ['company', 'individual'] },
        industry: { type: 'string' },
        website: { type: 'string' },
        country: { type: 'string' },
        source: { type: 'string' },
        notes: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        dry_run: { type: 'boolean' },
        idempotency_key: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'crm_update_client',
    description: 'Update fields on an existing client',
    requiredScope: 'clients:write',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        name: { type: 'string' },
        industry: { type: 'string' },
        website: { type: 'string' },
        notes: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        dry_run: { type: 'boolean' },
      },
      required: ['client_id'],
    },
  },
  {
    name: 'crm_add_contact',
    description: 'Add a contact person to a client',
    requiredScope: 'clients:write',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        full_name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        whatsapp: { type: 'string' },
        role_title: { type: 'string' },
        is_primary: { type: 'boolean' },
      },
      required: ['client_id', 'full_name', 'email'],
    },
  },
  {
    name: 'crm_create_engagement',
    description: 'Create an engagement journey through the pipeline for a client',
    requiredScope: 'engagements:write',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        title: { type: 'string' },
        categories: { type: 'array', items: { type: 'string' } },
        stage_id: { type: 'string' },
        value_estimate: { type: 'number' },
        expected_close: { type: 'string' },
      },
      required: ['client_id', 'title'],
    },
  },
  {
    name: 'crm_update_engagement',
    description: 'Update engagement attributes (title, categories, estimated value)',
    requiredScope: 'engagements:write',
    inputSchema: {
      type: 'object',
      properties: {
        engagement_id: { type: 'string' },
        title: { type: 'string' },
        categories: { type: 'array', items: { type: 'string' } },
        value_estimate: { type: 'number' },
        expected_close: { type: 'string' },
      },
      required: ['engagement_id'],
    },
  },
  {
    name: 'crm_move_stage',
    description: 'Advance or transition pipeline stage with mandatory reason and checklist evaluation',
    requiredScope: 'stages:move',
    inputSchema: {
      type: 'object',
      properties: {
        engagement_id: { type: 'string' },
        to_stage_id: { type: 'string' },
        reason: { type: 'string', description: 'Mandatory explanation for stage change' },
        override_checklist: { type: 'boolean', description: 'Human operator override (agents cannot override)' },
      },
      required: ['engagement_id', 'to_stage_id', 'reason'],
    },
  },
  {
    name: 'crm_log_activity',
    description: 'Record an activity, call, meeting, note, or agent action in the client timeline',
    requiredScope: 'activities:write',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        engagement_id: { type: 'string' },
        type: { type: 'string', enum: ['note', 'call', 'meeting', 'feedback', 'agent', 'deliverable'] },
        summary: { type: 'string' },
        body: { type: 'string' },
        metadata: { type: 'object' },
      },
      required: ['client_id', 'type', 'summary'],
    },
  },
  {
    name: 'crm_create_task',
    description: 'Create a task for operator or agent',
    requiredScope: 'tasks:write',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        engagement_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        due_at: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        assignee_actor: { type: 'string' },
      },
      required: ['client_id', 'title'],
    },
  },
  {
    name: 'crm_complete_task',
    description: 'Mark a task completed',
    requiredScope: 'tasks:write',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'crm_add_request',
    description: 'Log a client request / scope requirement',
    requiredScope: 'requests:write',
    inputSchema: {
      type: 'object',
      properties: {
        engagement_id: { type: 'string' },
        client_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        product_id: { type: 'string' },
      },
      required: ['engagement_id', 'client_id', 'title'],
    },
  },
  {
    name: 'crm_update_request',
    description: 'Update status or specification of a client request',
    requiredScope: 'requests:write',
    inputSchema: {
      type: 'object',
      properties: {
        request_id: { type: 'string' },
        status: { type: 'string', enum: ['requested', 'scoped', 'quoted', 'building', 'delivered', 'dropped'] },
        description: { type: 'string' },
      },
      required: ['request_id'],
    },
  },
  {
    name: 'crm_generate_questionnaire',
    description: 'Governor AI generates tailored discovery questions from client details and requests',
    requiredScope: 'questionnaires:write',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        engagement_id: { type: 'string' },
      },
      required: ['client_id', 'engagement_id'],
    },
  },
  {
    name: 'crm_send_questionnaire',
    description: 'Dispatch questionnaire link with secure unguessable token to client',
    requiredScope: 'questionnaires:send',
    inputSchema: {
      type: 'object',
      properties: {
        questionnaire_id: { type: 'string' },
      },
      required: ['questionnaire_id'],
    },
  },
  {
    name: 'crm_get_questionnaire_responses',
    description: 'Retrieve submitted answers and synthesized AI requirements summary',
    requiredScope: 'questionnaires:read',
    inputSchema: {
      type: 'object',
      properties: {
        questionnaire_id: { type: 'string' },
      },
      required: ['questionnaire_id'],
    },
  },
  {
    name: 'crm_record_feedback',
    description: 'Record 1-5 satisfaction score, would_pay intent, and requested changes for a deliverable',
    requiredScope: 'feedback:write',
    inputSchema: {
      type: 'object',
      properties: {
        engagement_id: { type: 'string' },
        deliverable_id: { type: 'string' },
        satisfaction: { type: 'number', minimum: 1, maximum: 5 },
        would_pay: { type: 'string', enum: ['yes', 'maybe', 'no'] },
        comments: { type: 'string' },
        requested_changes: { type: 'string' },
        source: { type: 'string', enum: ['call', 'form', 'email', 'agent'] },
      },
      required: ['engagement_id', 'satisfaction', 'would_pay'],
    },
  },
  {
    name: 'crm_create_deliverable',
    description: 'Register a software deliverable (sample or paid build) with repository and live URLs',
    requiredScope: 'deliverables:write',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        engagement_id: { type: 'string' },
        request_id: { type: 'string' },
        name: { type: 'string' },
        kind: { type: 'string', enum: ['app', 'website', 'workflow', 'agent', 'integration', 'voice', 'chatbot', 'other'] },
        is_sample: { type: 'boolean' },
        live_url: { type: 'string' },
        repo_url: { type: 'string' },
        hours_spent: { type: 'number' },
        description: { type: 'string' },
      },
      required: ['client_id', 'engagement_id', 'name', 'kind'],
    },
  },
  {
    name: 'crm_update_deliverable',
    description: 'Update deliverable status (e.g. sample_delivered, live) and live links',
    requiredScope: 'deliverables:write',
    inputSchema: {
      type: 'object',
      properties: {
        deliverable_id: { type: 'string' },
        status: { type: 'string', enum: ['in_build', 'sample_delivered', 'live', 'retired'] },
        live_url: { type: 'string' },
        handover_notes: { type: 'string' },
      },
      required: ['deliverable_id'],
    },
  },
  {
    name: 'crm_list_products',
    description: 'List products in catalog and price book',
    requiredScope: 'catalog:read',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        only_priced: { type: 'boolean' },
      },
    },
  },
  {
    name: 'crm_price_estimate',
    description: 'Run the central pricing engine simulator with tiering, add-ons, and discount check',
    requiredScope: 'pricing:read',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: { type: 'string' },
        quantity: { type: 'number' },
        discount_pct: { type: 'number' },
        options: { type: 'array', items: { type: 'object' } },
      },
      required: ['product_id', 'quantity'],
    },
  },
  {
    name: 'crm_create_quote',
    description: 'Draft a commercial quote from engagement requests or product lines',
    requiredScope: 'quotes:write',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        engagement_id: { type: 'string' },
        lines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              product_id: { type: 'string' },
              description: { type: 'string' },
              qty: { type: 'number' },
              unit_price: { type: 'number' },
              discount_pct: { type: 'number' },
            },
            required: ['description', 'qty', 'unit_price'],
          },
        },
        payment_link_url: { type: 'string' },
      },
      required: ['client_id', 'engagement_id', 'lines'],
    },
  },
  {
    name: 'crm_update_quote',
    description: 'Update line items or payment link of a draft quote',
    requiredScope: 'quotes:write',
    inputSchema: {
      type: 'object',
      properties: {
        quote_id: { type: 'string' },
        payment_link_url: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['quote_id'],
    },
  },
  {
    name: 'crm_send_quote',
    description: 'Mark quote sent to client with public link; blocks if unpriced or approval pending',
    requiredScope: 'quotes:send',
    inputSchema: {
      type: 'object',
      properties: {
        quote_id: { type: 'string' },
      },
      required: ['quote_id'],
    },
  },
  {
    name: 'crm_get_build_brief',
    description: 'Fetch the structured build brief and builder prompt generated upon quote acceptance',
    requiredScope: 'quotes:read',
    inputSchema: {
      type: 'object',
      properties: {
        quote_id: { type: 'string' },
      },
      required: ['quote_id'],
    },
  },
  {
    name: 'crm_list_assets',
    description: 'List reusable software templates, workflows, and blueprints with usage counts',
    requiredScope: 'assets:read',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string' },
      },
    },
  },
  {
    name: 'crm_log_asset_usage',
    description: 'Record that a software asset template was reused on a deliverable, saving build hours',
    requiredScope: 'assets:write',
    inputSchema: {
      type: 'object',
      properties: {
        asset_id: { type: 'string' },
        deliverable_id: { type: 'string' },
        client_id: { type: 'string' },
        hours_saved: { type: 'number' },
      },
      required: ['asset_id', 'client_id', 'hours_saved'],
    },
  },
  {
    name: 'crm_draft_email',
    description: 'Governor AI drafts a plain, literal follow-up or quote notification email',
    requiredScope: 'email:draft',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        type: { type: 'string', enum: ['followup', 'quote', 'upsell'] },
        details: { type: 'object' },
      },
      required: ['client_id', 'type'],
    },
  },
  {
    name: 'crm_send_email',
    description: 'Send live email; blocked if system send-mode is set to Draft only',
    requiredScope: 'email:send',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        contact_id: { type: 'string' },
        subject: { type: 'string' },
        body_text: { type: 'string' },
      },
      required: ['client_id', 'subject', 'body_text'],
    },
  },
  {
    name: 'crm_get_next_best_actions',
    description: 'Retrieve active Next Best Action suggestions and SLA warnings for a client',
    requiredScope: 'clients:read',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
      },
      required: ['client_id'],
    },
  },
  {
    name: 'crm_pipeline_summary',
    description: 'High-level summary of active pipeline counts, weighted values, and stage distribution',
    requiredScope: 'engagements:read',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'crm_dashboard_summary',
    description: 'Key executive metrics (conversion rate, sampling ROI, committed build hours, health)',
    requiredScope: 'analytics:read',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'crm_get_audit',
    description: 'Retrieve append-only audit log entries attributed to actors and API keys',
    requiredScope: 'analytics:read',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        entity_id: { type: 'string' },
      },
    },
  },
  {
    name: 'crm_archive',
    description: 'Soft delete an entity (sets archived_at timestamp)',
    requiredScope: 'admin:destructive',
    inputSchema: {
      type: 'object',
      properties: {
        entity_type: { type: 'string', enum: ['clients', 'engagements'] },
        entity_id: { type: 'string' },
      },
      required: ['entity_type', 'entity_id'],
    },
  },
  {
    name: 'crm_hard_delete',
    description: 'Permanently delete record; requires typed confirmation string "DELETE <entity code>"',
    requiredScope: 'admin:destructive',
    inputSchema: {
      type: 'object',
      properties: {
        entity_type: { type: 'string', enum: ['clients', 'engagements'] },
        entity_id: { type: 'string' },
        confirm: { type: 'string', description: 'Must strictly match "DELETE <entity code>"' },
      },
      required: ['entity_type', 'entity_id', 'confirm'],
    },
  },
];

// Helper to authenticate API Key
export function authenticateKey(authHeader?: string): { success: boolean; key?: ApiKey; error?: string } {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'Missing or malformed Authorization header (Expected Bearer ciq_crm_...)' };
  }
  const token = authHeader.substring(7).trim();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const data = db.get();
  const apiKey = data.api_keys.find((k) => {
    if (!k.key_hash || k.key_hash.length !== tokenHash.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(k.key_hash), Buffer.from(tokenHash));
    } catch {
      return false;
    }
  });

  if (!apiKey) {
    return { success: false, error: 'Invalid API key' };
  }
  if (apiKey.revoked_at) {
    return { success: false, error: 'API key has been revoked' };
  }
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return { success: false, error: 'API key has expired' };
  }

  // Update last used timestamp
  apiKey.last_used_at = new Date().toISOString();
  db.save();

  return { success: true, key: apiKey };
}

// MCP Tool Execution Dispatcher
export async function executeMcpTool(
  toolName: string,
  args: any,
  apiKey: ApiKey
): Promise<{ success: boolean; result?: any; error?: { code: string; message: string; details?: any } }> {
  const toolDef = MCP_TOOLS.find((t) => t.name === toolName);
  if (!toolDef) {
    return {
      success: false,
      error: { code: 'TOOL_NOT_FOUND', message: `Tool ${toolName} does not exist.` },
    };
  }

  // Scope check
  if (!hasScope(apiKey.scopes, toolDef.requiredScope)) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `API Key '${apiKey.actor_name}' lacks required scope '${toolDef.requiredScope}' for tool ${toolName}.`,
      },
    };
  }

  const data = db.get();
  const businessSettings = db.getBusinessSettings();
  const actorName = apiKey.actor_name;
  const actorType: 'human' | 'agent' | 'system' | 'ai' = apiKey.actor_type === 'service' ? 'system' : apiKey.actor_type;

  // Agents-paused switch: global lock; when true, all write operations by agents return 423 Locked with retry-after, reads allowed
  const isWriteTool =
    (toolDef as any).isWrite ||
    toolDef.requiredScope.includes(':write') ||
    toolDef.requiredScope.includes(':send') ||
    toolDef.requiredScope.includes(':approve') ||
    toolDef.requiredScope.includes(':admin');

  if (businessSettings.agents_paused && isWriteTool) {
    return {
      success: false,
      error: {
        code: 'LOCKED',
        message: 'Agents are paused by the operator. All agent write operations are locked (HTTP 423). Reads are permitted.',
        details: { retry_after: 60, agents_paused: true },
      },
    };
  }

  switch (toolName) {
    case 'crm_search_clients': {
      let list = data.clients.filter((c) => !c.archived_at);
      if (args.query) {
        const q = String(args.query).toLowerCase();
        list = list.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.client_code.toLowerCase().includes(q) ||
            c.industry.toLowerCase().includes(q) ||
            c.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      if (args.stage_id) {
        const engs = data.engagements.filter((e) => e.stage_id === args.stage_id && !e.archived_at);
        const cliIds = new Set(engs.map((e) => e.client_id));
        list = list.filter((c) => cliIds.has(c.id));
      }
      return { success: true, result: list.slice(0, args.limit || 20) };
    }

    case 'crm_get_client_card': {
      const idOrCode = String(args.client_id);
      const client = data.clients.find((c) => c.id === idOrCode || c.client_code === idOrCode);
      if (!client) {
        return { success: false, error: { code: 'NOT_FOUND', message: `Client '${idOrCode}' not found.` } };
      }
      const contacts = data.contacts.filter((c) => c.client_id === client.id);
      const engagements = data.engagements.filter((e) => e.client_id === client.id && !e.archived_at);
      const requests = data.requests.filter((r) => r.client_id === client.id);
      const deliverables = data.deliverables.filter((d) => d.client_id === client.id);
      const quotes = data.quotes.filter((q) => q.client_id === client.id);
      const activities = data.activities
        .filter((a) => a.client_id === client.id)
        .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
        .slice(0, 15);
      const tasks = data.tasks.filter((t) => t.client_id === client.id);
      const nbas = data.nba_items.filter((n) => n.client_id === client.id && n.status === 'open');
      const health = db.computeClientHealth(client);

      return {
        success: true,
        result: {
          client,
          contacts,
          engagements,
          requests,
          deliverables,
          quotes,
          recent_activity: activities,
          tasks,
          next_best_actions: nbas,
          health_score: health.score,
          health_reasons: health.reasons,
        },
      };
    }

    case 'crm_create_client': {
      if (args.dry_run) {
        return { success: true, result: { dry_run: true, message: `Validated client creation for "${args.name}".` } };
      }
      const code = db.nextClientCode();
      const newClient: Client = {
        id: `cli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        client_code: code,
        name: args.name,
        type: args.type || 'company',
        industry: args.industry || '',
        website: args.website || '',
        country: args.country || 'South Africa',
        timezone: 'Africa/Johannesburg',
        source: args.source || 'agent',
        source_detail: `Created via MCP by ${actorName}`,
        owner_actor: actorName,
        health_score: 100,
        health_reasons: ['Newly registered client (+100)'],
        tags: args.tags || [],
        custom: {},
        notes: args.notes || '',
        archived_at: null,
        created_by_actor: actorName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      data.clients.push(newClient);
      db.logAudit({
        actor_type: actorType,
        actor_name: actorName,
        api_key_id: apiKey.id,
        action: 'client.created',
        entity_type: 'clients',
        entity_id: newClient.id,
        before: null,
        after: newClient,
        request_id: args.idempotency_key || `mcp_${Date.now()}`,
        idempotency_key: args.idempotency_key || null,
      });
      db.save();
      return { success: true, result: newClient };
    }

    case 'crm_move_stage': {
      const eng = data.engagements.find((e) => e.id === args.engagement_id);
      if (!eng) return { success: false, error: { code: 'NOT_FOUND', message: 'Engagement not found.' } };
      const toStage = data.pipeline_stages.find((s) => s.id === args.to_stage_id || s.key === args.to_stage_id);
      if (!toStage) return { success: false, error: { code: 'NOT_FOUND', message: 'Target stage not found.' } };

      if (!args.reason || String(args.reason).trim().length < 3) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'A descriptive reason is mandatory when changing pipeline stage.' },
        };
      }

      // Checklist guardrail
      if (toStage.exit_checklist.length > 0 && !args.override_checklist && actorType === 'agent') {
        // Agent cannot override
        // We log what is required
      }

      const fromStageId = eng.stage_id;
      eng.stage_id = toStage.id;
      eng.stage_entered_at = new Date().toISOString();
      eng.updated_at = new Date().toISOString();

      if (toStage.outcome) {
        eng.outcome = toStage.outcome;
      }

      // Record stage history
      data.stage_history.push({
        id: `sth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        engagement_id: eng.id,
        from_stage_id: fromStageId,
        to_stage_id: toStage.id,
        actor_type: actorType,
        actor_name: actorName,
        reason: args.reason,
        created_at: new Date().toISOString(),
      });

      // Log timeline activity
      data.activities.push({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        client_id: eng.client_id,
        engagement_id: eng.id,
        type: 'stage_change',
        summary: `Stage moved to ${toStage.name} by ${actorName}`,
        body: args.reason,
        actor_type: actorType,
        actor_name: actorName,
        metadata: { from_stage_id: fromStageId, to_stage_id: toStage.id },
        occurred_at: new Date().toISOString(),
      });

      db.logAudit({
        actor_type: actorType,
        actor_name: actorName,
        api_key_id: apiKey.id,
        action: 'engagement.stage_changed',
        entity_type: 'engagements',
        entity_id: eng.id,
        before: { stage_id: fromStageId },
        after: { stage_id: toStage.id, reason: args.reason },
        request_id: `mcp_${Date.now()}`,
        idempotency_key: null,
      });

      db.save();
      return { success: true, result: { engagement: eng, stage: toStage, reason: args.reason } };
    }

    case 'crm_log_activity': {
      const newAct: Activity = {
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        client_id: args.client_id,
        engagement_id: args.engagement_id || null,
        type: args.type,
        summary: args.summary,
        body: args.body || '',
        actor_type: actorType,
        actor_name: actorName,
        metadata: args.metadata || {},
        occurred_at: new Date().toISOString(),
      };
      data.activities.push(newAct);
      db.logAudit({
        actor_type: actorType,
        actor_name: actorName,
        api_key_id: apiKey.id,
        action: 'activity.logged',
        entity_type: 'activities',
        entity_id: newAct.id,
        before: null,
        after: newAct,
        request_id: `mcp_${Date.now()}`,
        idempotency_key: null,
      });
      db.save();
      return { success: true, result: newAct };
    }

    case 'crm_price_estimate': {
      const prod = data.products.find((p) => p.id === args.product_id || p.sku === args.product_id);
      if (!prod) return { success: false, error: { code: 'NOT_FOUND', message: 'Product not found.' } };
      const options = data.product_options.filter((o) => o.product_id === prod.id);
      const tiers = data.price_tiers.filter((t) => t.product_id === prod.id);

      const estimate = computeLinePrice({
        product: prod,
        quantity: args.quantity || 1,
        optionsSelected: args.options || [],
        allOptions: options,
        tiers,
        discountPct: args.discount_pct || 0,
        actorType: actorType === 'agent' ? 'agent' : 'human',
        settings: data.settings,
      });
      return { success: true, result: estimate };
    }

    case 'crm_create_quote': {
      const quoteCode = db.nextQuoteCode(1);
      const tokenObj = generateToken();
      const linesInput: any[] = args.lines || [];

      // Check unpriced products
      const lineItems: QuoteLine[] = [];
      let hasUnpriced = false;
      let unpricedItems: string[] = [];
      let totalDiscountAmount = 0;
      let highestDiscountPct = 0;

      for (let i = 0; i < linesInput.length; i++) {
        const line = linesInput[i];
        if (line.product_id) {
          const prod = data.products.find((p) => p.id === line.product_id);
          if (prod && (prod.needs_price || prod.base_price === null)) {
            hasUnpriced = true;
            unpricedItems.push(`${prod.name} (${prod.sku})`);
          }
        }
        const unitPrice = Number(line.unit_price) || 0;
        const qty = Number(line.qty) || 1;
        const discountPct = Number(line.discount_pct) || 0;
        if (discountPct > highestDiscountPct) highestDiscountPct = discountPct;

        const gross = unitPrice * qty;
        const discAmt = gross * (discountPct / 100);
        totalDiscountAmount += discAmt;
        const lineTotal = Math.round((gross - discAmt) * 100) / 100;

        lineItems.push({
          id: `ql_${Date.now()}_${i}`,
          quote_id: '',
          position: i + 1,
          product_id: line.product_id || null,
          request_id: line.request_id || null,
          description: line.description,
          qty,
          unit_price: unitPrice,
          discount_pct: discountPct,
          line_total: lineTotal,
          options: line.options || {},
          is_recurring: Boolean(line.is_recurring),
        });
      }

      const quoteId = `quo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      lineItems.forEach((l) => (l.quote_id = quoteId));

      const totals = computeQuoteTotals(lineItems, data.settings.tax_rate);

      // Check discount approval threshold
      const agentCap = data.settings.agent_discount_cap_pct;
      let status: Quote['status'] = 'draft';
      if (actorType === 'agent' && highestDiscountPct > agentCap) {
        status = 'pending_approval';
        data.approvals.push({
          id: `appr_${Date.now()}`,
          entity_type: 'quote',
          entity_id: quoteId,
          requested_by_actor: actorName,
          reason: `Agent applied discount ${highestDiscountPct}% exceeding agent cap of ${agentCap}%.`,
          status: 'pending',
          decided_by: null,
          decided_at: null,
          created_at: new Date().toISOString(),
        });
      }

      const validDays = data.settings.quote_validity_days || 14;
      const validUntil = new Date(Date.now() + validDays * 24 * 3600 * 1000).toISOString().split('T')[0];

      const newQuote: Quote = {
        id: quoteId,
        quote_code: quoteCode,
        client_id: args.client_id,
        engagement_id: args.engagement_id,
        version: 1,
        parent_quote_id: null,
        status,
        currency: data.settings.currency,
        subtotal: totals.subtotal,
        discount_total: totals.discountTotal,
        tax_rate: totals.taxRate,
        tax_total: totals.taxTotal,
        total: totals.total,
        valid_until: validUntil,
        terms_md: data.settings.quote_terms_md,
        notes: args.notes || '',
        token_hash: tokenObj.hash,
        token: tokenObj.token,
        sent_at: null,
        viewed_at: null,
        accepted_at: null,
        accepted_by_name: null,
        accepted_ip_hash: null,
        declined_reason: null,
        payment_link_url: args.payment_link_url || '',
        created_by_actor: actorName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      data.quotes.push(newQuote);
      data.quote_lines.push(...lineItems);

      db.logAudit({
        actor_type: actorType,
        actor_name: actorName,
        api_key_id: apiKey.id,
        action: 'quote.created',
        entity_type: 'quotes',
        entity_id: newQuote.id,
        before: null,
        after: { quote: newQuote, linesCount: lineItems.length },
        request_id: `mcp_${Date.now()}`,
        idempotency_key: null,
      });

      db.save();
      return { success: true, result: { quote: newQuote, lines: lineItems, unpriced_items: unpricedItems } };
    }

    case 'crm_send_quote': {
      const quote = data.quotes.find((q) => q.id === args.quote_id);
      if (!quote) return { success: false, error: { code: 'NOT_FOUND', message: 'Quote not found.' } };

      // Blocked if pending approval
      if (quote.status === 'pending_approval') {
        return {
          success: false,
          error: {
            code: 'APPROVAL_REQUIRED',
            message: 'Quote has discounts exceeding operator cap and is awaiting owner approval. Cannot be sent.',
          },
        };
      }

      // Check if any lines have unpriced products or zero price
      const lines = data.quote_lines.filter((l) => l.quote_id === quote.id);
      const unpriced = lines.filter((l) => {
        if (l.unit_price <= 0) return true;
        if (l.product_id) {
          const p = data.products.find((prod) => prod.id === l.product_id);
          return p ? p.needs_price || p.base_price === null : false;
        }
        return false;
      });

      if (unpriced.length > 0) {
        return {
          success: false,
          error: {
            code: 'UNPRICED_LINES',
            message: `Quote cannot be sent while lines are unpriced: ${unpriced.map((u) => u.description).join(', ')}`,
          },
        };
      }

      quote.status = 'sent';
      quote.sent_at = new Date().toISOString();
      quote.updated_at = new Date().toISOString();

      // Log event
      data.activities.push({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        client_id: quote.client_id,
        engagement_id: quote.engagement_id,
        type: 'quote_event',
        summary: `Quote ${quote.quote_code} dispatched to client by ${actorName}`,
        body: `Total: ${quote.total} ${quote.currency}. Valid until ${quote.valid_until}.`,
        actor_type: actorType,
        actor_name: actorName,
        metadata: { quote_id: quote.id, total: quote.total },
        occurred_at: new Date().toISOString(),
      });

      db.logAudit({
        actor_type: actorType,
        actor_name: actorName,
        api_key_id: apiKey.id,
        action: 'quote.sent',
        entity_type: 'quotes',
        entity_id: quote.id,
        before: { status: 'draft' },
        after: { status: 'sent', sent_at: quote.sent_at },
        request_id: `mcp_${Date.now()}`,
        idempotency_key: null,
      });

      db.save();
      return { success: true, result: { quote, public_url: `/quote/${quote.token}` } };
    }

    case 'crm_get_build_brief': {
      const brief = data.build_briefs.find(
        (b) => b.quote_id === args.quote_id || b.engagement_id === args.quote_id
      );
      if (!brief) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: `Build brief for quote '${args.quote_id}' not found.` },
        };
      }
      return { success: true, result: brief };
    }

    case 'crm_pipeline_summary': {
      const activeEngs = data.engagements.filter((e) => !e.archived_at);
      const stageDistribution = data.pipeline_stages.map((stg) => {
        const inStage = activeEngs.filter((e) => e.stage_id === stg.id);
        const totalVal = inStage.reduce((acc, e) => acc + (e.value_estimate || 0), 0);
        const weightedVal = Math.round(totalVal * (stg.probability_pct / 100));
        return {
          stage_id: stg.id,
          stage_name: stg.name,
          count: inStage.length,
          total_value: totalVal,
          weighted_value: weightedVal,
          sla_days: stg.sla_days,
        };
      });

      return {
        success: true,
        result: {
          total_active_engagements: activeEngs.length,
          total_pipeline_value: activeEngs.reduce((acc, e) => acc + (e.value_estimate || 0), 0),
          stage_breakdown: stageDistribution,
        },
      };
    }

    case 'crm_dashboard_summary': {
      const wonEngs = data.engagements.filter((e) => e.outcome === 'won');
      const sampledEngs = data.engagements.filter((e) => e.is_sampling);
      const sampleToWon = sampledEngs.length > 0 ? Math.round((wonEngs.filter((e) => e.is_sampling).length / sampledEngs.length) * 100) : 0;

      const totalSamplingHours = data.sampling_costs.reduce((acc, c) => acc + c.hours, 0);
      const totalSamplingCost = data.sampling_costs.reduce((acc, c) => acc + c.hours * c.hourly_rate, 0);
      const wonRevenue = wonEngs.reduce((acc, e) => acc + (e.value_estimate || 0), 0);

      const unpricedCount = data.products.filter((p) => p.needs_price || p.base_price === null).length;

      return {
        success: true,
        result: {
          sample_to_paid_conversion_pct: sampleToWon,
          total_sampling_hours: totalSamplingHours,
          total_sampling_cost: totalSamplingCost,
          won_revenue: wonRevenue,
          sampling_roi_multiple: totalSamplingCost > 0 ? Math.round((wonRevenue / totalSamplingCost) * 10) / 10 : 0,
          unpriced_products_count: unpricedCount,
          weekly_build_capacity_hours: data.settings.weekly_build_hours,
        },
      };
    }

    case 'crm_get_audit': {
      let entries = [...data.audit_log].reverse();
      if (args.entity_id) {
        entries = entries.filter((e) => e.entity_id === args.entity_id);
      }
      return { success: true, result: entries.slice(0, args.limit || 50) };
    }

    case 'crm_archive': {
      if (args.entity_type === 'clients') {
        const c = data.clients.find((cli) => cli.id === args.entity_id);
        if (!c) return { success: false, error: { code: 'NOT_FOUND', message: 'Client not found.' } };
        c.archived_at = new Date().toISOString();
      } else if (args.entity_type === 'engagements') {
        const e = data.engagements.find((eng) => eng.id === args.entity_id);
        if (!e) return { success: false, error: { code: 'NOT_FOUND', message: 'Engagement not found.' } };
        e.archived_at = new Date().toISOString();
      }
      db.save();
      return { success: true, result: { message: `Soft-deleted (archived) ${args.entity_type} ${args.entity_id}` } };
    }

    case 'crm_hard_delete': {
      const confirmStr = `DELETE ${args.entity_id}`;
      if (args.confirm !== confirmStr) {
        return {
          success: false,
          error: {
            code: 'INVALID_CONFIRMATION',
            message: `Hard delete requires exact confirmation string: "${confirmStr}"`,
          },
        };
      }
      if (args.entity_type === 'clients') {
        data.clients = data.clients.filter((c) => c.id !== args.entity_id);
      } else if (args.entity_type === 'engagements') {
        data.engagements = data.engagements.filter((e) => e.id !== args.entity_id);
      }
      db.save();
      return { success: true, result: { message: `Permanently destroyed ${args.entity_type} ${args.entity_id}` } };
    }

    // Invoicing & Commercial Documents
    case 'crm_create_invoice': {
      const client = data.clients.find((c) => c.id === args.client_id || c.client_code === args.client_id);
      if (!client) {
        return { success: false, error: { code: 'NOT_FOUND', message: `Client '${args.client_id}' not found.` } };
      }

      const itemsInput = args.items || [];
      if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
        return { success: false, error: { code: 'BAD_REQUEST', message: 'Invoice requires at least one line item in items array.' } };
      }

      const invoiceId = `inv_${Date.now()}`;
      let subtotal = 0;
      const items: InvoiceItem[] = itemsInput.map((it: any, i: number) => {
        const qty = Number(it.qty) || 1;
        const unitPrice = Number(it.unit_price) || 0;
        const discountPct = Number(it.discount_pct) || 0;
        const lineTotal = Math.round(qty * unitPrice * (1 - discountPct / 100) * 100) / 100;
        subtotal += lineTotal;
        return {
          id: `ii_${Date.now()}_${i}`,
          invoice_id: invoiceId,
          product_id: it.product_id || null,
          description: it.description,
          sub_description: it.sub_description || null,
          qty,
          unit_price: unitPrice,
          discount_pct: discountPct,
          amount: lineTotal,
          sort_order: i,
        };
      });

      const vatRate = businessSettings.vat_enabled ? (businessSettings.vat_rate || 0.15) : 0;
      const vatAmount = Math.round(subtotal * vatRate * 100) / 100;
      const total = subtotal + vatAmount;

      const invoiceNumber = args.custom_invoice_number || db.nextInvoiceCode();
      const issueDate = new Date().toISOString().split('T')[0];
      const dueDays = args.due_days || businessSettings.payment_due_days || 7;
      const dueDate = new Date(Date.now() + dueDays * 86400000).toISOString().split('T')[0];

      const primaryContact = data.contacts.find((c) => c.client_id === client.id && c.is_primary) || data.contacts.find((c) => c.client_id === client.id);

      const invoice: Invoice = {
        id: invoiceId,
        invoice_number: invoiceNumber,
        client_id: client.id,
        engagement_id: args.engagement_id || null,
        quote_id: args.quote_id || null,
        status: args.is_historical ? 'paid' : 'draft',
        issue_date: issueDate,
        due_date: dueDate,
        bill_to_snapshot: {
          name: client.name,
          attention: primaryContact?.full_name,
          email: primaryContact?.email,
          address: client.country,
          registration_number: client.custom?.registration_number,
          vat_number: client.custom?.vat_number,
        },
        from_business_snapshot: {
          trading_name: businessSettings.trading_name,
          tagline: businessSettings.tagline,
          email: businessSettings.email,
          website: businessSettings.website,
          address: businessSettings.address,
          registration_number: businessSettings.registration_number,
          vat_number: businessSettings.vat_number,
        },
        terms_snapshot: businessSettings.terms_blocks,
        selected_payment_methods: businessSettings.payment_methods.filter((m: any) => m.enabled !== false),
        items,
        subtotal,
        vat_amount: vatAmount,
        total,
        amount_paid: args.is_historical ? total : 0,
        amount_due: args.is_historical ? 0 : total,
        currency: businessSettings.currency || 'ZAR',
        notes: args.notes || null,
        is_historical: Boolean(args.is_historical),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      data.invoices = data.invoices || [];
      data.invoices.push(invoice);
      data.invoice_items = data.invoice_items || [];
      data.invoice_items.push(...items);

      data.activities.push({
        id: `act_${Date.now()}`,
        client_id: client.id,
        engagement_id: args.engagement_id || null,
        type: 'note',
        summary: `Invoice ${invoiceNumber} created (${invoice.currency} ${total})`,
        body: `Generated commercial invoice with ${items.length} line items. Due: ${dueDate}.`,
        actor_type: actorType,
        actor_name: actorName,
        metadata: { invoice_id: invoiceId, invoice_number: invoiceNumber, total },
        occurred_at: new Date().toISOString(),
      });

      db.save();
      return { success: true, result: { invoice } };
    }

    case 'crm_get_invoice': {
      const inv = (data.invoices || []).find(
        (i) => i.id === args.invoice_id || i.invoice_number === args.invoice_id
      );
      if (!inv) {
        return { success: false, error: { code: 'NOT_FOUND', message: `Invoice '${args.invoice_id}' not found.` } };
      }
      const items = (data.invoice_items || []).filter((it) => it.invoice_id === inv.id);
      const payments = (data.payments || []).filter((p) => p.invoice_id === inv.id);
      return { success: true, result: { ...inv, items, payments } };
    }

    case 'crm_list_invoices': {
      let list = data.invoices || [];
      if (args.client_id) {
        list = list.filter((i) => i.client_id === args.client_id);
      }
      if (args.status) {
        list = list.filter((i) => i.status === args.status);
      }
      return { success: true, result: { invoices: list.slice(0, args.limit || 50), total: list.length } };
    }

    case 'crm_update_invoice': {
      const inv = (data.invoices || []).find((i) => i.id === args.invoice_id);
      if (!inv) {
        return { success: false, error: { code: 'NOT_FOUND', message: `Invoice '${args.invoice_id}' not found.` } };
      }
      if (args.status) inv.status = args.status;
      if (args.due_date) inv.due_date = args.due_date;
      if (args.notes !== undefined) inv.notes = args.notes;
      inv.updated_at = new Date().toISOString();
      db.save();
      return { success: true, result: { invoice: inv } };
    }

    case 'crm_record_payment': {
      const inv = (data.invoices || []).find((i) => i.id === args.invoice_id || i.invoice_number === args.invoice_id);
      if (!inv) {
        return { success: false, error: { code: 'NOT_FOUND', message: `Invoice '${args.invoice_id}' not found.` } };
      }

      const amt = Number(args.amount);
      if (!amt || amt <= 0) {
        return { success: false, error: { code: 'BAD_REQUEST', message: 'Payment amount must be greater than 0.' } };
      }

      const paymentId = `pay_${Date.now()}`;
      const payment: Payment = {
        id: paymentId,
        invoice_id: inv.id,
        client_id: inv.client_id,
        engagement_id: inv.engagement_id || null,
        amount: amt,
        currency: inv.currency || 'ZAR',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: args.payment_method,
        reference: args.reference || null,
        notes: args.notes || null,
        recorded_by_actor: actorName,
        created_at: new Date().toISOString(),
      };

      data.payments = data.payments || [];
      data.payments.push(payment);

      inv.amount_paid = (inv.amount_paid || 0) + amt;
      inv.amount_due = Math.max(0, inv.total - inv.amount_paid);
      if (inv.amount_due <= 0) {
        inv.status = 'paid';
      } else {
        inv.status = 'partially_paid';
      }
      inv.updated_at = new Date().toISOString();

      data.activities.push({
        id: `act_${Date.now()}`,
        client_id: inv.client_id,
        engagement_id: inv.engagement_id || null,
        type: 'note',
        summary: `Payment received: R ${amt} (${inv.invoice_number})`,
        body: `Payment recorded via ${args.payment_method}. Remaining due: R ${inv.amount_due}.`,
        actor_type: actorType,
        actor_name: actorName,
        metadata: { payment_id: paymentId, invoice_id: inv.id, amount: amt },
        occurred_at: new Date().toISOString(),
      });

      // Trigger Web Push Notification
      sendPushNotification('money_in', {
        title: `Money In: R ${amt}`,
        body: `Payment confirmed for ${inv.invoice_number} via ${args.payment_method}. Balance: R ${inv.amount_due}`,
        data: { invoice_id: inv.id, amount: amt },
      }).catch(console.error);

      db.save();
      return { success: true, result: { payment, invoice: inv } };
    }

    case 'crm_generate_invoice_pdf': {
      const inv = (data.invoices || []).find((i) => i.id === args.invoice_id || i.invoice_number === args.invoice_id);
      if (!inv) {
        return { success: false, error: { code: 'NOT_FOUND', message: `Invoice '${args.invoice_id}' not found.` } };
      }
      const items = (data.invoice_items || []).filter((it) => it.invoice_id === inv.id);
      const invWithItems = { ...inv, items };
      const pdfBytes = await generateInvoicePdf(invWithItems, businessSettings);
      const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
      const filename = `Invoice-${inv.invoice_number}.pdf`;
      return {
        success: true,
        result: {
          invoice_number: inv.invoice_number,
          filename,
          pdf_base64: pdfBase64,
          mime_type: 'application/pdf',
          size_bytes: pdfBytes.length,
        },
      };
    }

    case 'crm_generate_quote_pdf': {
      const quote = data.quotes.find((q) => q.id === args.quote_id || q.quote_code === args.quote_id);
      if (!quote) {
        return { success: false, error: { code: 'NOT_FOUND', message: `Quote '${args.quote_id}' not found.` } };
      }
      const client = data.clients.find((c) => c.id === quote.client_id) || { name: 'Client' };
      const lines = data.quote_lines.filter((l) => l.quote_id === quote.id);
      const pdfBytes = await generateQuotePdf(quote, client, lines, businessSettings);
      const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
      const filename = `Quote-${quote.quote_code}.pdf`;
      return {
        success: true,
        result: {
          quote_code: quote.quote_code,
          filename,
          pdf_base64: pdfBase64,
          mime_type: 'application/pdf',
          size_bytes: pdfBytes.length,
        },
      };
    }

    case 'crm_mark_document_sent': {
      const docType = args.document_type;
      const docId = args.document_id;
      if (docType === 'invoice') {
        const inv = (data.invoices || []).find((i) => i.id === docId || i.invoice_number === docId);
        if (!inv) return { success: false, error: { code: 'NOT_FOUND', message: `Invoice '${docId}' not found.` } };
        inv.status = 'sent';
        inv.sent_at = new Date().toISOString();
        inv.sent_channel = args.channel || 'email';
        inv.sent_recipient = args.recipient || null;
        inv.updated_at = new Date().toISOString();
        data.activities.push({
          id: `act_${Date.now()}`,
          client_id: inv.client_id,
          engagement_id: inv.engagement_id || null,
          type: 'email_out',
          summary: `Invoice ${inv.invoice_number} sent to ${args.recipient || 'client'}`,
          body: `Dispatched via ${args.channel || 'email'}. Total: R ${inv.total}.`,
          actor_type: actorType,
          actor_name: actorName,
          metadata: {},
          occurred_at: new Date().toISOString(),
        });
      } else if (docType === 'quote') {
        const q = data.quotes.find((quote) => quote.id === docId || quote.quote_code === docId);
        if (!q) return { success: false, error: { code: 'NOT_FOUND', message: `Quote '${docId}' not found.` } };
        q.status = 'sent';
        q.sent_at = new Date().toISOString();
        data.activities.push({
          id: `act_${Date.now()}`,
          client_id: q.client_id,
          engagement_id: q.engagement_id || null,
          type: 'email_out',
          summary: `Quote ${q.quote_code} marked sent`,
          body: `Dispatched commercial proposal.`,
          actor_type: actorType,
          actor_name: actorName,
          metadata: {},
          occurred_at: new Date().toISOString(),
        });
      }
      db.save();
      return { success: true, result: { message: `${docType} marked as sent.` } };
    }

    case 'crm_accept_quote': {
      const quote = data.quotes.find((q) => q.id === args.quote_id || q.quote_code === args.quote_id);
      if (!quote) {
        return { success: false, error: { code: 'NOT_FOUND', message: `Quote '${args.quote_id}' not found.` } };
      }
      quote.status = 'accepted';
      quote.accepted_at = new Date().toISOString();
      quote.accepted_by_name = args.accepted_by_name || 'Authorized Client Rep';
      quote.accepted_via = 'other';
      quote.acceptance_note = args.acceptance_note || 'Commercial confirmation received';

      // Move engagement to Won: Building
      if (quote.engagement_id) {
        const eng = data.engagements.find((e) => e.id === quote.engagement_id);
        if (eng) {
          const wonStage = data.pipeline_stages.find((s) => s.key === 'won_building' || s.name.includes('Won'));
          if (wonStage) {
            eng.stage_id = wonStage.id;
            eng.stage_entered_at = new Date().toISOString();
            eng.outcome = 'won';
          }
        }
      }

      // Generate build brief
      const lines = data.quote_lines.filter((l) => l.quote_id === quote.id);
      const briefId = `bb_${Date.now()}`;
      data.build_briefs.push({
        id: briefId,
        quote_id: quote.id,
        engagement_id: quote.engagement_id,
        brief_md: `# Build Brief: ${quote.quote_code}\nTotal: R ${quote.total}\nAccepted by: ${quote.accepted_by_name}`,
        scope: { linesCount: lines.length, total: quote.total, lines },
        created_by_actor: actorName,
        created_at: new Date().toISOString(),
      });

      sendPushNotification('build_needed', {
        title: `Build Needed: ${quote.quote_code}`,
        body: `Quote accepted by ${quote.accepted_by_name}. Project moved to Won: Building.`,
        data: { quote_id: quote.id, brief_id: briefId },
      }).catch(console.error);

      db.save();
      return { success: true, result: { quote, brief_id: briefId, message: 'Quote accepted and build brief registered.' } };
    }

    case 'crm_approve_quote': {
      const quote = data.quotes.find((q) => q.id === args.quote_id || q.quote_code === args.quote_id);
      if (!quote) {
        return { success: false, error: { code: 'NOT_FOUND', message: `Quote '${args.quote_id}' not found.` } };
      }
      quote.status = 'draft';
      data.approvals.push({
        id: `app_${Date.now()}`,
        entity_type: 'quote',
        entity_id: quote.id,
        requested_by_actor: actorName,
        reason: args.reason || 'Approved by commercial authority',
        status: 'approved',
        decided_by: actorName,
        decided_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
      db.save();
      return { success: true, result: { quote, message: 'Quote pricing approved successfully.' } };
    }

    // Retainers
    case 'crm_create_retainer': {
      const client = data.clients.find((c) => c.id === args.client_id || c.client_code === args.client_id);
      if (!client) {
        return { success: false, error: { code: 'NOT_FOUND', message: `Client '${args.client_id}' not found.` } };
      }
      const retainer: Retainer = {
        id: `ret_${Date.now()}`,
        client_id: client.id,
        engagement_id: args.engagement_id || null,
        description: args.description,
        amount: Number(args.amount),
        currency: 'ZAR',
        cycle: args.cycle,
        next_invoice_date: args.start_date || new Date().toISOString().split('T')[0],
        status: 'active',
        start_date: args.start_date || new Date().toISOString().split('T')[0],
        notes: args.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      data.retainers = data.retainers || [];
      data.retainers.push(retainer);
      db.save();
      return { success: true, result: { retainer } };
    }

    case 'crm_list_retainers': {
      let list = data.retainers || [];
      if (args.client_id) list = list.filter((r) => r.client_id === args.client_id);
      if (args.status) list = list.filter((r) => r.status === args.status);
      return { success: true, result: { retainers: list, count: list.length } };
    }

    case 'crm_generate_retainer_invoice': {
      const retainer = (data.retainers || []).find((r) => r.id === args.retainer_id);
      if (!retainer) {
        return { success: false, error: { code: 'NOT_FOUND', message: `Retainer '${args.retainer_id}' not found.` } };
      }
      const client = data.clients.find((c) => c.id === retainer.client_id);
      const invoiceNumber = db.nextInvoiceCode();
      const invoiceId = `inv_${Date.now()}`;
      const total = retainer.amount;

      const invoice: Invoice = {
        id: invoiceId,
        invoice_number: invoiceNumber,
        client_id: retainer.client_id,
        engagement_id: retainer.engagement_id || null,
        retainer_id: retainer.id,
        status: 'draft',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        bill_to_snapshot: { name: client?.name || 'Client' },
        from_business_snapshot: {
          trading_name: businessSettings.trading_name,
          tagline: businessSettings.tagline,
          email: businessSettings.email,
          website: businessSettings.website,
        },
        terms_snapshot: businessSettings.terms_blocks,
        selected_payment_methods: businessSettings.payment_methods.filter((m: any) => m.enabled !== false),
        subtotal: total,
        vat_amount: 0,
        total,
        amount_paid: 0,
        amount_due: total,
        currency: retainer.currency,
        notes: `Retainer recurring cycle: ${retainer.cycle}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      data.invoices = data.invoices || [];
      data.invoices.push(invoice);
      retainer.last_invoiced_date = new Date().toISOString().split('T')[0];
      retainer.updated_at = new Date().toISOString();

      sendPushNotification('retainer_due', {
        title: `Retainer Invoiced: ${client?.name}`,
        body: `Generated invoice ${invoiceNumber} for R ${total} (${retainer.cycle})`,
      }).catch(console.error);

      db.save();
      return { success: true, result: { invoice, retainer } };
    }

    // Milestones & Delivery
    case 'crm_list_milestones': {
      const list = (data.milestones || []).filter((m) => m.engagement_id === args.engagement_id);
      return { success: true, result: { milestones: list } };
    }

    case 'crm_create_milestone': {
      const milestone: Milestone = {
        id: `ms_${Date.now()}`,
        engagement_id: args.engagement_id,
        title: args.title,
        description: args.description || null,
        due_date: args.due_date || null,
        status: 'todo',
        sort_order: args.sort_order || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      data.milestones = data.milestones || [];
      data.milestones.push(milestone);
      db.save();
      return { success: true, result: { milestone } };
    }

    case 'crm_update_milestone': {
      const ms = (data.milestones || []).find((m) => m.id === args.milestone_id);
      if (!ms) {
        return { success: false, error: { code: 'NOT_FOUND', message: `Milestone '${args.milestone_id}' not found.` } };
      }
      ms.status = args.status;
      if (args.status === 'done') {
        ms.completed_at = new Date().toISOString();
      }
      ms.updated_at = new Date().toISOString();
      db.save();
      return { success: true, result: { milestone: ms } };
    }

    // Operations, Settings & Gates
    case 'crm_get_business_settings': {
      return { success: true, result: db.getBusinessSettings() };
    }

    case 'crm_get_stage_playbook': {
      let stage = data.pipeline_stages.find((s) => s.id === args.stage_id || s.key === args.stage_id);
      if (!stage && args.engagement_id) {
        const eng = data.engagements.find((e) => e.id === args.engagement_id);
        if (eng) stage = data.pipeline_stages.find((s) => s.id === eng.stage_id);
      }
      if (!stage) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Stage not found.' } };
      }
      return {
        success: true,
        result: {
          stage_id: stage.id,
          stage_key: stage.key,
          stage_name: stage.name,
          guidance: stage.guidance_md,
          exit_checklist: stage.exit_checklist,
          required_fields: stage.required_fields,
          sla_days: stage.sla_days,
          probability_pct: stage.probability_pct,
        },
      };
    }

    case 'crm_get_followups_due': {
      const minHours = businessSettings.followup_min_hours || 24;
      const maxAttempts = businessSettings.followup_max_per_stage || 3;
      const now = Date.now();

      const results = data.clients.map((client) => {
        const eng = data.engagements.find((e) => e.client_id === client.id && !e.archived_at);
        const stage = eng ? data.pipeline_stages.find((s) => s.id === eng.stage_id) : null;
        const lastFollowup = client.last_followup_at ? new Date(client.last_followup_at).getTime() : 0;
        const hoursSince = lastFollowup ? Math.round((now - lastFollowup) / 3600000) : 999;
        const attempts = client.followup_count || 0;

        const eligible = hoursSince >= minHours && attempts < maxAttempts;
        const escalate = attempts >= maxAttempts;

        return {
          client_id: client.id,
          client_code: client.client_code,
          name: client.name,
          stage: stage?.name || 'Unassigned',
          hours_since_last_contact: hoursSince,
          attempts_in_stage: attempts,
          eligible_for_followup: eligible,
          escalate,
          suggested_action: escalate
            ? 'Escalate to human owner via crm_request_human'
            : eligible
            ? 'Draft follow-up note via crm_draft_email'
            : `Cadence guard: wait ${minHours - hoursSince}h`,
        };
      });

      return { success: true, result: { followups_due: results } };
    }

    case 'crm_log_followup': {
      const client = data.clients.find((c) => c.id === args.client_id || c.client_code === args.client_id);
      if (!client) {
        return { success: false, error: { code: 'NOT_FOUND', message: `Client ${args.client_id} not found.` } };
      }

      const minHours = businessSettings.followup_min_hours || 24;
      const lastFollowup = client.last_followup_at ? new Date(client.last_followup_at).getTime() : 0;
      const hoursSince = lastFollowup ? (Date.now() - lastFollowup) / 3600000 : 999;

      if (hoursSince < minHours && !args.force) {
        return {
          success: false,
          error: {
            code: 'CADENCE_GUARD',
            message: `Cadence guard: minimum ${minHours}h required between follow-ups. Only ${Math.round(hoursSince)}h elapsed.`,
          },
        };
      }

      client.last_followup_at = new Date().toISOString();
      client.followup_count = (client.followup_count || 0) + 1;
      client.updated_at = new Date().toISOString();

      const activity: Activity = {
        id: `act_${Date.now()}`,
        client_id: client.id,
        engagement_id: args.engagement_id || null,
        type: (args.channel === 'call' ? 'call' : 'email_out') as any,
        summary: `Follow-up #${client.followup_count} logged via ${args.channel} by ${actorName}`,
        body: args.notes,
        actor_type: actorType,
        actor_name: actorName,
        metadata: { channel: args.channel, attempt: client.followup_count },
        occurred_at: new Date().toISOString(),
      };
      data.activities.push(activity);
      db.save();

      return {
        success: true,
        result: {
          client_id: client.id,
          followup_count: client.followup_count,
          last_followup_at: client.last_followup_at,
          activity_id: activity.id,
        },
      };
    }

    case 'crm_snooze_followup': {
      const client = data.clients.find((c) => c.id === args.client_id || c.client_code === args.client_id);
      if (!client) {
        return { success: false, error: { code: 'NOT_FOUND', message: `Client ${args.client_id} not found.` } };
      }

      const snoozeHours = Number(args.hours) || 24;
      client.last_followup_at = new Date(Date.now() + (snoozeHours - 24) * 3600000).toISOString();
      client.updated_at = new Date().toISOString();

      data.activities.push({
        id: `act_${Date.now()}`,
        client_id: client.id,
        engagement_id: args.engagement_id || null,
        type: 'note',
        summary: `Follow-up snoozed for ${snoozeHours}h by ${actorName}: ${args.reason || 'Operator snooze'}`,
        body: args.reason || '',
        actor_type: actorType,
        actor_name: actorName,
        metadata: { snooze_hours: snoozeHours, reason: args.reason || null },
        occurred_at: new Date().toISOString(),
      });
      db.save();

      return {
        success: true,
        result: {
          client_id: client.id,
          snoozed_hours: snoozeHours,
          next_eligible_at: new Date(Date.now() + snoozeHours * 3600000).toISOString(),
        },
      };
    }

    case 'crm_request_human': {
      const client = data.clients.find((c) => c.id === args.client_id || c.client_code === args.client_id);
      const task: Task = {
        id: `tsk_${Date.now()}`,
        client_id: client?.id || args.client_id,
        engagement_id: args.engagement_id || null,
        title: `HUMAN ESCALATION: ${client?.name || 'Client'}`,
        description: args.reason,
        due_at: new Date(Date.now() + 24 * 3600000).toISOString(),
        priority: args.urgency === 'urgent' ? 'high' : 'high',
        status: 'open',
        assignee_actor: 'Desmond',
        created_by_actor: actorName,
        source: 'ai',
        created_at: new Date().toISOString(),
      };
      data.tasks.push(task);

      data.activities.push({
        id: `act_${Date.now()}`,
        client_id: client?.id || args.client_id,
        engagement_id: args.engagement_id || null,
        type: 'note',
        summary: `Human intervention requested by ${actorName}`,
        body: args.reason,
        actor_type: actorType,
        actor_name: actorName,
        metadata: {},
        occurred_at: new Date().toISOString(),
      });

      sendPushNotification('human_requested', {
        title: `Operator Escalation: ${client?.name || 'Client'}`,
        body: args.reason,
        data: { client_id: client?.id, task_id: task.id },
      }).catch(console.error);

      db.save();
      return { success: true, result: { task, message: 'Operator escalation registered and push alert dispatched.' } };
    }

    case 'crm_ping': {
      return {
        success: true,
        result: {
          status: 'ok',
          server_time: new Date().toISOString(),
          agents_paused: businessSettings.agents_paused,
          version: '1.2.0-coreiq',
        },
      };
    }

    case 'crm_capabilities': {
      return {
        success: true,
        result: {
          total_tools: MCP_TOOLS.length,
          tools: MCP_TOOLS.map((t) => ({ name: t.name, scope: t.requiredScope, description: t.description })),
          daily_operator_loop: [
            '1. crm_get_followups_due & review Needs you human escalations',
            '2. Process unpriced products via crm_price_estimate',
            '3. Advance pipeline deals & check stage exit criteria',
            '4. Convert accepted quotes to invoices',
            '5. Reconcile received payments & auto-advance retainers',
          ],
          gates: [
            { name: 'quote_discount_approval', condition: 'discount_pct > agent_discount_cap', resolution_tool: 'crm_approve_quote' },
            { name: 'unpriced_product', condition: 'needs_price === true', resolution_tool: 'crm_price_estimate' },
            { name: 'stage_reason', condition: 'reason is mandatory', resolution_tool: 'crm_move_stage' },
            { name: 'stage_checklist', condition: 'exit_checklist items pending', resolution_tool: 'crm_get_stage_playbook' },
            { name: 'send_mode_draft', condition: 'send_mode === draft', resolution_tool: 'crm_generate_invoice_pdf / crm_generate_quote_pdf' },
            { name: 'agents_paused', condition: 'operator toggled pause', resolution_tool: 'crm_ping' },
            { name: 'cadence_guard', condition: 'contacted within min_hours or max_attempts', resolution_tool: 'crm_request_human' },
          ],
          settings: {
            currency: businessSettings.currency,
            vat_enabled: businessSettings.vat_enabled,
            send_mode: businessSettings.send_mode,
            agents_paused: businessSettings.agents_paused,
          },
        },
      };
    }

    default:
      return {
        success: true,
        result: {
          message: `Tool ${toolName} executed successfully by ${actorName}`,
          params: args,
        },
      };
  }
}
