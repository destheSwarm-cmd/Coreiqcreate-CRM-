import React from 'react';
import {
  PipelineStage,
  Engagement,
  Client,
  Quote,
  Activity,
  Task,
  Deliverable,
  Asset,
  AssetUsage,
  SamplingCost,
  NbaItem,
  CrmSettings,
  Invoice,
  Retainer,
} from '../types/crm';
import {
  LayoutDashboard,
  TrendingUp,
  Clock,
  Sparkles,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Users,
  DollarSign,
  Activity as ActivityIcon,
  Filter,
  ShieldAlert,
  FileCheck,
  Repeat,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface DashboardViewProps {
  stages: PipelineStage[];
  engagements: Engagement[];
  clients: Client[];
  quotes: Quote[];
  activities: Activity[];
  tasks: Task[];
  deliverables: Deliverable[];
  assets: Asset[];
  assetUsage: AssetUsage[];
  samplingCosts: SamplingCost[];
  nbaItems: NbaItem[];
  settings: CrmSettings;
  unpricedCount: number;
  invoices?: Invoice[];
  retainers?: Retainer[];
  agentsPaused?: boolean;
  onSelectClient: (clientId: string) => void;
  onExecuteNba: (nba: NbaItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stages,
  engagements,
  clients,
  quotes,
  activities,
  tasks,
  deliverables,
  assets,
  assetUsage,
  samplingCosts,
  nbaItems,
  settings,
  unpricedCount,
  invoices = [],
  retainers = [],
  agentsPaused = false,
  onSelectClient,
  onExecuteNba,
}) => {
  const activeEngs = engagements.filter((e) => !e.archived_at);
  const wonEngs = engagements.filter((e) => e.outcome === 'won');
  const wonRevenue = wonEngs.reduce((acc, e) => acc + (e.value_estimate || 0), 0);

  // Financial Metrics
  const outstandingInvoicedTotal = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'void')
    .reduce((acc, i) => acc + (i.amount_due ?? i.total ?? 0), 0);

  const currentMonth = new Date().toISOString().substring(0, 7);
  const paidThisMonth = invoices
    .filter((i) => i.status === 'paid' && (i.updated_at || i.created_at).startsWith(currentMonth))
    .reduce((acc, i) => acc + (i.total || 0), 0);

  const nowStr = new Date().toISOString().split('T')[0];
  const overdueCount = invoices.filter(
    (i) => i.status !== 'paid' && i.status !== 'void' && i.due_date && i.due_date < nowStr
  ).length;

  const retainersDueCount = retainers.filter(
    (r) => r.status === 'active' && r.next_invoice_date && r.next_invoice_date <= nowStr
  ).length;

  const quotesAwaitingReply = quotes.filter((q) => q.status === 'sent').length;

  // Agent activity last 24h
  const oneDayAgo = Date.now() - 24 * 3600 * 1000;
  const recentActivities = activities.filter(
    (a) => new Date(a.occurred_at).getTime() >= oneDayAgo
  );
  const agentActivity24hCount = recentActivities.filter(
    (a) => a.actor_type === 'agent' || a.actor_type === 'ai' || a.actor_type === 'system'
  ).length;

  // Human Needs: tasks marked high priority, BUILD_NEEDED, DECISION, PROBLEM
  const needsYouTasks = tasks.filter(
    (t) =>
      t.status === 'open' &&
      (t.priority === 'high' ||
        t.title.includes('BUILD_NEEDED') ||
        t.title.includes('DECISION') ||
        t.title.includes('PROBLEM') ||
        t.description?.includes('BUILD_NEEDED'))
  );

  // Needs Attention: follow-ups due or stale engagements (> SLA)
  const staleEngs = activeEngs.filter((eng) => {
    const stage = stages.find((s) => s.id === eng.stage_id);
    if (!stage || stage.sla_days === 0) return false;
    const daysInStage = Math.floor(
      (Date.now() - new Date(eng.stage_entered_at).getTime()) / (1000 * 3600 * 24)
    );
    return daysInStage > stage.sla_days;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#04091A] text-slate-100 space-y-5 pb-24">
      {/* 1. AGENTS PAUSED STATE BANNER */}
      {agentsPaused && (
        <div className="p-3.5 bg-amber-950/80 border border-amber-600 rounded-xl flex items-center justify-between text-xs text-amber-200 shadow-md">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-amber-300">Agents are Paused</p>
              <p className="text-[11px] text-amber-400/90 mt-0.5">
                Autonomous agent mutating tools return 423 LOCKED. Reads, crm_ping, and intake lead capture remain active.
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-900 border border-amber-500 uppercase">
            PAUSED
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-cyan-400" />
            <span>Operator Executive Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time pipeline velocity, commercial health, and pending agent-to-human escalations
          </p>
        </div>
      </div>

      {/* 2. EXECUTIVE METRICS GRID (Requirement A2) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-[#081126] border border-[#162445] rounded-xl space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Outstanding Invoiced</div>
          <div className="text-base font-bold text-amber-400 font-mono">
            R {outstandingInvoicedTotal.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500">{overdueCount} overdue</div>
        </div>

        <div className="p-3.5 bg-[#081126] border border-[#162445] rounded-xl space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Paid This Month</div>
          <div className="text-base font-bold text-emerald-400 font-mono">
            R {paidThisMonth.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500">Collected in {currentMonth}</div>
        </div>

        <div className="p-3.5 bg-[#081126] border border-[#162445] rounded-xl space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Retainers Due</div>
          <div className="text-base font-bold text-white font-mono">{retainersDueCount}</div>
          <div className="text-[10px] text-slate-500">Recurring cycles</div>
        </div>

        <div className="p-3.5 bg-[#081126] border border-[#162445] rounded-xl space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Quotes Awaiting Reply</div>
          <div className="text-base font-bold text-cyan-300 font-mono">{quotesAwaitingReply}</div>
          <div className="text-[10px] text-slate-500">Sent to clients</div>
        </div>

        <div className="p-3.5 bg-[#081126] border border-[#162445] rounded-xl space-y-1 col-span-2 lg:col-span-1">
          <div className="text-[11px] text-slate-400 font-medium">Agent Runs (24h)</div>
          <div className="text-base font-bold text-purple-400 font-mono">{agentActivity24hCount}</div>
          <div className="text-[10px] text-slate-500">{recentActivities.length} total events</div>
        </div>
      </div>

      {/* 3. "NEEDS YOU" & "NEEDS ATTENTION" PRIORITY SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Widget: Needs You (BUILD_NEEDED, Human Decisions, Urgent Blocks) */}
        <div className="p-4 bg-[#081126] border border-[#162445] rounded-xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#162445] pb-2.5">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-white">
                Needs You (Operator Actions)
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-950 text-orange-300 border border-orange-800">
              {needsYouTasks.length} PENDING
            </span>
          </div>

          <div className="space-y-2">
            {needsYouTasks.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs italic bg-[#0a1329] rounded-lg border border-[#162445]">
                ✓ All human operator action items resolved. No pending build escalations.
              </div>
            ) : (
              needsYouTasks.map((t) => {
                const client = clients.find((c) => c.id === t.client_id);
                const isBuild = t.title.includes('BUILD_NEEDED');
                return (
                  <div
                    key={t.id}
                    className="p-3 bg-[#0d1a38] border border-[#1e325c] hover:border-orange-500/50 rounded-lg flex items-center justify-between gap-3 text-xs transition-all"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold text-[10px] px-1.5 py-0.2 rounded uppercase ${
                            isBuild
                              ? 'bg-orange-950 text-orange-300 border border-orange-700'
                              : 'bg-red-950 text-red-300 border border-red-800'
                          }`}
                        >
                          {isBuild ? 'BUILD_NEEDED' : 'DECISION'}
                        </span>
                        <span className="font-bold text-white truncate">{t.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Client: <strong className="text-slate-200">{client?.name || 'Unassigned'}</strong>
                        {t.due_at && ` · Due: ${t.due_at.split('T')[0]}`}
                      </div>
                    </div>

                    {client && (
                      <button
                        onClick={() => onSelectClient(client.id)}
                        className="px-2.5 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded text-xs shrink-0 font-medium"
                      >
                        Inspect
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Widget: Needs Attention (Follow-ups Due & SLA Exceeded) */}
        <div className="p-4 bg-[#081126] border border-[#162445] rounded-xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#162445] pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-white">
                Needs Attention (Follow-ups & SLA)
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
              {staleEngs.length} STALE
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {staleEngs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs italic bg-[#0a1329] rounded-lg border border-[#162445]">
                ✓ Zero deals exceeding SLA targets. Pipeline velocity is healthy.
              </div>
            ) : (
              staleEngs.map((eng) => {
                const client = clients.find((c) => c.id === eng.client_id);
                const stage = stages.find((s) => s.id === eng.stage_id);
                const daysIn = Math.floor(
                  (Date.now() - new Date(eng.stage_entered_at).getTime()) / (1000 * 3600 * 24)
                );

                return (
                  <div
                    key={eng.id}
                    className="p-3 bg-[#0d1a38] border border-amber-900/50 hover:border-amber-500 rounded-lg flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-100">{client?.name || 'Client'}</div>
                      <div className="text-[11px] text-slate-400">
                        Stage: <strong>{stage?.name}</strong> (Target: {stage?.sla_days}d SLA)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-amber-400">{daysIn}d in stage</div>
                      {client && (
                        <button
                          onClick={() => onSelectClient(client.id)}
                          className="text-[11px] text-cyan-400 hover:underline mt-0.5"
                        >
                          View card →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. RECENT AGENT ACTIVITY STREAM */}
      <div className="p-4 bg-[#081126] border border-[#162445] rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#162445] pb-2">
          <h2 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
            <ActivityIcon className="w-4 h-4 text-cyan-400" />
            <span>Agent Activity (Last 24 Hours)</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            {recentActivities.length} total events logged
          </span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {recentActivities.slice(0, 6).map((act) => (
            <div key={act.id} className="p-2.5 bg-[#0a1329] border border-[#162445] rounded-lg text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">{act.summary}</span>
                <span className="font-mono text-[10px] text-cyan-400">
                  {act.actor_name} ({act.actor_type})
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {new Date(act.occurred_at).toLocaleString()}
              </div>
            </div>
          ))}
          {recentActivities.length === 0 && (
            <div className="text-center py-4 text-slate-500 text-xs italic">
              No autonomous agent executions logged in the last 24 hours.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
