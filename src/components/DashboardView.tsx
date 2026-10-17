import React, { useState } from 'react';
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
  onSelectClient,
  onExecuteNba,
}) => {
  const activeEngs = engagements.filter((e) => !e.archived_at);
  const wonEngs = engagements.filter((e) => e.outcome === 'won');
  const wonRevenue = wonEngs.reduce((acc, e) => acc + (e.value_estimate || 0), 0);

  // Sampling Metrics
  const sampleEngs = engagements.filter((e) => e.is_sampling);
  const wonSampled = wonEngs.filter((e) => e.is_sampling);
  const samplingToPaidConversion =
    sampleEngs.length > 0 ? Math.round((wonSampled.length / sampleEngs.length) * 100) : 0;

  const totalSamplingHours = samplingCosts.reduce((acc, c) => acc + c.hours, 0);
  const totalSamplingCost = samplingCosts.reduce((acc, c) => acc + c.hours * c.hourly_rate, 0);
  const samplingRoiMultiple =
    totalSamplingCost > 0 ? Math.round((wonRevenue / totalSamplingCost) * 10) / 10 : 0;

  // Quotes Win Rate
  const totalQuotes = quotes.length;
  const acceptedQuotes = quotes.filter((q) => q.status === 'accepted').length;
  const quoteWinRate = totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;

  // Stale Engagements (> SLA)
  const staleEngs = activeEngs.filter((eng) => {
    const stage = stages.find((s) => s.id === eng.stage_id);
    if (!stage || stage.sla_days === 0) return false;
    const daysInStage = Math.floor(
      (Date.now() - new Date(eng.stage_entered_at).getTime()) / (1000 * 3600 * 24)
    );
    return daysInStage > stage.sla_days;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#04091A] text-slate-100 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-cyan-400" />
            <span>Executive Operator Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real metrics computed from database activity and sampling records. Zero placeholder numbers.
          </p>
        </div>
      </div>

      {/* KPI STAT STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-[#081126] border border-[#162445] rounded-lg">
          <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">Won Revenue</div>
          <div className="text-xl font-bold font-mono text-white">
            {wonRevenue.toLocaleString()} {settings.currency}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{wonEngs.length} closed won engagement(s)</div>
        </div>

        <div className="p-4 bg-[#081126] border border-[#162445] rounded-lg">
          <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">Sampling ROI Multiple</div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {samplingRoiMultiple > 0 ? `${samplingRoiMultiple}x` : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{totalSamplingHours}h invested across prototypes</div>
        </div>

        <div className="p-4 bg-[#081126] border border-[#162445] rounded-lg">
          <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">Sample-to-Paid Win Rate</div>
          <div className="text-xl font-bold font-mono text-cyan-400">
            {sampleEngs.length > 0 ? `${samplingToPaidConversion}%` : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{wonSampled.length} of {sampleEngs.length} samples converted</div>
        </div>

        <div className="p-4 bg-[#081126] border border-[#162445] rounded-lg">
          <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">Quote Win Rate</div>
          <div className="text-xl font-bold font-mono text-slate-200">
            {totalQuotes > 0 ? `${quoteWinRate}%` : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{acceptedQuotes} of {totalQuotes} quotes accepted</div>
        </div>
      </div>

      {/* TWO-COLUMN EXECUTIVE WIDGETS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 1: Today's Next Best Actions Feed */}
        <div className="p-4 bg-[#081126] border border-[#162445] rounded-lg space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#162445] pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Next Best Action (NBA) Feed</span>
            </h3>
            <span className="font-mono text-[10px] text-cyan-400">{nbaItems.length} recommendations</span>
          </div>

          <div className="space-y-2">
            {nbaItems.map((nba) => {
              const client = clients.find((c) => c.id === nba.client_id);
              return (
                <div key={nba.id} className="p-3 bg-[#0a1329] border border-[#162445] rounded space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-100">{nba.title}</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Client: <strong className="text-cyan-300">{client?.name || 'Client'}</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => onExecuteNba(nba)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded"
                    >
                      Execute
                    </button>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{nba.reason}</p>
                </div>
              );
            })}

            {nbaItems.length === 0 && (
              <div className="p-6 text-center text-slate-500 text-xs italic">
                No open Next Best Actions right now. Pipeline is moving according to plan.
              </div>
            )}
          </div>
        </div>

        {/* Widget 2: Stale Engagements Beyond SLA */}
        <div className="p-4 bg-[#081126] border border-[#162445] rounded-lg space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#162445] pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Stale Deals Exceeding Stage SLA ({staleEngs.length})</span>
            </h3>
          </div>

          <div className="space-y-2">
            {staleEngs.map((eng) => {
              const client = clients.find((c) => c.id === eng.client_id);
              const stage = stages.find((s) => s.id === eng.stage_id);
              const daysIn = Math.floor(
                (Date.now() - new Date(eng.stage_entered_at).getTime()) / (1000 * 3600 * 24)
              );

              return (
                <div
                  key={eng.id}
                  onClick={() => client && onSelectClient(client.id)}
                  className="p-3 bg-[#0a1329] border border-red-900/60 rounded cursor-pointer hover:border-red-600 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-100">{client?.name || 'Client'}</div>
                    <div className="text-[11px] text-slate-400">
                      Stage: <strong>{stage?.name}</strong> · SLA: {stage?.sla_days}d
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-red-400">{daysIn} days in stage</span>
                  </div>
                </div>
              );
            })}

            {staleEngs.length === 0 && (
              <div className="p-6 text-center text-slate-500 text-xs italic">
                Zero stale engagements. All active journeys are within SLA targets.
              </div>
            )}
          </div>
        </div>

        {/* Widget 3: Live Agent & Operator Activity Stream */}
        <div className="p-4 bg-[#081126] border border-[#162445] rounded-lg space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#162445] pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <ActivityIcon className="w-4 h-4 text-cyan-400" />
              <span>Live Timeline Stream (Attributed)</span>
            </h3>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activities.slice(0, 8).map((act) => (
              <div key={act.id} className="p-2.5 bg-[#0a1329] border border-[#162445] rounded text-xs">
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
          </div>
        </div>

        {/* Widget 4: Software Re-use & Capacity Overview */}
        <div className="p-4 bg-[#081126] border border-[#162445] rounded-lg space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#162445] pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-emerald-400" />
              <span>Asset Library & Team Capacity</span>
            </h3>
            <span className="font-mono text-xs text-slate-400">
              Capacity: {settings.weekly_build_hours}h/week
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {assets.slice(0, 4).map((ast) => {
              const usages = assetUsage.filter((u) => u.asset_id === ast.id);
              const saved = usages.reduce((acc, u) => acc + u.hours_saved, 0);

              return (
                <div key={ast.id} className="p-2.5 bg-[#0a1329] border border-[#162445] rounded flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200">{ast.name}</span>
                    <span className="font-mono text-[10px] text-slate-500 ml-2">({ast.kind})</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-semibold">{saved}h saved</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
