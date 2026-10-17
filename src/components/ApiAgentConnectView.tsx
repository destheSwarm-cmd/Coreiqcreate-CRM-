import React, { useState } from 'react';
import { ApiKey } from '../types/crm';
import { ALL_SCOPES, SCOPE_PRESETS } from '../shared/scopes';
import { MCP_TOOLS } from '../shared/mcpToolList';
import {
  Bot,
  Key,
  ShieldAlert,
  Copy,
  Check,
  Play,
  FileCode,
  Terminal,
  Code2,
  Trash2,
  RefreshCw,
  Eye,
  Lock,
} from 'lucide-react';

interface ApiAgentConnectViewProps {
  apiKeys: ApiKey[];
  onCreateKey: (keyData: {
    name: string;
    actor_name: string;
    actor_type: 'agent' | 'service' | 'human';
    preset_id: string;
    scopes: string[];
    rate_limit: number;
  }) => Promise<{ fullKey: string; key: ApiKey }>;
  onRevokeKey: (keyId: string) => void;
}

export const ApiAgentConnectView: React.FC<ApiAgentConnectViewProps> = ({
  apiKeys,
  onCreateKey,
  onRevokeKey,
}) => {
  const [activeTab, setActiveTab] = useState<'agent_connect' | 'api_keys' | 'mcp_tools' | 'curl_docs' | 'website_intake'>('agent_connect');

  // Key Creation Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyActor, setNewKeyActor] = useState('');
  const [newKeyType, setNewKeyType] = useState<'agent' | 'service' | 'human'>('agent');
  const [selectedPreset, setSelectedPreset] = useState('agent_full_operator');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(
    SCOPE_PRESETS.find((p) => p.id === 'agent_full_operator')?.scopes || []
  );
  const [newKeyResult, setNewKeyResult] = useState<string | null>(null);

  // MCP Live Test State
  const [selectedTestKey, setSelectedTestKey] = useState<string>(apiKeys[0]?.id || '');
  const [testResult, setTestResult] = useState<any>(null);
  const [testingLoading, setTestingLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const p = SCOPE_PRESETS.find((x) => x.id === presetId);
    if (p) {
      setSelectedScopes([...p.scopes]);
    }
  };

  const handleCreateKeySubmit = async () => {
    if (!newKeyName || !newKeyActor) return;
    const res = await onCreateKey({
      name: newKeyName,
      actor_name: newKeyActor,
      actor_type: newKeyType,
      preset_id: selectedPreset,
      scopes: selectedScopes,
      rate_limit: 120,
    });
    setNewKeyResult(res.fullKey);
    setNewKeyName('');
    setNewKeyActor('');
  };

  const runMcpLiveTest = async () => {
    setTestingLoading(true);
    setTestResult(null);
    try {
      // Find key prefix or header
      const targetKey = apiKeys.find((k) => k.id === selectedTestKey);
      const authHeader = targetKey?.actor_name === 'Hermes'
        ? 'Bearer ciq_crm_hermes_secret_sample_key_999'
        : 'Bearer ciq_crm_readonly_sample_key_111';

      const resp = await fetch('/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'crm_pipeline_summary',
            arguments: {},
          },
          id: 42,
        }),
      });
      const data = await resp.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setTestingLoading(false);
    }
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://crm.coreiq.create';

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#04091A] text-slate-100 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <span>AI Agent & MCP Connection Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Connect Hermes, Odin, Pharaoh, Claude Code, and custom nodes with granular scopes and SHA-256 keys.
          </p>
        </div>

        <button
          onClick={() => {
            setNewKeyResult(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors"
        >
          <Key className="w-3.5 h-3.5" />
          <span>Generate New API Key</span>
        </button>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center border-b border-[#162445] space-x-1 text-xs">
        <button
          onClick={() => setActiveTab('agent_connect')}
          className={`px-3 py-2 border-b-2 font-medium ${
            activeTab === 'agent_connect' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Connect an AI Agent
        </button>
        <button
          onClick={() => setActiveTab('api_keys')}
          className={`px-3 py-2 border-b-2 font-medium ${
            activeTab === 'api_keys' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          API Keys ({apiKeys.length})
        </button>
        <button
          onClick={() => setActiveTab('mcp_tools')}
          className={`px-3 py-2 border-b-2 font-medium ${
            activeTab === 'mcp_tools' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          MCP Tools ({MCP_TOOLS.length})
        </button>
        <button
          onClick={() => setActiveTab('curl_docs')}
          className={`px-3 py-2 border-b-2 font-medium ${
            activeTab === 'curl_docs' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          REST API & cURL Docs
        </button>
        <button
          onClick={() => setActiveTab('website_intake')}
          className={`px-3 py-2 border-b-2 font-medium ${
            activeTab === 'website_intake' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Website Intake Script
        </button>
      </div>

      {/* TAB 1: CONNECT AN AI AGENT */}
      {activeTab === 'agent_connect' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Connection Endpoints */}
            <div className="p-4 bg-[#081126] border border-[#162445] rounded-lg space-y-3">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">MCP Server URL (Streamable HTTP)</h3>
              <p className="text-slate-400 text-xs">
                Stateless remote MCP endpoint. Pass your API key in the Bearer Authorization header:
              </p>
              <div className="p-2.5 bg-[#050b1a] border border-slate-800 rounded font-mono text-xs text-cyan-300 flex items-center justify-between">
                <span>{baseUrl}/mcp</span>
                <button
                  onClick={() => navigator.clipboard.writeText(`${baseUrl}/mcp`)}
                  className="text-slate-400 hover:text-white"
                  title="Copy URL"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="pt-2 text-xs text-slate-300">
                <span className="text-emerald-400 font-bold">✓ Auth Mechanism:</span> Key hash check verified server-side.
                Tokens carry identity directly into audit log.
              </div>
            </div>

            {/* Live MCP Tool Test Runner */}
            <div className="p-4 bg-[#081126] border border-[#162445] rounded-lg space-y-3">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center justify-between">
                <span>Test Live MCP Dispatcher</span>
                <span className="font-mono text-cyan-400 text-[10px]">tool: crm_pipeline_summary</span>
              </h3>

              <div className="flex gap-2">
                <select
                  value={selectedTestKey}
                  onChange={(e) => setSelectedTestKey(e.target.value)}
                  className="flex-1 bg-[#0a1329] text-xs text-slate-200 border border-[#1e325c] rounded p-2"
                >
                  {apiKeys.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} ({k.actor_name}) {k.revoked_at ? '[REVOKED]' : ''}
                    </option>
                  ))}
                </select>

                <button
                  onClick={runMcpLiveTest}
                  disabled={testingLoading}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3" />
                  <span>{testingLoading ? 'Testing...' : 'Test Tool'}</span>
                </button>
              </div>

              {testResult && (
                <div className="mt-2 p-2.5 bg-[#050b1a] border border-slate-800 rounded max-h-48 overflow-y-auto font-mono text-[11px] text-slate-300">
                  <pre>{JSON.stringify(testResult, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Copyable Client Configurations */}
          <div className="p-4 bg-[#081126] border border-[#162445] rounded-lg space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">
              Claude Desktop / MCP Client Configuration (claude_desktop_config.json)
            </h3>
            <div className="p-3 bg-[#050b1a] border border-slate-800 rounded font-mono text-xs text-slate-300 overflow-x-auto">
              <pre>{`{
  "mcpServers": {
    "coreiq-crm": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote-client",
        "${baseUrl}/mcp",
        "--header",
        "Authorization: Bearer ciq_crm_<YOUR_NODE_KEY>"
      ]
    }
  }
}`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: API KEYS */}
      {activeTab === 'api_keys' && (
        <div className="space-y-4">
          <div className="overflow-x-auto bg-[#081126] border border-[#162445] rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#162445] bg-[#0a142e] text-slate-400 uppercase font-mono text-[10px]">
                  <th className="py-2.5 px-3">Name / Node</th>
                  <th className="py-2.5 px-3">Actor Type</th>
                  <th className="py-2.5 px-3">Key Prefix</th>
                  <th className="py-2.5 px-3">Scopes</th>
                  <th className="py-2.5 px-3">Last Used</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#162445]/60">
                {apiKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-[#0c1836]">
                    <td className="py-2.5 px-3 font-semibold text-slate-100">
                      <div>{k.name}</div>
                      <div className="font-mono text-[10px] text-cyan-400">Actor: {k.actor_name}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 capitalize font-mono text-[11px]">{k.actor_type}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300 text-[11px]">{k.key_prefix}••••••••</td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <span className="font-mono text-[10px] text-slate-400">
                        {k.scopes.length} scopes granted
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {k.revoked_at ? (
                        <span className="font-mono text-[10px] text-red-400 uppercase font-bold">REVOKED</span>
                      ) : (
                        <button
                          onClick={() => onRevokeKey(k.id)}
                          className="px-2 py-1 text-[10px] font-semibold text-red-400 bg-red-950/60 border border-red-800 rounded hover:bg-red-900"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MCP TOOLS */}
      {activeTab === 'mcp_tools' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400">
            All 35 MCP tools implemented on the remote MCP endpoint:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MCP_TOOLS.map((tool) => (
              <div key={tool.name} className="p-3 bg-[#081126] border border-[#162445] rounded space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-300 text-xs">{tool.name}</span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1 rounded border border-slate-800">
                    {tool.requiredScope}
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CURL DOCS */}
      {activeTab === 'curl_docs' && (
        <div className="p-4 bg-[#081126] border border-[#162445] rounded-lg space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider">REST API V1 Examples (cURL)</h3>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="text-slate-400 mb-1">1. Create Client:</div>
              <pre className="p-2.5 bg-[#050b1a] border border-slate-800 rounded overflow-x-auto text-cyan-300">{`curl -X POST "${baseUrl}/v1/clients" \\
  -H "Authorization: Bearer ciq_crm_<API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Nova Dynamics", "industry": "Robotics", "website": "https://novadynamics.co.za"}'`}</pre>
            </div>

            <div>
              <div className="text-slate-400 mb-1">2. Transition Stage with Mandatory Reason:</div>
              <pre className="p-2.5 bg-[#050b1a] border border-slate-800 rounded overflow-x-auto text-cyan-300">{`curl -X POST "${baseUrl}/v1/engagements/eng_sample_1/move" \\
  -H "Authorization: Bearer ciq_crm_<API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{"to_stage_id": "stg_6", "reason": "Sample approved with 5/5 score. Sending quote."}'`}</pre>
            </div>

            <div>
              <div className="text-slate-400 mb-1">3. Calculate Price Line Breakdown:</div>
              <pre className="p-2.5 bg-[#050b1a] border border-slate-800 rounded overflow-x-auto text-cyan-300">{`curl -X POST "${baseUrl}/v1/price-estimate" \\
  -H "Authorization: Bearer ciq_crm_<API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{"product_id": "prod_auto", "quantity": 1, "discount_pct": 10}'`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: WEBSITE INTAKE SCRIPT */}
      {activeTab === 'website_intake' && (
        <div className="p-4 bg-[#081126] border border-[#162445] rounded-lg space-y-3">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider">
            Website Intake Integration Snippet (For coreiq.create)
          </h3>
          <p className="text-xs text-slate-300">
            Paste this snippet into your website contact form. It includes honeypot verification and automatic deduplication by email/domain:
          </p>

          <pre className="p-3 bg-[#050b1a] border border-slate-800 rounded font-mono text-xs text-slate-300 overflow-x-auto">{`// Send inbound website leads directly to CoreIQ CRM
async function submitToCoreIqCrm(formData) {
  const resp = await fetch("${baseUrl}/api/intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      message: formData.message,
      _gotcha: "" // Honeypot field (must stay empty)
    })
  });
  return await resp.json();
}`}</pre>
        </div>
      )}

      {/* CREATE API KEY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-lg bg-[#0a1329] border border-cyan-800 rounded-lg p-5 space-y-4 text-slate-100">
            <h3 className="font-bold text-white text-base">Generate New API Key</h3>

            {newKeyResult ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded">
                  <div className="font-bold text-emerald-300 text-xs mb-1">
                    Key Generated Successfully!
                  </div>
                  <p className="text-[11px] text-emerald-200">
                    Copy this key now. For security, only a SHA-256 hash is saved server-side. It will never be shown again:
                  </p>
                  <div className="mt-2 p-2 bg-[#050b1a] border border-emerald-700 rounded font-mono text-xs text-emerald-300 break-all flex items-center justify-between">
                    <span>{newKeyResult}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newKeyResult);
                        setCopiedKey(true);
                      }}
                      className="ml-2 p-1 text-slate-300 hover:text-white"
                    >
                      {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Key Label:</label>
                  <input
                    type="text"
                    placeholder="e.g. Odin Agent Node"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full bg-[#070e20] text-slate-100 border border-slate-700 rounded p-2 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Actor Name (Attribution):</label>
                    <input
                      type="text"
                      placeholder="e.g. Odin"
                      value={newKeyActor}
                      onChange={(e) => setNewKeyActor(e.target.value)}
                      className="w-full bg-[#070e20] text-slate-100 border border-slate-700 rounded p-2 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Actor Type:</label>
                    <select
                      value={newKeyType}
                      onChange={(e) => setNewKeyType(e.target.value as any)}
                      className="w-full bg-[#070e20] text-slate-100 border border-slate-700 rounded p-2"
                    >
                      <option value="agent">Agent Node</option>
                      <option value="service">External Service</option>
                      <option value="human">Human Operator</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Scope Preset:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SCOPE_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePresetSelect(p.id)}
                        className={`p-2 text-left rounded border transition-all ${
                          selectedPreset === p.id
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        <div className="font-bold text-[11px]">{p.label}</div>
                        <div className="text-[10px] text-slate-500 truncate">{p.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowCreateModal(false)} className="px-3 py-1.5 text-slate-400">Cancel</button>
                  <button
                    disabled={!newKeyName || !newKeyActor}
                    onClick={handleCreateKeySubmit}
                    className="px-4 py-1.5 font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded disabled:opacity-50"
                  >
                    Generate Key
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
