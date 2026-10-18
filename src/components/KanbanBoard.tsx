import React, { useState } from 'react';
import {
  PipelineStage,
  Engagement,
  Client,
  Task,
  CrmSettings,
} from '../types/crm';
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  Filter,
  Layers,
  Search,
  CheckCircle2,
  DollarSign,
  ChevronDown,
  User,
  Tag,
  Plus,
} from 'lucide-react';

interface KanbanBoardProps {
  stages: PipelineStage[];
  engagements: Engagement[];
  clients: Client[];
  tasks: Task[];
  settings: CrmSettings;
  onSelectClient: (clientId: string) => void;
  onMoveEngagement: (engagementId: string, toStageId: string, reason: string) => void;
  onNewClient: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  stages,
  engagements,
  clients,
  tasks,
  settings,
  onSelectClient,
  onMoveEngagement,
  onNewClient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [swimlaneMode, setSwimlaneMode] = useState<'none' | 'category' | 'owner'>('none');
  const [draggedEngId, setDraggedEngId] = useState<string | null>(null);
  const [moveSheet, setMoveSheet] = useState<{
    open: boolean;
    engagementId: string;
    toStageId: string;
    reason: string;
  }>({
    open: false,
    engagementId: '',
    toStageId: '',
    reason: '',
  });

  const activeEngagements = engagements.filter(
    (e) => !e.archived_at && e.client_id !== 'cli_sample_1'
  );

