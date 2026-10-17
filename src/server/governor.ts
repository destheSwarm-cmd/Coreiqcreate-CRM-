import { GoogleGenAI } from '@google/genai';
import { db } from './db';
import { AiRun, Client, Engagement, RequestItem, QuestionnaireResponse, Product } from '../types/crm';

export interface GovernorConfig {
  provider: 'gemini' | 'openai_compatible' | 'algorithmic_fallback';
  modelName: string;
  baseUrl?: string;
  autonomyLevel: 0 | 1 | 2; // 0: suggest only, 1: draft, 2: act
}

export class GovernorService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (apiKey) {
      try {
        this.ai = new GoogleGenAI({ apiKey });
      } catch (e) {
        console.warn('GoogleGenAI init failed, falling back to heuristic engine:', e);
      }
    }
  }

  private logAiRun(job: string, entityRef: string, inputSummary: string, output: string, model: string): AiRun {
    const run: AiRun = {
      id: `airun_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      job,
      entity_ref: entityRef,
      input_summary: inputSummary,
      output,
      model,
      status: 'completed',
      created_at: new Date().toISOString(),
    };
    const data = db.get();
    data.ai_runs.push(run);
    db.logAudit({
      actor_type: 'ai',
      actor_name: `Governor (${model})`,
      api_key_id: null,
      action: `ai.${job}`,
      entity_type: job.split('_')[0] || 'crm',
      entity_id: entityRef,
      before: null,
      after: { job, inputSummary },
      request_id: run.id,
      idempotency_key: null,
    });
    db.save();
    return run;
  }

  // Job 1: Summarize Client Card
  public async summarizeClientCard(client: Client, engagement?: Engagement, requests: RequestItem[] = []): Promise<string> {
    const prompt = `Client: ${client.name} (${client.client_code})
Industry: ${client.industry}
Notes: ${client.notes}
Active Engagement: ${engagement ? `${engagement.title} [Stage: ${engagement.stage_id}]` : 'None'}
Scope Requests: ${requests.map((r) => `- ${r.title}: ${r.description}`).join('\n')}

Instructions: Provide a concise 2-sentence operator briefing focusing strictly on facts present in this record. No hype or marketing fluff.`;

    let summaryText = '';
    const model = 'gemini-2.5-flash';

    if (this.ai) {
      try {
        const resp = await this.ai.models.generateContent({
          model,
          contents: prompt,
        });
        summaryText = resp.text || '';
      } catch (err) {
        console.warn('Gemini generateContent error, using heuristic summary:', err);
      }
    }

    if (!summaryText) {
      // Deterministic factual fallback
      summaryText = `${client.name} operates in ${client.industry || 'general industry'}. Currently active on ${engagement ? engagement.title : 'pipeline evaluation'} with ${requests.length} scoped request(s) logged by operators.`;
    }

    this.logAiRun('summarize_client', client.id, `Client ${client.name}`, summaryText, model);
    return summaryText;
  }

  // Job 2: Generate Questionnaire Questions
  public async generateQuestionnaire(client: Client, engagement: Engagement, requests: RequestItem[]): Promise<any[]> {
    const inputSummary = `Client: ${client.name}, Categories: ${engagement.categories.join(', ')}`;
    const questions = [
      {
        id: 'q_gen_1',
        label: `What specific operational bottleneck within ${client.name}'s ${engagement.categories.join('/')} workflows is costing the most time?`,
        type: 'long_text',
        required: true,
      },
      {
        id: 'q_gen_2',
        label: `What external tools or APIs (e.g., ERP, messaging, databases) must connect to this build?`,
        type: 'short_text',
        required: true,
      },
      {
        id: 'q_gen_3',
        label: 'What does a successful day-1 deployment look like for your operators?',
        type: 'long_text',
        required: true,
      },
      {
        id: 'q_gen_4',
        label: 'What is your target launch date or sprint milestone?',
        type: 'date',
        required: false,
      },
    ];

    this.logAiRun('generate_questionnaire', engagement.id, inputSummary, JSON.stringify(questions), 'governor-v1');
    return questions;
  }

  // Job 3: Summarize Questionnaire Answers into Requirements Brief
  public async summarizeAnswersIntoBrief(client: Client, answers: Record<string, any>): Promise<string> {
    const entries = Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join('\n');
    const brief = `### Synthesized Discovery Brief for ${client.name}
**Key Problem**: ${answers['q1'] || answers['q2'] || 'Manual coordination delays'}
**Target Systems**: ${answers['q4'] || 'Current team software'}
**Success Criteria**: ${answers['q8'] || answers['q2'] || 'Demonstrated operational throughput'}
**Budget Range**: ${answers['q7'] || 'Standard tier'}
**Target Timeline**: ${answers['q6'] || 'Next monthly sprint'}`;

    this.logAiRun('summarize_brief', client.id, `Answers count: ${Object.keys(answers).length}`, brief, 'governor-v1');
    return brief;
  }

  // Job 4: Draft Email
  public async draftEmail(type: 'followup' | 'quote' | 'upsell', client: Client, details: Record<string, any>): Promise<{ subject: string; body: string }> {
    let subject = '';
    let body = '';

    if (type === 'followup') {
      subject = `CoreIQ — Following up on ${details.topic || 'our next step'}`;
      body = `Hi ${details.contact_name || 'there'},\n\nTouching base regarding ${details.topic || 'your project'}. We are ready to proceed with your sample deployment.\n\nLet us know if you have any questions.\n\nRegards,\nDesmond · CoreIQ Create`;
    } else if (type === 'quote') {
      subject = `CoreIQ Commercial Proposal: ${details.quote_code || 'Quote'}`;
      body = `Hi ${details.contact_name || 'there'},\n\nYour proposal and build scope are prepared. Total is ${details.amount || 'R0'} ${details.currency || 'ZAR'}.\n\nYou can review line items and confirm online here: ${details.quote_url || ''}\n\nBest regards,\nDesmond`;
    } else {
      subject = `CoreIQ — Solution extension for ${client.name}`;
      body = `Hi ${details.contact_name || 'there'},\n\nNow that your initial build is live, adding ${details.related_module || 'the next module'} would automate your remaining manual steps.\n\nHappy to share a quick spec whenever convenient.\n\nRegards,\nDesmond`;
    }

    this.logAiRun('draft_email', client.id, `Type: ${type}`, `${subject}\n\n${body}`, 'governor-v1');
    return { subject, body };
  }

  // Job 5: Nightly Pipeline Review & Next Best Actions
  public runNightlyPipelineReview(): { createdNbaCount: number } {
    const data = db.get();
    let count = 0;
    const now = new Date();

    for (const eng of data.engagements.filter((e) => !e.archived_at && e.outcome === null)) {
      const stage = data.pipeline_stages.find((s) => s.id === eng.stage_id);
      if (!stage) continue;

      // Check SLA overrun
      const enteredAt = new Date(eng.stage_entered_at);
      const daysInStage = Math.floor((now.getTime() - enteredAt.getTime()) / (1000 * 3600 * 24));
      if (stage.sla_days > 0 && daysInStage > stage.sla_days) {
        const existing = data.nba_items.find((n) => n.engagement_id === eng.id && n.action_type === 'sla_overrun' && n.status === 'open');
        if (!existing) {
          data.nba_items.push({
            id: `nba_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            client_id: eng.client_id,
            engagement_id: eng.id,
            playbook_id: 'pb_stale_sla',
            source: 'rule',
            title: `SLA Alert: ${daysInStage}d in ${stage.name} (SLA: ${stage.sla_days}d)`,
            reason: `Exceeded stage timeline by ${daysInStage - stage.sla_days} day(s). Follow up or unblock.`,
            action_type: 'sla_overrun',
            action_payload: { daysOver: daysInStage - stage.sla_days },
            status: 'open',
            created_at: now.toISOString(),
          });
          count++;
        }
      }
    }

    db.save();
    return { createdNbaCount: count };
  }
}

export const governor = new GovernorService();
