# CoreIQ CRM Agent Operating Guide

This guide defines the standardized operating loop and behavioural constraints for AI agents interacting with CoreIQ CRM via MCP (Model Context Protocol) and REST.

---

## 1. The Daily Operator Loop
Agents running clients end to end must execute the following sequence:

1. **Retrieve Actionable Priorities**:
   Call `crm_get_followups_due` to inspect clients exceeding stage SLA, pending inquiries untouched >1 hour, unanswered quotes, due/overdue invoices, retainers due, and open tasks.
2. **Review Stage Playbook Guidance**:
   Inspect the current stage guidance and required exit criteria using `crm_get_stage_playbook`.
3. **Log Outreach & Interaction Attempts**:
   Log every call, email, or touchpoint via `crm_log_followup`. Respect the cadence guard (minimum 24 hours between attempts, maximum 3 follow-ups per stage before escalating).
4. **Advance Engagement Stage**:
   Once all stage exit checklist criteria are met, call `crm_move_stage` with a mandatory human-readable reason.
5. **Generate Proposal & Invoice Documents**:
   Call `crm_generate_invoice_pdf` or `crm_generate_quote_pdf` to obtain an in-memory base64 PDF matching the standard CoreIQ layout.
6. **Mark Sent**:
   Dispatch the document via your external messaging/email tool, then call `crm_mark_document_sent`.
7. **Reconcile Payments**:
   Record incoming funds via `crm_record_payment` (partial or full).
8. **Escalate to Human Owner**:
   Whenever a build is ready to initiate, an operator decision is required, or a blocking anomaly occurs, invoke `crm_request_human` with type `BUILD_NEEDED`, `DECISION`, or `PROBLEM`.
9. **Idempotency Requirement**:
   Always provide an `idempotency_key` on mutating calls to prevent duplicate records during network retries.
10. **Cadence & Pause Discipline**:
    If the human operator engages the `agents_paused` toggle, all write tools return `423 LOCKED`. Poll `crm_ping` or wait for operator reactivation before resuming write actions.
