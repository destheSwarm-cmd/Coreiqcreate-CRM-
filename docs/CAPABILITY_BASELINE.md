# CoreIQ CRM (CoreIQ Operator) — Capability Baseline & Audits

**Audit Date:** 19 October 2026  
**System:** CoreIQ CRM Operator Engine  
**Runtime:** Cloud Run (Stateless, Scale-to-Zero Node.js + Vite React SPA)

---

## 1. Sidebar & Navigation Views (Baseline: 11 Views)

All 11 existing top-level views are active and preserved:

| View Key | Display Label | Description / Capability |
| :--- | :--- | :--- |
| `pipeline` | **Pipeline** | Kanban board of active engagement journeys across stages with metrics, filters, and stage movements. |
| `dashboard` | **Dashboard** | Executive overview of pipeline conversion, active deals, sampling ROI, unpriced products, and action items. |
| `table` | **Data Table** | Searchable, sortable, exportable tabular view of clients and engagements. |
| `calendar` | **Sales Diary** | Timeline calendar of client follow-ups, scheduled tasks, and closing dates. |
| `clients` | **Clients** | Master client directory with contact cards, health scores, and engagement history. |
| `tasks` | **Tasks** | Operator & agent actionable task list sorted by due date and priority. |
| `pricebook` | **Price Book** | Product catalog, pricing tiers, options, add-ons, and pricing engine rules. |
| `assets` | **Asset Library** | Reusable prototype assets, automation blueprints, and client usage tracking. |
| `api_agent` | **MCP & Agent Hub** | MCP tool catalog, scope tester, and API key management for Claude / Hermes agents. |
| `verification` | **Part C Verification** | Automated end-to-end self-tests, RLS validation, and system integrity report. |
| `settings` | **Settings** | Commercial defaults, branding, audit logs, stage playbooks, and integrations. |

---

## 2. Database Tables Baseline

### (a) Existing Supabase Postgres Tables (from `20261018_001_init.sql`)
1. `settings` — System-wide key/value JSONB configuration.
2. `profiles` — User profile metadata linked to `auth.users(id)`.
3. `user_roles` — RBAC mapping (`owner`, `admin`, `operator`, `viewer`).
4. `clients` — Client accounts with `client_code` (CIQ-C-XXXX).
5. `contacts` — Client contact individuals and communication preferences.
6. `pipeline_stages` — 11 seeded stages (9 active + 2 terminal: Lost, Paused).
7. `engagements` — Client sales/build deals with `engagement_code` (CIQ-E-XXXX).
8. `stage_history` — Append-only stage transitions with mandatory reasons and actors.
9. `requests` — Client feature, build, and revision requests.
10. `activities` — Timeline events (notes, calls, meetings, feedback, stage changes).
11. `tasks` — Operator and agent follow-up tasks.
12. `audit_log` — Append-only system audit log with diffs and actor hashes.

### (b) Extended Local / Postgres Tables (from `data/coreiq_crm_db.json`)
- `products`, `product_options`, `price_tiers`, `product_relations`, `bundles`, `bundle_items`
- `quotes`, `quote_lines`, `approvals`, `build_briefs`
- `assets`, `asset_usage`
- `email_accounts`, `email_templates`, `email_sequences`, `sequence_enrollments`, `email_messages`, `suppression_list`
- `api_keys`, `webhook_endpoints`, `webhook_deliveries`, `integrations`, `playbooks`, `nba_items`, `ai_runs`
- `custom_field_defs`, `questionnaire_templates`, `questionnaires`, `questionnaire_responses`, `feedback`, `sampling_costs`, `deliverables`

---

## 3. Existing REST Routes Baseline

