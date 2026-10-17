import React, { useState } from 'react';
import { Asset, AssetUsage, Client, Deliverable, CrmSettings } from '../types/crm';
import {
  Boxes,
  Clock,
  Sparkles,
  ExternalLink,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  TrendingUp,
  Cpu,
} from 'lucide-react';

interface AssetLibraryViewProps {
  assets: Asset[];
  assetUsage: AssetUsage[];
  clients: Client[];
  deliverables: Deliverable[];
  settings: CrmSettings;
  committedHours: number;
}

export const AssetLibraryView: React.FC<AssetLibraryViewProps> = ({
  assets,
  assetUsage,
  clients,
  deliverables,
  settings,
  committedHours,
}) => {
  const [filterKind, setFilterKind] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const kinds = Array.from(new Set(assets.map((a) => a.kind)));

  const filteredAssets = assets.filter((a) => {
    const matchesKind = filterKind === 'all' || a.kind === filterKind;
    const matchesQuery =
      !searchQuery ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.asset_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesKind && matchesQuery;
  });

  const totalHoursSaved = assetUsage.reduce((acc, u) => acc + u.hours_saved, 0);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || null;
  const selectedUsage = selectedAsset
    ? assetUsage.filter((u) => u.asset_id === selectedAsset.id)
    : [];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#04091A] text-slate-100 space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-cyan-400" />
            <span>Software Asset Library</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Re-usable engineering stock: blueprints, templates, prompt packs, and proven workflows.
          </p>
        </div>

        {/* Capacity vs Committed Widget */}
        <div className="flex items-center gap-4 bg-[#081126] border border-[#162445] p-3 rounded-lg text-xs font-mono">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Total Hours Saved</div>
            <div className="text-base font-bold text-emerald-400">{totalHoursSaved}h</div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Committed vs Capacity</div>
            <div className="text-base font-bold text-cyan-400">
              {committedHours}h / {settings.weekly_build_hours}h
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search blueprints, templates, tags..."
            className="w-full bg-[#081126] text-xs text-slate-200 border border-[#162445] rounded pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={filterKind}
          onChange={(e) => setFilterKind(e.target.value)}
          className="bg-[#081126] text-xs text-slate-200 border border-[#162445] rounded px-3 py-1.5 focus:outline-none"
        >
          <option value="all">All Kinds ({assets.length})</option>
          {kinds.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => {
          const usageList = assetUsage.filter((u) => u.asset_id === asset.id);
          const totalSavedForAsset = usageList.reduce((acc, u) => acc + u.hours_saved, 0);

          return (
            <div
              key={asset.id}
              onClick={() => setSelectedAssetId(asset.id)}
              className={`p-4 bg-[#081126] border rounded-lg cursor-pointer transition-all hover:border-cyan-500/80 space-y-3 ${
                selectedAssetId === asset.id ? 'border-cyan-400 bg-[#0a1633]' : 'border-[#162445]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm hover:text-cyan-300">{asset.name}</h3>
                  <div className="font-mono text-[10px] text-slate-400">
                    {asset.asset_code} · v{asset.version} · <span className="capitalize">{asset.kind}</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                  {usageList.length} reuses
                </span>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">{asset.description}</p>

              <div className="flex flex-wrap gap-1">
                {asset.tags?.map((t) => (
                  <span key={t} className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/80">
                    #{t}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono border-t border-slate-800/80 pt-2 text-slate-400">
                <span>Build Cost: {asset.hours_to_build}h</span>
                <span className="text-emerald-400 font-bold">Saved: {totalSavedForAsset}h</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Asset Drilldown Drawer / Card */}
      {selectedAsset && (
        <div className="p-5 bg-[#081126] border border-cyan-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">{selectedAsset.name}</h2>
              <div className="font-mono text-xs text-slate-400">
                Code: {selectedAsset.asset_code} · Repo: <a href={selectedAsset.repo_url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">{selectedAsset.repo_url}</a>
              </div>
            </div>
            <button onClick={() => setSelectedAssetId(null)} className="text-xs text-slate-400 hover:text-white">Close Drilldown</button>
          </div>

          <div className="pt-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Reused Across Clients:</h4>
            <div className="space-y-2">
              {selectedUsage.map((u) => {
                const c = clients.find((cli) => cli.id === u.client_id);
                return (
                  <div key={u.id} className="p-2.5 bg-[#0a1329] border border-slate-800 rounded flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-200">{c?.name || 'Client'}</span>
                      <span className="text-slate-500 font-mono text-[10px] ml-2">({c?.client_code})</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-semibold">Saved {u.hours_saved} hours</span>
                  </div>
                );
              })}
              {selectedUsage.length === 0 && <div className="text-slate-500 italic text-xs">No recorded reuses yet.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
