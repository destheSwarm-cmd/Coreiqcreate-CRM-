import React, { useState } from 'react';
import { Client, Engagement, PipelineStage } from '../types/crm';
import { Download, Upload, Search, Filter, ArrowUpDown, ChevronDown } from 'lucide-react';

interface TableViewProps {
  clients: Client[];
  engagements: Engagement[];
  stages: PipelineStage[];
  onSelectClient: (clientId: string) => void;
  onImportCsv: (csvContent: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  clients,
  engagements,
  stages,
  onSelectClient,
  onImportCsv,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'client_code' | 'health_score' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvInput, setCsvInput] = useState('');

  const filtered = clients
    .filter((c) => !c.archived_at)
    .filter((c) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.client_code.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      let vA = (a as any)[sortField];
      let vB = (b as any)[sortField];
      if (typeof vA === 'string') vA = vA.toLowerCase();
      if (typeof vB === 'string') vB = vB.toLowerCase();
      if (vA < vB) return sortDirection === 'asc' ? -1 : 1;
      if (vA > vB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const exportCsv = () => {
    const headers = ['client_code', 'name', 'type', 'industry', 'website', 'country', 'health_score', 'owner_actor', 'created_at'];
    const rows = filtered.map((c) => [
      c.client_code,
      `"${c.name.replace(/"/g, '""')}"`,
      c.type,
      `"${c.industry.replace(/"/g, '""')}"`,
      c.website,
      c.country,
      c.health_score,
      c.owner_actor,
      c.created_at,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `coreiq_clients_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportSubmit = () => {
    if (!csvInput.trim()) return;
    onImportCsv(csvInput);
    setCsvInput('');
    setShowImportModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#04091A] text-slate-100 space-y-4">
      {/* Header and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search records by name, code, tag..."
            className="w-full bg-[#081126] text-xs text-slate-200 border border-[#162445] rounded pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-[#081126] border border-[#162445] rounded hover:bg-[#0c1836]"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-[#081126] border border-[#162445] rounded hover:bg-[#0c1836]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="bg-[#081126] border border-[#162445] rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#162445] bg-[#0a142e] text-slate-400 font-mono text-[10px] uppercase">
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => setSortField('client_code')}>
                Code
              </th>
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => setSortField('name')}>
                Client Name
              </th>
              <th className="py-2.5 px-3">Industry</th>
              <th className="py-2.5 px-3">Active Journey</th>
              <th className="py-2.5 px-3 text-center cursor-pointer" onClick={() => setSortField('health_score')}>
                Health
              </th>
              <th className="py-2.5 px-3">Owner</th>
              <th className="py-2.5 px-3 text-right">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#162445]/60">
            {filtered.map((client) => {
              const eng = engagements.find((e) => e.client_id === client.id && !e.archived_at);
              const stage = stages.find((s) => s.id === eng?.stage_id);

              return (
                <tr
                  key={client.id}
                  onClick={() => onSelectClient(client.id)}
                  className="hover:bg-[#0c1836] cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono text-cyan-400 text-[11px]">
                    {client.client_code}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-100">
                    {client.name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {client.industry || '—'}
                  </td>
                  <td className="py-2.5 px-3">
                    {stage ? (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-200">
                        {stage.name}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    <span
                      className={`font-bold ${
                        client.health_score >= 80 ? 'text-emerald-400' : client.health_score >= 50 ? 'text-amber-400' : 'text-red-400'
                      }`}
                    >
                      {client.health_score}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">
                    {client.owner_actor}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500 text-[11px]">
                    {client.created_at.split('T')[0]}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-lg bg-[#0a1329] border border-cyan-800 rounded-lg p-5 space-y-3">
            <h3 className="font-bold text-white text-sm">Import Clients CSV</h3>
            <p className="text-xs text-slate-300">
              Paste CSV text. Columns supported: name, email, industry, website, country.
              Duplicate matching will check email, domain, and company name.
            </p>
            <textarea
              rows={6}
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder="name,email,industry,website&#10;Acme Corp,info@acme.com,Logistics,https://acme.com"
              className="w-full bg-[#070e20] font-mono text-xs text-slate-200 border border-slate-700 rounded p-2 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowImportModal(false)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
              <button
                onClick={handleImportSubmit}
                className="px-4 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded"
              >
                Execute Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