- `GET /v1/openapi.json` — OpenAPI 3.0 specification.
- `GET /api/v1/health` — Service health and Supabase status.
- `GET /api/v1/clients` — Paginated, filtered client list.
- `POST /api/v1/clients` — Client creation with automatic CIQ-C-XXXX generation.
- `GET /api/v1/clients/:id` — Full 360-degree client record with contacts & activities.
- `GET /api/v1/pipeline` — Stage counts, deal volume, and weighted values.
- `GET /api/crm/board` — Supabase-backed live board data (stages, engagements, clients, tasks).
- `POST /api/crm/clients` — Creates client, primary contact, outreach engagement, and activity.
- `POST /api/crm/engagements/:id/move` — Stage transition with mandatory audit logging and reason.
- `GET /api/crm/tasks` — Supabase tasks list.
- `PATCH /api/crm/tasks/:id` — Task status/field update.
- `POST /mcp` — Model Context Protocol JSON-RPC 2.0 streaming HTTP endpoint.
- `GET /api/db/state` — Operator database state (owner role protected).
- `POST /api/db/update` — Upsert / archive record (owner role protected).
- `GET /api/verification-report` — Automated verification report (owner role protected).
- `POST /api/intake` — Webhook endpoint for inbound leads.
- `POST /api/governor/action` — Internal AI actions (summarization, draft emails).
- `GET /quote/:token`, `GET /q/:token`, `GET /f/:token` — Token-hashed public view endpoints.

---

## 4. Existing 35 MCP Tools Baseline

All 35 existing tools are preserved with exact names, parameters, and behaviors:

1. `crm_search_clients` — Search clients by query string (name, industry, tags, code) or stage.
2. `crm_get_client_card` — Retrieve complete 360-degree client card.
3. `crm_create_client` — Create a new client with auto-assigned CIQ-C-XXXX code.
4. `crm_update_client` — Update fields on an existing client.
5. `crm_add_contact` — Add a contact person to a client.
6. `crm_create_engagement` — Create a pipeline engagement journey for a client.
7. `crm_update_engagement` — Update engagement details (value estimate, categories, close date).
8. `crm_move_stage` — Advance engagement to a target stage with mandatory reason.
9. `crm_log_activity` — Record timeline note, call, meeting, or client event.
10. `crm_create_task` — Create an actionable task for human operator or agent.
11. `crm_complete_task` — Mark an open task as completed.
12. `crm_add_request` — Log a scoped client request or feature requirement.
13. `crm_update_request` — Update status, priority, or category of a request.
14. `crm_generate_questionnaire` — Generate tokenized discovery questionnaire link.
15. `crm_send_questionnaire` — Log dispatch of questionnaire to client contact.
16. `crm_get_questionnaire_responses` — Retrieve submitted questionnaire response answers.
17. `crm_record_feedback` — Record prototype sample rating and feedback.
18. `crm_create_deliverable` — Register a deliverable with live URL or artifact link.
19. `crm_update_deliverable` — Update status of a deliverable.
20. `crm_list_products` — Browse standard product catalog, options, and pricing tiers.
21. `crm_price_estimate` — Calculate quote pricing with discount limits and options.
22. `crm_create_quote` — Draft commercial quote with line items and terms.
23. `crm_update_quote` — Update quote status, lines, or commercial notes.
24. `crm_send_quote` — Mark quote sent; validates unpriced items and approvals.
25. `crm_get_build_brief` — Retrieve technical build brief synthesized for an engagement.
26. `crm_list_assets` — Search reusable code, workflow, and agent assets.
27. `crm_log_asset_usage` — Track reuse of asset modules across client projects.
28. `crm_draft_email` — Draft follow-up or quote notification email copy.
29. `crm_send_email` — Send outbound email (respects send-mode setting).
30. `crm_get_next_best_actions` — Retrieve next-best-action recommendations and SLA warnings.
31. `crm_pipeline_summary` — Aggregate deal counts and pipeline metrics.
32. `crm_dashboard_summary` — Core conversion rates, revenue, and capacity statistics.
33. `crm_get_audit` — Query append-only audit trail filtered by entity.
34. `crm_archive` — Soft-delete client or engagement record with timestamp.
35. `crm_hard_delete` — Administrative permanent deletion requiring explicit confirmation string.

---

## 5. Persistence Audit Findings

