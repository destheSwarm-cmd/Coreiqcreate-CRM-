import React, { useState } from 'react';
import {
  CrmSettings,
  PipelineStage,
  CustomFieldDef,
} from '../types/crm';
import {
  Settings as SettingsIcon,
  Layers,
  Palette,
  Shield,
  Trash2,
  RefreshCw,
  Plus,
  Save,
  Check,
} from 'lucide-react';

interface SettingsViewProps {
  settings: CrmSettings;
  stages: PipelineStage[];
  customFields: CustomFieldDef[];
  onUpdateSettings: (settings: CrmSettings) => void;
  onUpdateStage: (stage: PipelineStage) => void;
  onPurgeSampleClient: () => void;
  onResetDatabase: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  stages,
  customFields,
  onUpdateSettings,
  onUpdateStage,
  onPurgeSampleClient,
  onResetDatabase,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'stages' | 'fields' | 'danger'>('general');
  const [formSettings, setFormSettings] = useState<CrmSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveGeneral = () => {
    onUpdateSettings(formSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#04091A] text-slate-100 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-cyan-400" />
          <span>CRM Operational Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure stage checklists, commercial pricing defaults, send-modes, and operator roles.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-[#162445] space-x-2 text-xs">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-3 py-2 border-b-2 font-medium ${
            activeTab === 'general' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          General & Commercial Rules
        </button>
        <button
          onClick={() => setActiveTab('stages')}
          className={`px-3 py-2 border-b-2 font-medium ${
            activeTab === 'stages' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Pipeline Stages ({stages.length})
        </button>
        <button
          onClick={() => setActiveTab('fields')}
          className={`px-3 py-2 border-b-2 font-medium ${
            activeTab === 'fields' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Custom Fields ({customFields.length})
        </button>
        <button
          onClick={() => setActiveTab('danger')}
          className={`px-3 py-2 border-b-2 font-medium ${
            activeTab === 'danger' ? 'border-red-400 text-red-300' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Danger Zone & Data Reset
        </button>
      </div>

      {/* TAB 1: GENERAL */}
      {activeTab === 'general' && (
        <div className="p-5 bg-[#081126] border border-[#162445] rounded-lg max-w-2xl space-y-4 text-xs">
          <h3 className="font-bold text-white text-sm">Commercial Defaults</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1">Brand Name Displayed:</label>
              <input
                type="text"
                value={formSettings.brand_name}
                onChange={(e) => setFormSettings({ ...formSettings, brand_name: e.target.value })}
                className="w-full bg-[#0a1329] text-xs text-white border border-[#1e325c] rounded p-2 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Default Currency:</label>
              <input
                type="text"
                value={formSettings.currency}
                onChange={(e) => setFormSettings({ ...formSettings, currency: e.target.value })}
                className="w-full bg-[#0a1329] text-xs text-white border border-[#1e325c] rounded p-2 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">VAT / Tax Rate (e.g. 0.15 = 15%):</label>
              <input
                type="number"
                step="0.01"
                value={formSettings.tax_rate}
                onChange={(e) => setFormSettings({ ...formSettings, tax_rate: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#0a1329] text-xs text-white border border-[#1e325c] rounded p-2 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Quote Validity Period (days):</label>
              <input
                type="number"
                value={formSettings.quote_validity_days}
                onChange={(e) => setFormSettings({ ...formSettings, quote_validity_days: parseInt(e.target.value) || 14 })}
                className="w-full bg-[#0a1329] text-xs text-white border border-[#1e325c] rounded p-2 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#162445]">
            <h4 className="font-bold text-white text-xs mb-2">Discount Governance & Approval Caps</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Agent Discount Cap (%):</label>
                <input
                  type="number"
                  value={formSettings.agent_discount_cap_pct}
                  onChange={(e) => setFormSettings({ ...formSettings, agent_discount_cap_pct: parseInt(e.target.value) || 10 })}
                  className="w-full bg-[#0a1329] text-xs text-white border border-[#1e325c] rounded p-2"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Human Approval Threshold (%):</label>
                <input
                  type="number"
                  value={formSettings.approval_threshold_pct}
                  onChange={(e) => setFormSettings({ ...formSettings, approval_threshold_pct: parseInt(e.target.value) || 20 })}
                  className="w-full bg-[#0a1329] text-xs text-white border border-[#1e325c] rounded p-2"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#162445]">
            <h4 className="font-bold text-white text-xs mb-1">Email Send-Mode Toggle</h4>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sendMode"
                  checked={formSettings.send_mode === 'draft'}
                  onChange={() => setFormSettings({ ...formSettings, send_mode: 'draft' })}
                  className="text-cyan-500 bg-slate-900 border-slate-700"
                />
                <span>Draft Only (Default - safe mode, requires human click)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sendMode"
                  checked={formSettings.send_mode === 'live'}
                  onChange={() => setFormSettings({ ...formSettings, send_mode: 'live' })}
                  className="text-cyan-500 bg-slate-900 border-slate-700"
                />
                <span>Live Mode (Autonomy Level 2 may send directly)</span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            {savedSuccess && <span className="text-emerald-400 font-semibold">✓ Settings Saved</span>}
            <button
              onClick={handleSaveGeneral}
              className="ml-auto px-4 py-2 font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Commercial Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: STAGES */}
      {activeTab === 'stages' && (
        <div className="space-y-3">
          {stages.map((stg) => (
            <div key={stg.id} className="p-3 bg-[#081126] border border-[#162445] rounded-lg text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: stg.color }} />
                  <span className="font-bold text-white text-sm">{stg.name}</span>
                  <span className="font-mono text-[10px] text-slate-500">key: {stg.key}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                  <span>Probability: {stg.probability_pct}%</span>
                  <span>SLA: {stg.sla_days} days</span>
                </div>
              </div>

              <div className="text-slate-300">
                <strong>Guidance:</strong> {stg.guidance_md}
              </div>

              {stg.exit_checklist.length > 0 && (
                <div className="text-[11px] text-slate-400">
                  <strong>Checklist:</strong> {stg.exit_checklist.join(' · ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: CUSTOM FIELDS */}
      {activeTab === 'fields' && (
        <div className="p-4 bg-[#081126] border border-[#162445] rounded-lg space-y-3 text-xs">
          <h3 className="font-bold text-white text-sm">Defined Custom Attributes</h3>
          <div className="space-y-2">
            {customFields.map((cf) => (
              <div key={cf.id} className="p-2.5 bg-[#0a1329] border border-slate-800 rounded flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-100">{cf.label}</span>
                  <span className="font-mono text-cyan-400 text-[10px] ml-2">({cf.key})</span>
                </div>
                <div className="font-mono text-[10px] text-slate-400">
                  entity: {cf.entity} · type: {cf.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DANGER ZONE */}
      {activeTab === 'danger' && (
        <div className="p-5 bg-red-950/20 border border-red-900 rounded-lg max-w-xl space-y-4 text-xs text-red-200">
          <h3 className="font-bold text-red-400 text-sm flex items-center gap-1.5">
            <Trash2 className="w-4 h-4" />
            <span>Danger Zone & Data Reset</span>
          </h3>

          <div className="p-3 bg-[#081126] border border-slate-800 rounded space-y-2">
            <div className="font-bold text-white text-xs">Purge Sample Client</div>
            <p className="text-slate-400 text-[11px]">
              Remove the test sample client ("Apex Logistics & Freight") and its associated sample questionnaires,
              quotes, feedback, and deliverables with a single click.
            </p>
            <button
              onClick={() => {
                if (window.confirm('Purge all sample client records?')) {
                  onPurgeSampleClient();
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold text-red-300 bg-red-950 border border-red-800 rounded hover:bg-red-900"
            >
              Purge Sample Client Data
            </button>
          </div>

          <div className="p-3 bg-[#081126] border border-slate-800 rounded space-y-2">
            <div className="font-bold text-white text-xs">Reset Database to Seeded State</div>
            <p className="text-slate-400 text-[11px]">
              Re-initializes all stages, seeded products with base_price NULL, and sample records.
            </p>
            <button
              onClick={() => {
                if (window.confirm('Reset database to clean initial state?')) {
                  onResetDatabase();
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700 rounded hover:bg-slate-800"
            >
              Reset to Clean Initial State
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
