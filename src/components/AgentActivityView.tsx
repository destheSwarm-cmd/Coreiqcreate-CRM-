import React, { useState, useEffect } from 'react';
import { AuditLogEntry } from '../types/crm';
import { Bot, Search, Filter, AlertCircle, CheckCircle2, RefreshCw, Clock } from 'lucide-react';

interface AgentActivityViewProps {
  sessionToken: string;
}

export const AgentActivityView: React.FC<AgentActivityViewProps> = ({ sessionToken }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [filterErrorsOnly, setFilterErrorsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [sessionToken]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/db/state', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (resp.ok) {
        const json = await resp.json();
        const auditList: AuditLogEntry[] = json.data?.audit_log || [];
        setLogs([...auditList].reverse());
      }
    } catch (e) {
      console.warn('Failed to fetch audit log:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let result = [...logs];

    if (selectedAgent !== 'all') {
      result = result.filter(
        (l) => l.actor_name.toLowerCase().includes(selectedAgent.toLowerCase()) || l.actor_type === selectedAgent
      );
    }

    if (filterErrorsOnly) {
      result = result.filter(
        (l) => l.action.includes('error') || l.action.includes('fail') || (l as any).status === 'error'
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.entity_type.toLowerCase().includes(q) ||
          l.actor_name.toLowerCase().includes(q) ||
          l.entity_id?.toLowerCase().includes(q)
      );
    }

    setFilteredLogs(result);
  }, [logs, selectedAgent, filterErrorsOnly, searchQuery]);

  const uniqueActors = Array.from(new Set(logs.map((l) => l.actor_name))).filter(Boolean);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#04091A] text-slate-100 overflow-hidden">
      {/* Header & Filters */}
      <div className="p-4 bg-[#081126] border-b border-[#162445] shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-950 border border-cyan-800 rounded-lg text-cyan-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Agent Activity & Audit Feed</h1>
              <p className="text-[11px] text-slate-400">
                Live immutable audit log of AI agents, tool executions, and state mutations
              </p>
            </div>
          </div>

          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="p-2 bg-[#0d1a38] hover:bg-[#122247] border border-[#1e325c] rounded-lg text-slate-300 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, entity, or actor..."
              className="w-full bg-[#0d1a38] text-xs text-white placeholder-slate-500 rounded border border-[#1e325c] pl-9 pr-3 py-2 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="bg-[#0d1a38] text-xs text-slate-200 border border-[#1e325c] rounded p-2 focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Actors</option>
              {uniqueActors.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </select>

            <button
              onClick={() => setFilterErrorsOnly(!filterErrorsOnly)}
              className={`px-3 py-2 rounded text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                filterErrorsOnly
                  ? 'bg-red-950 text-red-300 border-red-800'
                  : 'bg-[#0d1a38] text-slate-400 border-[#1e325c] hover:text-slate-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Errors Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Table / Cards */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5 pb-24">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center bg-[#081126] border border-[#162445] rounded-xl text-slate-400 text-xs">
            No audit records match the current filter.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isError = log.action.includes('error') || log.action.includes('fail');
            return (
              <div
                key={log.id}
                className="p-3.5 bg-[#081126] border border-[#162445] hover:border-[#1e325c] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-cyan-400 text-[11px] bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      entity: <span className="text-white font-semibold">{log.entity_type}</span>
                    </span>
                    {log.entity_id && (
                      <span className="text-slate-500 font-mono text-[10px]">
                        id: {log.entity_id.substring(0, 18)}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-300 flex items-center gap-2 pt-0.5">
                    <span className="font-semibold text-white">{log.actor_name}</span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase bg-slate-800 px-1.5 py-0.2 rounded">
                      {log.actor_type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-slate-400 font-mono text-[11px]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(log.at).toLocaleString()}</span>
                  </div>
                  {isError ? (
                    <span className="text-red-400 flex items-center gap-1 font-bold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>FAILED</span>
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>OK</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