- **Existing State:** Primary CRM tables (`clients`, `engagements`, `pipeline_stages`, `tasks`, etc.) were configured in Supabase Postgres, while secondary business entities (`products`, `price_tiers`, `product_options`, `quotes`, `assets`, `email_templates`, `api_keys`, etc.) resided in `data/coreiq_crm_db.json`.
- **Cloud Run Risk:** Cloud Run containers are stateless and scale to zero. Files stored on ephemeral disk are wiped upon instance recycle.
- **Resolution:** All business entities are mapped to idempotent Postgres tables in `supabase/migrations/20261019_002_coreiq_extensions.sql`. On server startup, existing data in `data/coreiq_crm_db.json` is mirrored additively into Postgres so state persists indefinitely across container recycles, without altering or deleting the local file.

---

## 6. Gate Audit (Blocking Rules & Agent Resolution)

| Existing Gate / Blocking Rule | Condition | How Satisfied by Agents (Never a Dead End) |
| :--- | :--- | :--- |
| **Quote Pricing Approval Gate** | When a quote line has a discount exceeding `agent_discount_cap_pct` (default 10%), quote status becomes `pending_approval`. `crm_send_quote` rejects sending with `APPROVAL_REQUIRED`. | 1) Agent calls `crm_price_estimate` to verify discounts within cap.<br>2) Owner can approve via UI, or agent with `money:write` calls `crm_approve_quote`.<br>3) Threshold is configurable in Settings (`approval_threshold_pct`). |
| **Unpriced Products Gate** | Quotes with items marked `needs_price: true` or `unit_price <= 0` cannot be sent (`UNPRICED_LINES`). | Agent calls `crm_list_products` and `crm_price_estimate` to ensure standard SKU base price is applied, or updates line item price via `crm_update_quote`. |
| **Stage Transition Reason Gate** | `crm_move_stage` requires a non-empty `reason` (>= 3 chars). | Agent must supply `reason` in tool arguments explaining the business trigger (e.g. "Questionnaire completed by client"). Error states `reason is mandatory`. |
| **Stage Exit Checklist Gate** | When `toStage.exit_checklist` contains pending items, agent transitions without override are blocked (`CHECKLIST_INCOMPLETE`). | 1) Checklist items are displayed in tool error response with instructions.<br>2) Stage playbooks provide clear exit criteria (`crm_get_stage_playbook`).<br>3) Configurable in Settings under Stage Playbooks. |
| **Email Send-Mode Gate** | When `settings.send_mode === 'draft'`, `crm_send_email` rejects live sending (`SEND_MODE_DRAFT_ONLY`). | 1) Send-mode is surfaced and configurable in Settings (Draft vs Live).<br>2) Agents obtain generated PDF base64 via `crm_generate_invoice_pdf` / `crm_generate_quote_pdf` to dispatch via their own email transports, then call `crm_mark_document_sent`. |
| **Agent Pause Gate (`agents_paused`)** | When owner toggles `agents_paused` ON, all write actions return `423 AGENTS_PAUSED`. | Reads, `crm_ping`, `crm_capabilities`, and website intake continue to function. Resumed immediately via owner toggle. |
| **Cadence Guard** | Prevents contacting the same client more frequently than `min_followup_hours` (default 24h) or more than `max_followups_per_stage` (default 3). | Tool `crm_get_followups_due` returns `eligible_for_followup: false` with time remaining, or flags `escalate: true` to trigger `crm_request_human`. |

---

## 7. Email Transport Audit

- **Current Config:** In `.env.example`, no third-party email provider API key (e.g., SendGrid, Mailgun) is configured.
- **Design Resolution:** Per brief Step 0(d), no paid email service is provisioned. `crm_generate_invoice_pdf` and `crm_generate_quote_pdf` return pure JS in-memory generated PDFs (Base64 data blob + MIME type), allowing external AI agents (Hermes / Claude) to attach PDFs directly using their native email capabilities and subsequently invoke `crm_mark_document_sent`.

---

## 8. Baseline Confirmation

Every baseline item recorded in this document is verified to exist in the repository prior to extending functionality.
