export interface McpToolDefinition {
  name: string;
  description: string;
  requiredScope: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export const MCP_TOOLS: McpToolDefinition[] = [
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
    description: 'Get complete 360-degree client card (contacts, engagements, stage, requests, questionnaires, feedback, deliverables, quotes, recent activity, open tasks, health reasons)',
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
  // Invoicing & Commercial Documents
  {
    name: 'crm_create_invoice',
    description: 'Create a new invoice with line items, calculating subtotal, VAT, and total due',
    requiredScope: 'invoices:write',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Client ID or Code' },
        engagement_id: { type: 'string', description: 'Optional associated engagement' },
        quote_id: { type: 'string', description: 'Optional associated quote' },
        due_days: { type: 'number', description: 'Payment due in days (default from settings)' },
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
            },
            required: ['description', 'unit_price'],
          },
        },
        notes: { type: 'string' },
        is_historical: { type: 'boolean', description: 'Flag if recording historical invoice outside CRM' },
        custom_invoice_number: { type: 'string', description: 'Custom invoice number if recording historical' },
      },
      required: ['client_id', 'items'],
    },
  },
  {
    name: 'crm_get_invoice',
    description: 'Retrieve complete invoice card including items, payment snapshots, and balance',
    requiredScope: 'invoices:read',
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string', description: 'Invoice ID or Invoice Number (e.g. CIQ-0002)' },
      },
      required: ['invoice_id'],
    },
  },
  {
    name: 'crm_list_invoices',
    description: 'List invoices filtered by client_id, status, or historical flag',
    requiredScope: 'invoices:read',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        status: { type: 'string', enum: ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void'] },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'crm_update_invoice',
    description: 'Update status, due date, or notes on an invoice',
    requiredScope: 'invoices:write',
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string' },
        status: { type: 'string', enum: ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void'] },
        due_date: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['invoice_id'],
    },
  },
  {
    name: 'crm_record_payment',
    description: 'Record payment received against an invoice; updates balance, marks status, and triggers push',
    requiredScope: 'payments:write',
    inputSchema: {
      type: 'object',
      properties: {
        invoice_id: { type: 'string' },
        amount: { type: 'number' },
        payment_method: { type: 'string', description: 'e.g. EFT, Wise, PayPal, PayFast' },
        reference: { type: 'string', description: 'Bank transaction reference or receipt number' },
        notes: { type: 'string' },
      },
      required: ['invoice_id', 'amount', 'payment_method'],
    },
  },
  {
    name: 'crm_generate_invoice_pdf',
    description: 'Generate on-demand in-memory PDF for an invoice returning Base64 data to attach to emails',
    requiredScope: 'invoices:read',
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
    description: 'Generate on-demand in-memory PDF for a quote returning Base64 data to attach to emails',
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
    name: 'crm_mark_document_sent',
    description: 'Mark a quote or invoice as dispatched; logs channel, recipient, and timeline activity',
    requiredScope: 'invoices:write',
    inputSchema: {
      type: 'object',
      properties: {
        document_type: { type: 'string', enum: ['invoice', 'quote'] },
        document_id: { type: 'string' },
        channel: { type: 'string', enum: ['email', 'whatsapp', 'manual'] },
        recipient: { type: 'string' },
      },
      required: ['document_type', 'document_id'],
    },
  },
  {
    name: 'crm_accept_quote',
    description: 'Mark quote accepted; generates technical build brief and moves engagement to Won: Building',
    requiredScope: 'quotes:write',
    inputSchema: {
      type: 'object',
      properties: {
        quote_id: { type: 'string' },
        accepted_by_name: { type: 'string' },
        acceptance_note: { type: 'string' },
      },
      required: ['quote_id'],
    },
  },
  {
    name: 'crm_approve_quote',
    description: 'Approve a quote that requires pricing approval due to exceeding agent discount limits',
    requiredScope: 'quotes:write',
    inputSchema: {
      type: 'object',
      properties: {
        quote_id: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['quote_id'],
    },
  },
  // Retainers
  {
    name: 'crm_create_retainer',
    description: 'Create a recurring retainer agreement for recurring maintenance or advisory',
    requiredScope: 'retainers:write',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        engagement_id: { type: 'string' },
        description: { type: 'string' },
        amount: { type: 'number' },
        cycle: { type: 'string', enum: ['monthly', 'quarterly', 'annual'] },
        start_date: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['client_id', 'description', 'amount', 'cycle'],
    },
  },
  {
    name: 'crm_list_retainers',
    description: 'List active and scheduled retainers with upcoming billing dates',
    requiredScope: 'retainers:read',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        status: { type: 'string', enum: ['active', 'paused', 'ended'] },
      },
    },
  },
  {
    name: 'crm_generate_retainer_invoice',
    description: 'Generate the next scheduled invoice for an active retainer agreement',
    requiredScope: 'retainers:write',
    inputSchema: {
      type: 'object',
      properties: {
        retainer_id: { type: 'string' },
      },
      required: ['retainer_id'],
    },
  },
  // Milestones & Delivery
  {
    name: 'crm_list_milestones',
    description: 'List delivery checklist milestones for an engagement in Won: Building',
    requiredScope: 'milestones:read',
    inputSchema: {
      type: 'object',
      properties: {
        engagement_id: { type: 'string' },
      },
      required: ['engagement_id'],
    },
  },
  {
    name: 'crm_create_milestone',
    description: 'Create a build delivery milestone task for an engagement',
    requiredScope: 'milestones:write',
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
    requiredScope: 'milestones:write',
    inputSchema: {
      type: 'object',
      properties: {
        milestone_id: { type: 'string' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'blocked', 'done'] },
      },
      required: ['milestone_id', 'status'],
    },
  },
  // Control, Playbooks & Operations
  {
    name: 'crm_get_business_settings',
    description: 'Retrieve commercial profile, banking details, terms blocks, and numbering counters',
    requiredScope: 'clients:read',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'crm_get_stage_playbook',
    description: 'Retrieve stage guidance, exit criteria, exit checklist, and next action hints',
    requiredScope: 'engagements:read',
    inputSchema: {
      type: 'object',
      properties: {
        stage_id: { type: 'string' },
        engagement_id: { type: 'string' },
      },
    },
  },
  {
    name: 'crm_get_followups_due',
    description: 'Check which clients are eligible for follow-up based on cadence rules or need escalation',
    requiredScope: 'clients:read',
    inputSchema: {
      type: 'object',
      properties: {
        stage_id: { type: 'string' },
        limit: { type: 'number' },
      },
    },
  },
  {
    name: 'crm_request_human',
    description: 'Escalate to human owner when agent rules or gates cannot be satisfied autonomously',
    requiredScope: 'activities:write',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        engagement_id: { type: 'string' },
        reason: { type: 'string', description: 'Detailed reason for human escalation' },
        urgency: { type: 'string', enum: ['high', 'urgent'] },
      },
      required: ['client_id', 'reason'],
    },
  },
  {
    name: 'crm_ping',
    description: 'Ping CRM service health; returns server time and pause status',
    requiredScope: 'clients:read',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'crm_capabilities',
    description: 'List all operational capabilities, tool registry, gate rules, and settings for AI agents',
    requiredScope: 'clients:read',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];
