import crypto from 'crypto';
import { db } from './db';
import { supabaseServer } from './supabaseServer';
import { Client, Engagement } from '../types/crm';

export interface WebsiteIntakeBody {
  source?: string;
  session_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  summary?: string;
  intent?: string;
  budget_hint?: string;
  page_url?: string;
  consent?: boolean;
  transcript?: any;
  honeypot?: string;
}

export interface WebsiteIntakeResult {
  status: number;
  data?: {
    client_id: string;
    code: string;
    stage: string;
    engagement_id: string;
  };
  error?: string;
}

export async function processWebsiteIntake(body: WebsiteIntakeBody): Promise<WebsiteIntakeResult> {
  try {
    // 1. Return 400 if honeypot is not empty string
    if (body.honeypot !== undefined && body.honeypot !== null && String(body.honeypot).trim() !== '') {
      return { status: 400, error: 'Honeypot field must be empty string' };
    }

    // 2. Return 400 if consent is not true
    if (body.consent !== true) {
      return { status: 400, error: 'Consent must be true' };
    }

    // 3. Return 400 if both email and phone are missing
    const cleanEmail = body.email ? String(body.email).trim().toLowerCase() : '';
    const cleanPhone = body.phone ? String(body.phone).trim() : '';

    if (!cleanEmail && !cleanPhone) {
      return { status: 400, error: 'Both email and phone are missing. At least one is required.' };
    }

    const data = db.get();

    // 4. Deduplicate: search clients table for existing email or phone match
    let existingClient = data.clients.find((c) => {
      const matchingContact = (data.contacts || []).find((cnt) => {
        if (cnt.client_id !== c.id) return false;
        if (cleanEmail && cnt.email && cnt.email.trim().toLowerCase() === cleanEmail) return true;
        if (cleanPhone && cnt.phone && cnt.phone.trim() === cleanPhone) return true;
        if (cleanPhone && cnt.whatsapp && cnt.whatsapp.trim() === cleanPhone) return true;
        return false;
      });
      if (matchingContact) return true;
      if (cleanEmail && c.custom?.email && String(c.custom.email).trim().toLowerCase() === cleanEmail) return true;
      if (cleanPhone && c.custom?.phone && String(c.custom.phone).trim() === cleanPhone) return true;
      return false;
    });

    let clientId: string;
    let clientCode: string;

    if (existingClient) {
      clientId = existingClient.id;
      clientCode = existingClient.client_code;
      if (body.company && !existingClient.custom?.company) {
        existingClient.custom = { ...(existingClient.custom || {}), company: body.company };
      }
    } else {
      clientId = `cli_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      clientCode = db.nextClientCode();

      const newClient: Client = {
        id: clientId,
        client_code: clientCode,
        name: (body.name || body.company || (cleanEmail ? cleanEmail.split('@')[0] : 'Website Lead')).trim(),
        type: body.company ? 'company' : 'individual',
        industry: '',
        website: body.page_url || '',
        country: 'South Africa',
        timezone: 'Africa/Johannesburg',
        source: 'website',
        source_detail: body.source || 'website',
        owner_actor: 'Desmond',
        health_score: 50,
        health_reasons: ['Initial creation via Website Intake (+50)'],
        tags: ['website-lead', body.intent || 'inbound'].filter(Boolean),
        custom: {
          email: cleanEmail,
          phone: cleanPhone,
          company: body.company || '',
          intent: body.intent || '',
          budget_hint: body.budget_hint || '',
          page_url: body.page_url || '',
          transcript: body.transcript || null,
        },
        notes: body.summary || '',
        archived_at: null,
        created_by_actor: 'coreiq-website',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      data.clients.push(newClient);

      // Create primary contact so deduplication finds them later
      data.contacts.push({
        id: `cnt_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        client_id: clientId,
        full_name: (body.name || body.company || 'Primary Contact').trim(),
        email: cleanEmail,
        phone: cleanPhone,
        whatsapp: cleanPhone,
        role_title: 'Lead / Decision Maker',
        is_primary: true,
        preferred_channel: cleanEmail ? 'email' : 'phone',
        custom: {},
        created_at: new Date().toISOString(),
      });
    }

    // 5. Find or create an engagement for this session_id at stage Outreach
    const outreachStage = (data.pipeline_stages || []).find(
      (s) => s.key?.toLowerCase() === 'outreach' || s.name?.toLowerCase() === 'outreach'
    ) || data.pipeline_stages[0];

    let engagement: Engagement | undefined;
    if (body.session_id) {
      engagement = (data.engagements || []).find(
        (e) => (e.custom?.session_id === body.session_id || (e as any).session_id === body.session_id) && !e.archived_at
      );
    }

    if (!engagement) {
      const engCode = db.nextEngagementCode();
      const engId = `eng_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      engagement = {
        id: engId,
        engagement_code: engCode,
        client_id: clientId,
        title: `${(body.name || body.company || 'Website Lead').trim()} — Inbound Journey`,
        categories: [body.intent || 'General'],
        stage_id: outreachStage.id,
        stage_entered_at: new Date().toISOString(),
        value_estimate: body.budget_hint ? Number(String(body.budget_hint).replace(/[^0-9]/g, '')) || 15000 : 15000,
        currency: 'ZAR',
        expected_close: null,
        owner_actor: 'Desmond',
        is_sampling: false,
        outcome: null,
        lost_reason: null,
        custom: {
          session_id: body.session_id || null,
          intent: body.intent || null,
          budget_hint: body.budget_hint || null,
          page_url: body.page_url || null,
        },
        archived_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      data.engagements.push(engagement);
    }

    // 6. Insert one activity: type="intake", summary=first 200 chars of body.summary, actor_type="service", actor_name="coreiq-website"
    const summaryText = body.summary
      ? String(body.summary).substring(0, 200)
      : 'New website lead intake';

    data.activities.push({
      id: `act_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      client_id: clientId,
      engagement_id: engagement.id,
      type: 'intake',
      summary: summaryText,
      body: body.summary || (body.transcript ? JSON.stringify(body.transcript) : 'Inbound website intake'),
      actor_type: 'service',
      actor_name: 'coreiq-website',
      metadata: {
        source: body.source || 'website',
        session_id: body.session_id || null,
        intent: body.intent || null,
        page_url: body.page_url || null,
        budget_hint: body.budget_hint || null,
        email: cleanEmail || null,
        phone: cleanPhone || null,
      },
      occurred_at: new Date().toISOString(),
    });

    // 7. Insert one task: title="Review new website lead", assignee="Desmond", status="open", linked to client_id
    data.tasks.push({
      id: `tsk_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      client_id: clientId,
      engagement_id: engagement.id,
      title: 'Review new website lead',
      description: body.summary
        ? `Lead Summary: ${body.summary}`
        : 'Review inbound website inquiry details and initiate follow-up.',
      due_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      priority: 'high',
      status: 'open',
      assignee_actor: 'Desmond',
      created_by_actor: 'coreiq-website',
      source: 'playbook',
      created_at: new Date().toISOString(),
    });

    db.save();

    // If Supabase is connected, mirror the records so Supabase stays synchronized
    if (supabaseServer) {
      try {
        if (!existingClient) {
          await supabaseServer.from('clients').insert({
            client_code: clientCode,
            name: (body.name || body.company || (cleanEmail ? cleanEmail.split('@')[0] : 'Website Lead')).trim(),
            type: body.company ? 'company' : 'individual',
            website: body.page_url || null,
            country: 'South Africa',
            timezone: 'Africa/Johannesburg',
            source: 'website',
            notes: body.summary || null,
            tags: ['website-lead', body.intent || 'inbound'].filter(Boolean),
            health_score: 50,
          });
        }
      } catch (sbErr) {
        console.warn('Supabase mirror error during intake:', sbErr);
      }
    }

    // 8. Return: { client_id, code, stage, engagement_id }
    return {
      status: 200,
      data: {
        client_id: clientId,
        code: clientCode,
        stage: outreachStage.name,
        engagement_id: engagement.id,
      },
    };
  } catch (err: any) {
    return {
      status: 500,
      error: err.message || 'Internal server error processing intake',
    };
  }
}

/**
 * Dispatches an outbox intake row to the CRM intake endpoint.
 * Uses the CRM_INTAKE_KEY environment variable from process.env, not a hardcoded key lookup by actor_name.
 */
export async function sendOutboxRow(
  payload: WebsiteIntakeBody,
  targetUrl?: string
): Promise<{ success: boolean; status?: number; data?: any; error?: string }> {
  const apiKey = process.env.CRM_INTAKE_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'CRM_INTAKE_KEY environment variable is not configured in process.env',
    };
  }

  const endpoint = targetUrl || `http://127.0.0.1:${process.env.PORT || 3000}/api/v1/intake`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let responseData: any = null;
    try {
      responseData = JSON.parse(text);
    } catch {
      responseData = text;
    }

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: (responseData && (responseData.error || responseData.message)) || `HTTP ${res.status}: ${text}`,
        data: responseData,
      };
    }

    return {
      success: true,
      status: res.status,
      data: responseData,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to dispatch outbox row to CRM intake',
    };
  }
}
