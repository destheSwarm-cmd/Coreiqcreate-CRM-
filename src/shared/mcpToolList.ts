export interface McpToolDefinition {
  name: string;
  description: string;
  requiredScope: string;
  group: 'clients' | 'pipeline' | 'work' | 'money' | 'docs' | 'comms' | 'insights' | 'system';
  isWrite: boolean;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export const MCP_TOOLS: McpToolDefinition[] = [
  // ==========================================
  // GROUP 1: CLIENTS
  // ==========================================
  {
    name: 'crm_search_clients',
    description: 'Search clients by query string (name, industry, tags, code) or stage',
    requiredScope: 'clients:read',
    group: 'clients',
    isWrite: false,
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
    description: 'Get complete 360-degree client card (contacts, engagements, stage, requests, questionnaires, feedback, deliverables, quotes, recent activity, open tasks, health reasons)',
    requiredScope: 'clients:read',
    group: 'clients',
    isWrite: false,
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
    group: 'clients',
    isWrite: true,
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
    group: 'clients',
    isWrite: true,
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
    group: 'clients',
    isWrite: true,
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

  // ==========================================
  // GROUP 2: PIPELINE
  // ==========================================
  {
    name: 'crm_list_stages',
    description: 'List all pipeline stages with goal, exit criteria, probabilities, and SLAs',
    requiredScope: 'pipeline:read',
    group: 'pipeline',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'crm_get_stage_playbook',
    description: 'Retrieve stage guidance, exit criteria, exit checklist, and next action hints',
    requiredScope: 'pipeline:read',
    group: 'pipeline',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {
        stage_id: { type: 'string' },
        engagement_id: { type: 'string' },
      },
    },
  },
  {
    name: 'crm_update_stage_playbook',
    description: 'Update stage guidance markdown, exit checklist, goal, or exit criteria',
    requiredScope: 'pipeline:write',
    group: 'pipeline',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        stage_id: { type: 'string' },
        guidance_md: { type: 'string' },
        goal: { type: 'string' },
        exit_checklist: { type: 'array', items: { type: 'string' } },
        exit_criteria: { type: 'array', items: { type: 'string' } },
        next_action_hint: { type: 'string' },
        stale_after_days: { type: 'number' },
      },
      required: ['stage_id'],
    },
  },
  {
    name: 'crm_create_engagement',
    description: 'Create an engagement journey through the pipeline for a client',
    requiredScope: 'pipeline:write',
    group: 'pipeline',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        title: { type: 'string' },
        categories: { type: 'array', items: { type: 'string' } },
        value_estimate: { type: 'number' },
        stage_id: { type: 'string' },
        currency: { type: 'string' },
        idempotency_key: { type: 'string' },
      },
      required: ['client_id', 'title'],
    },
  },
  {
    name: 'crm_update_engagement',
    description: 'Update engagement details (value, title, categories, target dates)',
    requiredScope: 'pipeline:write',
    group: 'pipeline',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagement_id: { type: 'string' },
        title: { type: 'string' },
        value_estimate: { type: 'number' },
        expected_close: { type: 'string' },
        categories: { type: 'array', items: { type: 'string' } },
      },
      required: ['engagement_id'],
    },
  },
  {
    name: 'crm_move_stage',
    description: 'Advance engagement stage with mandatory reason, checklist validation, and audit entry',
    requiredScope: 'pipeline:write',
    group: 'pipeline',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagement_id: { type: 'string' },
        to_stage_id: { type: 'string' },
        reason: { type: 'string', description: 'Mandatory reason explaining the stage transition' },
        checklist_overrides: { type: 'array', items: { type: 'string' } },
        override: { type: 'boolean' },
      },
      required: ['engagement_id', 'to_stage_id', 'reason'],
    },
  },
  {
    name: 'crm_pipeline_summary',
    description: 'Get counts and total/weighted values across all pipeline stages',
    requiredScope: 'pipeline:read',
    group: 'pipeline',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ==========================================
  // GROUP 3: WORK (Tasks, Requests, Milestones, Activity)
  // ==========================================
  {
    name: 'crm_create_task',
    description: 'Create an operator or agent task',
    requiredScope: 'work:write',
    group: 'work',
    isWrite: true,
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
        idempotency_key: { type: 'string' },
      },
      required: ['client_id', 'title'],
    },
  },
  {
    name: 'crm_complete_task',
    description: 'Mark a task as completed',
    requiredScope: 'work:write',
    group: 'work',
    isWrite: true,
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
    description: 'Add a project scope item or client requirement',
    requiredScope: 'work:write',
    group: 'work',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        engagement_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        product_id: { type: 'string' },
      },
      required: ['client_id', 'title'],
    },
  },
  {
    name: 'crm_update_request',
    description: 'Update status or specification of a request item',
    requiredScope: 'work:write',
    group: 'work',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        request_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string', enum: ['inbox', 'scoped', 'building', 'built', 'rejected'] },
        priority: { type: 'string' },
      },
      required: ['request_id'],
    },
  },
  {
    name: 'crm_log_activity',
    description: 'Log an audit note, meeting, call, or agent action to the client timeline',
    requiredScope: 'work:write',
    group: 'work',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        engagement_id: { type: 'string' },
        type: { type: 'string', enum: ['note', 'call', 'meeting', 'email_in', 'email_out', 'agent', 'system'] },
        summary: { type: 'string' },
        body: { type: 'string' },
        metadata: { type: 'object' },
      },
      required: ['client_id', 'summary'],
    },
  },
  {
    name: 'crm_add_milestone',
    description: 'Add an engagement delivery milestone (checklist item with due date and order)',
    requiredScope: 'work:write',
    group: 'work',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagement_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        due_date: { type: 'string' },
        sort_order: { type: 'number' },
      },
      required: ['engagement_id', 'title'],
    },
  },
  {
    name: 'crm_create_milestone',
    description: 'Create milestone (alias of crm_add_milestone)',
    requiredScope: 'work:write',
    group: 'work',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagement_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        due_date: { type: 'string' },
        sort_order: { type: 'number' },
      },
      required: ['engagement_id', 'title'],
    },
  },
  {
    name: 'crm_update_milestone',
    description: 'Update status of a delivery milestone (todo, in_progress, blocked, done)',
    requiredScope: 'work:write',
    group: 'work',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        milestone_id: { type: 'string' },
        title: { type: 'string' },
        due_date: { type: 'string' },
        sort_order: { type: 'number' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'blocked', 'done'] },
      },
      required: ['milestone_id'],
    },
  },
  {
    name: 'crm_complete_milestone',
    description: 'Mark a delivery milestone as completed (sets status=done and completed_at)',
    requiredScope: 'work:write',
    group: 'work',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        milestone_id: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['milestone_id'],
    },
  },
  {
    name: 'crm_list_milestones',
    description: 'List milestones for an engagement ordered by sort_order and due_date',
    requiredScope: 'work:read',
    group: 'work',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {
        engagement_id: { type: 'string' },
      },
      required: ['engagement_id'],
    },
  },
  {
    name: 'crm_log_followup',
    description: 'Record an executed follow-up with a client (updates last_followup_at and followup_count, enforces 24h cadence)',
    requiredScope: 'work:write',
    group: 'work',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        engagement_id: { type: 'string' },
        channel: { type: 'string', enum: ['email', 'whatsapp', 'call'] },
        notes: { type: 'string' },
      },
      required: ['client_id', 'channel', 'notes'],
    },
  },
  {
    name: 'crm_snooze_followup',
    description: 'Snooze follow-up eligibility for a client by N hours with reason',
    requiredScope: 'work:write',
    group: 'work',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        hours: { type: 'number', description: 'Hours to snooze (default 24)' },
        reason: { type: 'string' },
      },
      required: ['client_id', 'reason'],
    },
  },

  // ==========================================
  // GROUP 4: MONEY (Catalog, Quotes, Invoices, Payments, Retainers)
  // ==========================================
  {
    name: 'crm_list_products',
    description: 'List software products from Price Book catalog with base prices and tiers',
    requiredScope: 'money:read',
    group: 'money',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string' },
      },
    },
  },
  {
    name: 'crm_price_estimate',
    description: 'Run price estimation formula with quantity, options, and discount caps',
    requiredScope: 'money:read',
    group: 'money',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {
        product_id: { type: 'string' },
        quantity: { type: 'number' },
        options: { type: 'array', items: { type: 'string' } },
        discount_pct: { type: 'number' },
      },
      required: ['product_id'],
    },
  },
  {
    name: 'crm_create_quote',
    description: 'Draft a commercial quote with line items, VAT, and terms (auto CIQ-Q-XXXX-vN format)',
    requiredScope: 'money:write',
    group: 'money',
    isWrite: true,
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
              description: { type: 'string' },
              qty: { type: 'number' },
              unit_price: { type: 'number' },
              discount_pct: { type: 'number' },
              product_id: { type: 'string' },
              request_id: { type: 'string' },
            },
            required: ['description', 'unit_price'],
          },
        },
        payment_link_url: { type: 'string' },
        notes: { type: 'string' },
        idempotency_key: { type: 'string' },
      },
      required: ['client_id', 'lines'],
    },
  },
  {
    name: 'crm_update_quote',
    description: 'Update lines or terms of an unaccepted quote',
    requiredScope: 'money:write',
    group: 'money',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        quote_id: { type: 'string' },
        lines: { type: 'array' },
        notes: { type: 'string' },
      },
      required: ['quote_id'],
    },
  },
  {
    name: 'crm_send_quote',
    description: 'Mark quote as sent and generate public token link (blocked if unpriced or approval pending)',
    requiredScope: 'money:write',
    group: 'money',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        quote_id: { type: 'string' },
      },
      required: ['quote_id'],
    },
  },
  {
    name: 'crm_accept_quote',
    description: 'Record formal quote acceptance (in-system or recorded off-system by agent with accepted_at, accepted_via, accepted_by_name, acceptance_note). Auto-creates exactly 1 BUILD_NEEDED task.',
    requiredScope: 'money:write',
    group: 'money',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        quote_id: { type: 'string' },
        signer_name: { type: 'string' },
        accepted_via: { type: 'string', enum: ['web', 'email', 'whatsapp', 'call', 'signed_pdf'] },
        acceptance_note: { type: 'string' },
      },
      required: ['quote_id', 'signer_name'],
    },
  },
  {
    name: 'crm_approve_quote',
    description: 'Owner approval for quotes that exceed the agent discount threshold',
    requiredScope: 'money:write',
    group: 'money',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        quote_id: { type: 'string' },
        approved: { type: 'boolean' },
        notes: { type: 'string' },
      },
      required: ['quote_id', 'approved'],
    },
  },
  {
    name: 'crm_create_invoice',
    description: 'Create an invoice (sequential numbering CIQ-NNNN, VAT calculation, 10-minute duplicate guard)',
    requiredScope: 'money:write',
    group: 'money',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        engagement_id: { type: 'string' },
        quote_id: { type: 'string' },
        retainer_id: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              sub_description: { type: 'string' },
              qty: { type: 'number' },
              unit_price: { type: 'number' },
              discount_pct: { type: 'number' },
              product_id: { type: 'string' },
            },
            required: ['description', 'unit_price'],
          },
        },
        notes: { type: 'string' },
        due_days: { type: 'number' },
        is_historical: { type: 'boolean' },
        custom_invoice_number: { type: 'string' },
        idempotency_key: { type: 'string' },
      },
      required: ['client_id', 'items'],
    },
  },
  {
    name: 'crm_update_invoice',
    description: 'Update draft invoice metadata, due date, or notes',
    requiredScope: 'money:write',
    group: 'money',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string' },
        due_date: { type: 'string' },
        notes: { type: 'string' },
        status: { type: 'string', enum: ['draft', 'sent', 'overdue'] },
      },
      required: ['invoice_id'],
    },
  },
  {
    name: 'crm_get_invoice',
    description: 'Retrieve full invoice record with items, payment allocations, balance, and terms snapshot',
    requiredScope: 'money:read',
    group: 'money',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string' },
      },
      required: ['invoice_id'],
    },
  },
  {
    name: 'crm_list_invoices',
    description: 'List invoices filtered by client_id, status (draft, sent, partially_paid, paid, overdue, void), paginated',
    requiredScope: 'money:read',
    group: 'money',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        status: { type: 'string' },
        limit: { type: 'number' },
        cursor: { type: 'string' },
      },
    },
  },
  {
    name: 'crm_record_payment',
    description: 'Record partial or full payment against an invoice (updates amounts, triggers money-in push notification, creates BUILD_NEEDED task if first payment)',
    requiredScope: 'money:write',
    group: 'money',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string' },
        amount: { type: 'number' },
        payment_method: { type: 'string', default: 'EFT' },
        reference: { type: 'string' },
        notes: { type: 'string' },
        idempotency_key: { type: 'string' },
      },
      required: ['invoice_id', 'amount'],
    },
  },
  {
    name: 'crm_void_invoice',
    description: 'Void an invoice (never delete). Sets status to void with reason logged.',
    requiredScope: 'money:write',
    group: 'money',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['invoice_id', 'reason'],
    },
  },
  {
    name: 'crm_convert_quote_to_invoice',
    description: 'Convert an accepted quote to invoice (modes: full, deposit percentage, or balance remaining)',
    requiredScope: 'money:write',
    group: 'money',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        quote_id: { type: 'string' },
        mode: { type: 'string', enum: ['full', 'deposit', 'balance'] },
        deposit_pct: { type: 'number', description: 'Deposit percentage if mode is deposit (default 50)' },
        idempotency_key: { type: 'string' },
      },
      required: ['quote_id'],
    },
  },
  {
    name: 'crm_create_retainer',
    description: 'Create a recurring retainer schedule for a client (monthly/weekly/quarterly)',
    requiredScope: 'money:write',
    group: 'money',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        engagement_id: { type: 'string' },
        description: { type: 'string' },
        amount: { type: 'number' },
        cycle: { type: 'string', enum: ['weekly', 'monthly', 'quarterly', 'annually'] },
        start_date: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['client_id', 'description', 'amount'],
    },
  },
  {
    name: 'crm_update_retainer',
    description: 'Update retainer parameters, pause or activate status, or adjust next invoice date',
    requiredScope: 'money:write',
    group: 'money',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        retainer_id: { type: 'string' },
        amount: { type: 'number' },
        cycle: { type: 'string' },
        status: { type: 'string', enum: ['active', 'paused', 'cancelled'] },
        next_invoice_date: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['retainer_id'],
    },
  },
  {
    name: 'crm_list_retainers',
    description: 'List active and paused retainers with next due dates and client links',
    requiredScope: 'money:read',
    group: 'money',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        status: { type: 'string' },
      },
    },
  },
  {
    name: 'crm_generate_retainer_invoice',
    description: 'Generate next invoice for a retainer and advance its next_invoice_date by one cycle',
    requiredScope: 'money:write',
    group: 'money',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        retainer_id: { type: 'string' },
      },
      required: ['retainer_id'],
    },
  },
  {
    name: 'crm_get_pricing_terms',
    description: 'Retrieve current commercial terms blocks, default payment due days, deposit percentage, and quote validity',
    requiredScope: 'money:read',
    group: 'money',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'crm_update_pricing_terms',
    description: 'Update default payment terms blocks and commercial due periods',
    requiredScope: 'money:write',
    group: 'money',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        terms_blocks: { type: 'object' },
        payment_due_days: { type: 'number' },
        quote_validity_days: { type: 'number' },
        deposit_pct: { type: 'number' },
      },
    },
  },

  // ==========================================
  // GROUP 5: DOCS (PDFs, Briefs, Deliverables, Assets, Feedback)
  // ==========================================
  {
    name: 'crm_generate_invoice_pdf',
    description: 'Generate official A4 PDF for an invoice (returns summary and base64 application/pdf matching CIQ-0001 layout)',
    requiredScope: 'docs:write',
    group: 'docs',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string' },
      },
      required: ['invoice_id'],
    },
  },
  {
    name: 'crm_generate_quote_pdf',
    description: 'Generate official A4 PDF for a commercial proposal quote (returns summary and base64 application/pdf)',
    requiredScope: 'docs:write',
    group: 'docs',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        quote_id: { type: 'string' },
      },
      required: ['quote_id'],
    },
  },
  {
    name: 'crm_mark_document_sent',
    description: 'Mark quote or invoice as formally sent to client (records sent_at timestamp and logs timeline event)',
    requiredScope: 'docs:write',
    group: 'docs',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        document_type: { type: 'string', enum: ['invoice', 'quote'] },
        document_id: { type: 'string' },
        sent_channel: { type: 'string', enum: ['email', 'whatsapp', 'in_person'] },
      },
      required: ['document_type', 'document_id'],
    },
  },
  {
    name: 'crm_get_build_brief',
    description: 'Retrieve synthesized Build Brief with builder prompts and deliverable specifications',
    requiredScope: 'docs:read',
    group: 'docs',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {
        quote_id: { type: 'string' },
        engagement_id: { type: 'string' },
      },
    },
  },
  {
    name: 'crm_list_assets',
    description: 'Browse reusable software blueprints, templates, and prompt packs',
    requiredScope: 'docs:read',
    group: 'docs',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string' },
      },
    },
  },
  {
    name: 'crm_log_asset_usage',
    description: 'Record reuse of an asset in a deliverable to calculate ROI and saved engineering hours',
    requiredScope: 'docs:write',
    group: 'docs',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        asset_id: { type: 'string' },
        deliverable_id: { type: 'string' },
        client_id: { type: 'string' },
        hours_saved: { type: 'number' },
      },
      required: ['asset_id', 'client_id'],
    },
  },
  {
    name: 'crm_create_deliverable',
    description: 'Register a built software deliverable, repo URL, demo staging link, and tech stack',
    requiredScope: 'docs:write',
    group: 'docs',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        engagement_id: { type: 'string' },
        name: { type: 'string' },
        kind: { type: 'string', enum: ['app', 'website', 'workflow', 'agent', 'bot', 'integration', 'voice'] },
        is_sample: { type: 'boolean' },
        live_url: { type: 'string' },
        repo_url: { type: 'string' },
        hours_spent: { type: 'number' },
      },
      required: ['client_id', 'name'],
    },
  },
  {
    name: 'crm_update_deliverable',
    description: 'Update deliverable URL, status, or handover notes',
    requiredScope: 'docs:write',
    group: 'docs',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        deliverable_id: { type: 'string' },
        live_url: { type: 'string' },
        repo_url: { type: 'string' },
        status: { type: 'string' },
        handover_notes: { type: 'string' },
      },
      required: ['deliverable_id'],
    },
  },
  {
    name: 'crm_generate_questionnaire',
    description: 'Synthesize customized client discovery questions grounded on client requirements',
    requiredScope: 'docs:write',
    group: 'docs',
    isWrite: true,
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
    description: 'Issue unguessable token link for public discovery questionnaire',
    requiredScope: 'docs:write',
    group: 'docs',
    isWrite: true,
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
    description: 'Retrieve client answers and AI brief summary from completed questionnaire',
    requiredScope: 'docs:read',
    group: 'docs',
    isWrite: false,
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
    description: 'Log sample prototype rating (1-5), would_pay intent, and requested changes',
    requiredScope: 'docs:write',
    group: 'docs',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagement_id: { type: 'string' },
        deliverable_id: { type: 'string' },
        satisfaction: { type: 'number', minimum: 1, maximum: 5 },
        would_pay: { type: 'string', enum: ['yes', 'maybe', 'no'] },
        comments: { type: 'string' },
        requested_changes: { type: 'string' },
        source: { type: 'string' },
      },
      required: ['engagement_id', 'satisfaction'],
    },
  },

  // ==========================================
  // GROUP 6: COMMS
  // ==========================================
  {
    name: 'crm_draft_email',
    description: 'Draft outreach, follow-up, or quote presentation email grounded on client context',
    requiredScope: 'comms:write',
    group: 'comms',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        type: { type: 'string', enum: ['outreach', 'followup', 'quote', 'upsell', 'sample_ready'] },
        details: { type: 'object' },
      },
      required: ['client_id', 'type'],
    },
  },
  {
    name: 'crm_send_email',
    description: 'Dispatch an email message through connected Resend account (blocked if send_mode is draft)',
    requiredScope: 'comms:write',
    group: 'comms',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        to_email: { type: 'string' },
        subject: { type: 'string' },
        body_html: { type: 'string' },
      },
      required: ['client_id', 'to_email', 'subject', 'body_html'],
    },
  },

  // ==========================================
  // GROUP 7: INSIGHTS
  // ==========================================
  {
    name: 'crm_get_followups_due',
    description: 'Check follow-up priorities: stale clients (days in stage over stage SLA), new leads untouched >1h, quotes unanswered, invoices due/overdue 1/7/14d, retainers due, overdue milestones/tasks; each with eligible_for_followup and stage guidance.',
    requiredScope: 'insights:read',
    group: 'insights',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {
        stage_id: { type: 'string' },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'crm_get_next_best_actions',
    description: 'List triggered operational recommendations and playbook suggestions for deals',
    requiredScope: 'insights:read',
    group: 'insights',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
      },
    },
  },
  {
    name: 'crm_dashboard_summary',
    description: 'Retrieve executive dashboard metrics: pipeline total, won revenue, win rates, SLA exceedances',
    requiredScope: 'insights:read',
    group: 'insights',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'crm_get_audit',
    description: 'Retrieve append-only audit trail logs filtered by entity or actor',
    requiredScope: 'insights:read',
    group: 'insights',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {
        entity_type: { type: 'string' },
        entity_id: { type: 'string' },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'crm_get_activity_feed',
    description: 'Retrieve unified activity feed (notes, calls, meetings, agent tools, stage moves, errors) with filters',
    requiredScope: 'insights:read',
    group: 'insights',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        limit: { type: 'number' },
        error_only: { type: 'boolean' },
      },
    },
  },

  // ==========================================
  // GROUP 8: SYSTEM (Settings, Backups, Human Escalate, Admin, Intake)
  // ==========================================
  {
    name: 'crm_request_human',
    description: 'Escalate to human owner (BUILD_NEEDED | DECISION | PROBLEM): creates high-priority owner task, attaches build brief, sends push notification',
    requiredScope: 'system:write',
    group: 'system',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        engagement_id: { type: 'string' },
        type: { type: 'string', enum: ['BUILD_NEEDED', 'DECISION', 'PROBLEM'] },
        reason: { type: 'string', description: 'Detailed reason for human escalation' },
        urgency: { type: 'string', enum: ['high', 'urgent'] },
      },
      required: ['client_id', 'reason'],
    },
  },
  {
    name: 'crm_ping',
    description: 'Ping CRM service health; returns server time, Supabase status, and agents_paused flag',
    requiredScope: 'system:read',
    group: 'system',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'crm_capabilities',
    description: 'List operational capabilities, tool registry, daily operator loop guide, and gate rules',
    requiredScope: 'system:read',
    group: 'system',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'crm_get_business_settings',
    description: 'Retrieve commercial profile, banking details, terms blocks, and numbering counters',
    requiredScope: 'system:read',
    group: 'system',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'crm_update_business_settings',
    description: 'Update business trading details, banking rows, VAT configuration, and terms blocks',
    requiredScope: 'system:write',
    group: 'system',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        trading_name: { type: 'string' },
        tagline: { type: 'string' },
        email: { type: 'string' },
        website: { type: 'string' },
        address: { type: 'string' },
        vat_enabled: { type: 'boolean' },
        payment_methods: { type: 'array' },
        terms_blocks: { type: 'object' },
      },
    },
  },
  {
    name: 'crm_create_backup',
    description: 'Create a JSON/gzip backup manifest of all CRM tables (stored in crm-backups bucket with retention)',
    requiredScope: 'system:write',
    group: 'system',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        note: { type: 'string' },
      },
    },
  },
  {
    name: 'crm_list_backups',
    description: 'List available backups (weekly, manual, pre-restore) with timestamps and sizes',
    requiredScope: 'system:read',
    group: 'system',
    isWrite: false,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'crm_intake_lead',
    description: 'Process website lead intake via MCP (deduplicates, creates client CIQ-C-XXXX, engagement, task, sends push)',
    requiredScope: 'intake',
    group: 'system',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        company: { type: 'string' },
        summary: { type: 'string' },
        intent: { type: 'string' },
        budget_hint: { type: 'string' },
        session_id: { type: 'string' },
      },
      required: ['name', 'email'],
    },
  },
  {
    name: 'crm_archive',
    description: 'Archive a client, engagement, or quote (soft delete, retains full history)',
    requiredScope: 'system:write',
    group: 'system',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        entity_type: { type: 'string', enum: ['clients', 'engagements', 'quotes', 'deliverables'] },
        entity_id: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['entity_type', 'entity_id', 'reason'],
    },
  },
  {
    name: 'crm_hard_delete',
    description: 'Permanently remove test or scratch records (Admin restricted)',
    requiredScope: 'system:write',
    group: 'system',
    isWrite: true,
    inputSchema: {
      type: 'object',
      properties: {
        entity_type: { type: 'string' },
        entity_id: { type: 'string' },
        confirmation: { type: 'string', description: 'Must type DELETE_PERMANENTLY' },
      },
      required: ['entity_type', 'entity_id', 'confirmation'],
    },
  },
];