  const filteredEngagements = activeEngagements.filter((e) => {
    const client = clients.find((c) => c.id === e.client_id && !c.is_sample && c.id !== 'cli_sample_1');
    if (!client) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(q) ||
      client.client_code.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.categories.some((c) => c.toLowerCase().includes(q))
    );
  });

  // Calculate totals
  const totalPipelineValue = filteredEngagements.reduce((acc, e) => acc + (e.value_estimate || 0), 0);
  const totalWeightedValue = stages.reduce((acc, stg) => {
    const stageEngs = filteredEngagements.filter((e) => e.stage_id === stg.id);
    const sum = stageEngs.reduce((s, e) => s + (e.value_estimate || 0), 0);
    return acc + Math.round(sum * (stg.probability_pct / 100));
  }, 0);

  const handleDragStart = (e: React.DragEvent, engId: string) => {
    e.dataTransfer.setData('text/plain', engId);
    setDraggedEngId(engId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const engId = e.dataTransfer.getData('text/plain') || draggedEngId;
    if (!engId) return;
    const eng = activeEngagements.find((item) => item.id === engId);
    if (eng && eng.stage_id !== stageId) {
      setMoveSheet({
        open: true,
        engagementId: engId,
        toStageId: stageId,
        reason: 'Moved on Pipeline board',
      });
    }
    setDraggedEngId(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#04091A]">
      {/* Top Filter and Pipeline Metrics Bar */}
      <div className="px-4 py-3 bg-[#081126] border-b border-[#162445] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter pipeline by client, code, category..."
              className="bg-[#0d1a38] text-xs text-slate-100 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded border border-[#1e325c] focus:outline-none focus:border-cyan-500 w-52 sm:w-72"
            />
          </div>

          {/* Swimlane Toggle */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Swimlanes:</span>
            <select
              value={swimlaneMode}
              onChange={(e) => setSwimlaneMode(e.target.value as any)}
              className="bg-[#0d1a38] text-xs text-slate-200 border border-[#1e325c] rounded px-2 py-1 focus:outline-none"
            >
              <option value="none">Standard Stages</option>
              <option value="category">By Primary Category</option>
              <option value="owner">By Owner Node</option>
            </select>
          </div>
        </div>

        {/* Aggregate Pipeline Metrics & New Client CTA */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-500">Pipeline: </span>
              <strong className="text-slate-200">{totalPipelineValue.toLocaleString()} {settings.currency}</strong>
            </div>
            <span>·</span>
            <div>
              <span className="text-slate-500">Weighted: </span>
              <strong className="text-cyan-400">{totalWeightedValue.toLocaleString()} {settings.currency}</strong>
            </div>
            <span>·</span>
            <div>
              <span className="text-slate-500">Active Deals: </span>
              <strong className="text-slate-200">{filteredEngagements.length}</strong>
            </div>
          </div>

          <button
            onClick={onNewClient}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Client</span>
          </button>
        </div>
      </div>

      {/* Kanban Stages Columns Container */}
      <div className="flex-1 overflow-x-auto p-4 flex gap-3.5 items-start">
        {stages.map((stage) => {
          const stageEngs = filteredEngagements.filter((e) => e.stage_id === stage.id);
          const stageTotalVal = stageEngs.reduce((acc, e) => acc + (e.value_estimate || 0), 0);
          const stageWeighted = Math.round(stageTotalVal * (stage.probability_pct / 100));

          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              className="w-72 shrink-0 bg-[#081126] border border-[#162445] rounded-lg flex flex-col max-h-[calc(100vh-140px)] select-none shadow-sm"
            >
              {/* Column Header */}
              <div
                className="px-3 py-2.5 border-b border-[#162445] bg-[#0a142e] rounded-t-lg"
                style={{ borderTop: `3px solid ${stage.color}` }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white">{stage.name}</span>
                    <span className="font-mono text-[11px] text-slate-400 bg-[#050b1a] px-1.5 py-0.2 rounded border border-slate-800">
                      {stageEngs.length}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-cyan-400 font-semibold">
                    {stage.probability_pct}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{stageTotalVal.toLocaleString()} {settings.currency}</span>
                  <span className="text-slate-500">W: {stageWeighted.toLocaleString()}</span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {stageEngs.map((eng) => {
                  const client = clients.find((c) => c.id === eng.client_id);
                  if (!client) return null;

                  const daysInStage = Math.max(
                    0,
                    Math.floor((Date.now() - new Date(eng.stage_entered_at).getTime()) / (1000 * 3600 * 24))
                  );
                  const isOver = stage.sla_days > 0 && daysInStage > stage.sla_days;
                  const isNear = stage.sla_days > 0 && daysInStage >= stage.sla_days * 0.8 && !isOver;

                  const nextTask = tasks.find((t) => t.client_id === client.id && t.status === 'open');

                  return (
                    <div
                      key={eng.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, eng.id)}
                      onClick={() => onSelectClient(client.id)}
                      className="p-3 bg-[#0d1a38] border border-[#1b2f5b] hover:border-cyan-500/80 rounded cursor-pointer transition-all hover:shadow-md group relative"
                    >
                      {/* Card Header: Client Name & Health Dot */}
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <div className="font-bold text-slate-100 text-xs truncate leading-snug group-hover:text-cyan-300">
                          {client.name}
                        </div>
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 mt-1 ${
                            client.health_score >= 80 ? 'bg-emerald-400' : client.health_score >= 50 ? 'bg-amber-400' : 'bg-red-500'
                          }`}
                          title={`Health: ${client.health_score}`}
                        />
                      </div>

                      {/* Code & Categories */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/80 px-1 rounded border border-cyan-800">
                          {client.client_code}
                        </span>
                        {eng.categories.slice(0, 2).map((cat) => (
                          <span
                            key={cat}
                            className="text-[10px] text-slate-300 bg-slate-900 px-1 rounded border border-slate-800"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>

                      {/* Engagement Title */}
                      <div className="text-[11px] text-slate-300 mb-2 truncate">
                        {eng.title}
                      </div>

                      {/* Value and Days in Stage */}
                      <div className="flex items-center justify-between text-[10px] font-mono border-t border-slate-800/80 pt-2 text-slate-400">
                        <span className="font-bold text-slate-200">
                          {eng.value_estimate ? `${eng.value_estimate.toLocaleString()} ${eng.currency}` : 'Unvalued'}
                        </span>
                        <span
                          className={`flex items-center gap-1 font-semibold ${
                            isOver ? 'text-red-400' : isNear ? 'text-amber-400' : 'text-slate-400'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{daysInStage}d {stage.sla_days ? `/ ${stage.sla_days}d` : ''}</span>
                        </span>
                      </div>

                      {/* Next Task Indicator */}
                      {nextTask && (
                        <div className="mt-2 text-[10px] text-slate-300 bg-[#091329] p-1.5 rounded border border-slate-800/60 flex items-center gap-1.5 truncate">
                          <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">{nextTask.title}</span>
                        </div>
                      )}

                      {/* Owner Node attribution */}
                      <div className="mt-1.5 text-[9px] text-slate-500 flex items-center justify-between font-mono">
                        <span>Owner: {eng.owner_actor || 'Desmond'}</span>
                        {eng.is_sampling && <span className="text-amber-400">Sampling</span>}
                      </div>
                    </div>
                  );
                })}

                {stageEngs.length === 0 && (
                  <div className="p-4 text-center text-slate-600 text-xs italic">
                    Drop deals here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MOVE CONFIRMATION SHEET */}
      {moveSheet.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md bg-[#0a1329] border border-cyan-800 rounded-lg p-5 shadow-2xl space-y-4 text-slate-100">
            <h3 className="font-bold text-white text-base">Transition Pipeline Stage</h3>
            <p className="text-xs text-slate-300">
              Advance engagement to stage: <strong>{stages.find((s) => s.id === moveSheet.toStageId)?.name}</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Reason for change <span className="text-red-400">*</span>:
              </label>
              <textarea
                value={moveSheet.reason}
                onChange={(e) => setMoveSheet({ ...moveSheet, reason: e.target.value })}
                rows={3}
                placeholder="Why is this engagement moving to this stage?"
                className="w-full bg-[#070e20] text-xs text-slate-100 border border-slate-700 rounded p-2 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setMoveSheet({ open: false, engagementId: '', toStageId: '', reason: '' })}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={moveSheet.reason.trim().length < 3}
                onClick={() => {
                  onMoveEngagement(moveSheet.engagementId, moveSheet.toStageId, moveSheet.reason);
                  setMoveSheet({ open: false, engagementId: '', toStageId: '', reason: '' });
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded"
              >
                Confirm Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
