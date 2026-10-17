import React, { useState, useEffect } from 'react';
import {
  DatabaseSchema,
  Client,
  Engagement,
  PipelineStage,
  Task,
  RequestItem,
  Activity,
  Quote,
  Product,
  Asset,
  Feedback,
  NbaItem,
  AppRole,
} from './types/crm';
import { Navigation, MainNavView } from './components/Navigation';
import { KanbanBoard } from './components/KanbanBoard';
import { ClientCard } from './components/ClientCard';
import { PriceBookView } from './components/PriceBookView';
import { AssetLibraryView } from './components/AssetLibraryView';
import { ApiAgentConnectView } from './components/ApiAgentConnectView';
import { VerificationReportView } from './components/VerificationReportView';
import { SettingsView } from './components/SettingsView';
import { TableView } from './components/TableView';
import { CalendarView } from './components/CalendarView';
import { DashboardView } from './components/DashboardView';
import { CommandPalette } from './components/CommandPalette';
import { PublicQuoteView } from './components/PublicQuoteView';
import { PublicQuestionnaireView } from './components/PublicQuestionnaireView';
import { PublicFeedbackView } from './components/PublicFeedbackView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { CheckCircle2, AlertTriangle, Plus, Search } from 'lucide-react';

export function App() {
  // Check for public token-based route access
  const path = window.location.pathname;

  if (path.startsWith('/quote/')) {
    const token = path.replace('/quote/', '').trim();
    return <PublicQuoteView token={token} />;
  }

  if (path.startsWith('/q/')) {
    const token = path.replace('/q/', '').trim();
    return <PublicQuestionnaireView token={token} />;
  }

  if (path.startsWith('/f/')) {
    const token = path.replace('/f/', '').trim();
    return <PublicFeedbackView token={token} />;
  }

  // Operator CRM Core State
  const [dbState, setDbState] = useState<DatabaseSchema | null>(null);
  const [currentView, setCurrentView] = useState<MainNavView>('pipeline');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<AppRole>('owner');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [liveToast, setLiveToast] = useState<{ message: string; actor: string } | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Quick New Client Modal
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientIndustry, setNewClientIndustry] = useState('');
  const [newClientWebsite, setNewClientWebsite] = useState('');

  // Fetch state on mount
  useEffect(() => {
    fetchState();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Global keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      } else if (e.key === 'n' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setShowNewClientModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchState = async () => {
    try {
      const resp = await fetch('/api/db/state');
      if (resp.ok) {
        const json = await resp.json();
        setDbState(json.data);
      }
    } catch (e) {
      console.warn('Failed to fetch DB state, using offline cache:', e);
    }
  };

  const showToast = (message: string, actor: string = 'Operator') => {
    setLiveToast({ message, actor });
    setTimeout(() => setLiveToast(null), 3500);
  };

  // Move Engagement Stage with mandatory reason
  const handleMoveEngagement = async (engagementId: string, toStageId: string, reason: string) => {
    try {
      const resp = await fetch(`/v1/engagements/${engagementId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ciq_crm_hermes_secret_sample_key_999',
        },
        body: JSON.stringify({ to_stage_id: toStageId, reason }),
      });
      if (resp.ok) {
        showToast(`Stage moved to ${toStageId}`, 'Desmond');
        fetchState();
      }
    } catch (err) {
      console.error('Failed to move stage:', err);
    }
  };

  // Create New Client
  const handleCreateClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    try {
      const resp = await fetch('/v1/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ciq_crm_hermes_secret_sample_key_999',
        },
        body: JSON.stringify({
          name: newClientName,
          industry: newClientIndustry,
          website: newClientWebsite,
          source: 'manual_operator',
        }),
      });

      if (resp.ok) {
        const json = await resp.json();
        const createdClient = json.data;

        // Auto create first engagement at stage Outreach
        await fetch('/api/db/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'engagements',
            item: {
              id: `eng_${Date.now()}`,
              engagement_code: `CIQ-E-${String(dbState?.counters.engagement || 1).padStart(4, '0')}`,
              client_id: createdClient.id,
              title: `${createdClient.name} — Initial Journey`,
              categories: ['AI Agent', 'Automation'],
              stage_id: 'stg_1', // Outreach
              stage_entered_at: new Date().toISOString(),
              value_estimate: 15000,
              currency: 'ZAR',
              expected_close: null,
              owner_actor: 'Desmond',
              is_sampling: true,
              outcome: null,
              lost_reason: null,
              custom: {},
              archived_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          }),
        });

        showToast(`Client ${createdClient.name} created (${createdClient.client_code})`, 'Desmond');
        setNewClientName('');
        setNewClientIndustry('');
        setNewClientWebsite('');
        setShowNewClientModal(false);
        fetchState();
        setSelectedClientId(createdClient.id);
      }
    } catch (err) {
      console.error('Error creating client:', err);
    }
  };

  // Toggle Task Status
  const handleToggleTask = async (taskId: string) => {
    if (!dbState) return;
    const task = dbState.tasks.find((t: Task) => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'done' ? 'open' : 'done';
    await fetch('/api/db/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'tasks',
        item: { ...task, status: newStatus },
      }),
    });
    fetchState();
  };

  // Add Task
  const handleAddTask = async (taskData: Partial<Task>) => {
    const newTask: Task = {
      id: `tsk_${Date.now()}`,
      client_id: taskData.client_id || '',
      engagement_id: taskData.engagement_id || null,
      title: taskData.title || 'Follow up',
      description: taskData.description || '',
      due_at: taskData.due_at || new Date().toISOString(),
      priority: taskData.priority || 'medium',
      status: 'open',
      assignee_actor: taskData.assignee_actor || 'Desmond',
      created_by_actor: 'Desmond',
      source: 'manual',
      created_at: new Date().toISOString(),
    };

    await fetch('/api/db/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'tasks', item: newTask }),
    });
    showToast(`Task created: ${newTask.title}`, 'Desmond');
    fetchState();
  };

  // Add Request
  const handleAddRequest = async (reqData: Partial<RequestItem>) => {
    const newReq: RequestItem = {
      id: `req_${Date.now()}`,
      engagement_id: reqData.engagement_id || '',
      client_id: reqData.client_id || '',
      title: reqData.title || '',
      description: reqData.description || '',
      product_id: null,
      category: reqData.category || 'Automation',
      priority: 'high',
      status: 'scoped',
      source: 'manual',
      created_by_actor: 'Desmond',
      created_at: new Date().toISOString(),
    };

    await fetch('/api/db/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'requests', item: newReq }),
    });
    showToast(`Request added: ${newReq.title}`, 'Desmond');
    fetchState();
  };

  // Add Timeline Activity
  const handleAddActivity = async (actData: Partial<Activity>) => {
    const newAct: Activity = {
      id: `act_${Date.now()}`,
      client_id: actData.client_id || '',
      engagement_id: actData.engagement_id || null,
      type: actData.type || 'note',
      summary: actData.summary || '',
      body: actData.body || '',
      actor_type: actData.actor_type || 'human',
      actor_name: actData.actor_name || 'Desmond',
      metadata: {},
      occurred_at: new Date().toISOString(),
    };

    await fetch('/api/db/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'activities', item: newAct }),
    });
    showToast(`Activity logged: ${newAct.summary}`, newAct.actor_name);
    fetchState();
  };

  // Governor AI Questionnaire Generation
  const handleGenerateQuestionnaire = async (clientId: string, engagementId: string) => {
    try {
      const resp = await fetch('/api/governor/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_questionnaire',
          payload: { client_id: clientId, engagement_id: engagementId },
        }),
      });
      const data = await resp.json();
      showToast('Governor AI synthesized questions from client scope', 'Governor AI');
      fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  // Draft Quote from Requests
  const handleDraftQuote = async (clientId: string, engagementId: string) => {
    if (!dbState) return;
    const clientRequests = dbState.requests.filter((r: RequestItem) => r.client_id === clientId);
    const lines: {
      description: string;
      qty: number;
      unit_price: number;
      discount_pct: number;
      product_id: string | null;
      request_id: string | null;
    }[] = clientRequests.map((r: RequestItem) => ({
      description: r.title,
      qty: 1,
      unit_price: 6500,
      discount_pct: 0,
      product_id: r.product_id || null,
      request_id: r.id,
    }));

    if (lines.length === 0) {
      lines.push({
        description: 'Custom AI Solution Deployment',
        qty: 1,
        unit_price: 12000,
        discount_pct: 0,
        product_id: null,
        request_id: null,
      });
    }

    try {
      const resp = await fetch('/v1/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ciq_crm_hermes_secret_sample_key_999',
        },
        body: JSON.stringify({
          client_id: clientId,
          engagement_id: engagementId,
          lines,
          payment_link_url: 'https://wise.com/pay/coreiq-create',
          notes: 'Standard 50/50 commercial milestone terms.',
        }),
      });
      if (resp.ok) {
        showToast('Commercial quote drafted and ready for review', 'Desmond');
        fetchState();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Draft Email
  const handleDraftEmail = async (type: 'followup' | 'quote' | 'upsell') => {
    showToast(`Governor AI drafted ${type} email`, 'Governor AI');
  };

  // Record Feedback
  const handleRecordFeedback = async (fb: Partial<Feedback>) => {
    if (!dbState) return;
    const newFb: Feedback = {
      id: `fb_${Date.now()}`,
      engagement_id: fb.engagement_id || '',
      deliverable_id: null,
      token_hash: 'manual',
      status: 'completed',
      satisfaction: fb.satisfaction || 5,
      would_pay: fb.would_pay || 'yes',
      comments: fb.comments || '',
      requested_changes: fb.requested_changes || '',
      source: 'call',
      recorded_by_actor: 'Desmond',
      created_at: new Date().toISOString(),
    };

    await fetch('/api/db/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'feedback', item: newFb }),
    });
    showToast(`Recorded feedback (${newFb.satisfaction}/5)`, 'Desmond');
    fetchState();
  };

  // Execute NBA
  const handleExecuteNba = async (nba: NbaItem) => {
    if (nba.action_type === 'suggest_quote' && nba.action_payload?.next_stage) {
      await handleMoveEngagement(nba.engagement_id, nba.action_payload.next_stage, 'Approved via Next Best Action recommendation');
    } else {
      showToast(`Action executed: ${nba.title}`, 'Desmond');
    }
    fetchState();
  };

  // Purge Sample Client
  const handlePurgeSampleClient = async () => {
    try {
      const resp = await fetch('/api/db/purge-sample', { method: 'POST' });
      if (resp.ok) {
        showToast('Purged sample client records', 'System');
        fetchState();
        setSelectedClientId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reset Database
  const handleResetDatabase = async () => {
    try {
      const resp = await fetch('/api/db/reset', { method: 'POST' });
      if (resp.ok) {
        showToast('Reset database to clean initial state', 'System');
        fetchState();
        setSelectedClientId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update Settings
  const handleUpdateSettings = async (newSettings: any) => {
    await fetch('/api/db/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'settings', item: newSettings }),
    });
    showToast('Updated commercial settings', 'Desmond');
    fetchState();
  };

  // Create API Key
  const handleCreateKey = async (keyData: any) => {
    const randomSecret = Math.random().toString(36).substring(2, 12);
    const fullKey = `ciq_crm_${keyData.actor_name.toLowerCase()}_${randomSecret}`;
    const keyPrefix = `ciq_crm_${keyData.actor_name.toLowerCase()}_`;

    // SHA256 of full key
    const msgUint8 = new TextEncoder().encode(fullKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const newKeyObj = {
      id: `key_${Date.now()}`,
      name: keyData.name,
      actor_name: keyData.actor_name,
      actor_type: keyData.actor_type,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      scopes: keyData.scopes,
      rate_limit_per_min: keyData.rate_limit || 60,
      expires_at: null,
      last_used_at: null,
      revoked_at: null,
      created_by: 'Desmond',
      created_at: new Date().toISOString(),
    };

    await fetch('/api/db/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'api_keys', item: newKeyObj }),
    });

    fetchState();
    return { fullKey, key: newKeyObj };
  };

  // Revoke Key
  const handleRevokeKey = async (keyId: string) => {
    if (!dbState) return;
    const keyObj = dbState.api_keys.find((k: any) => k.id === keyId);
    if (!keyObj) return;

    await fetch('/api/db/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'api_keys',
        item: { ...keyObj, revoked_at: new Date().toISOString() },
      }),
    });
    showToast(`Revoked key ${keyObj.name}`, 'Desmond');
    fetchState();
  };

  if (!dbState) {
    return (
      <div className="min-h-screen bg-[#04091A] flex items-center justify-center p-6 text-cyan-400 font-mono text-xs">
        Booting CoreIQ CRM Operator Engine...
      </div>
    );
  }

  const selectedClient = selectedClientId
    ? dbState.clients.find((c: Client) => c.id === selectedClientId)
    : null;

  const unpricedCount = dbState.products.filter((p: Product) => p.needs_price || p.base_price === null).length;
  const committedHours = dbState.engagements
    .filter((e: Engagement) => !e.archived_at && (e.stage_id === 'stg_4' || e.stage_id === 'stg_7'))
    .reduce((acc: number, e: Engagement) => acc + (e.categories.length * 8), 0);

  return (
    <div className="flex h-screen overflow-hidden bg-[#04091A] text-slate-100 antialiased font-sans">
      {/* Navigation (Desktop Sidebar + Mobile Header/Tabs) */}
      <Navigation
        currentView={currentView}
        onNavigate={(v) => setCurrentView(v)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        currentRole={currentRole}
        onRoleChange={(role) => setCurrentRole(role)}
        brandName={dbState.settings.brand_name}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0 pb-14 md:pb-0">
        {/* Desktop Top Bar Contract: Breadcrumbs + Context + PWA Install */}
        <div className="hidden md:flex items-center justify-between px-6 py-2.5 bg-[#081126] border-b border-[#162445] shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold capitalize">{currentView.replace(/_/g, ' ')}</span>
            <span>/</span>
            <span className="font-mono text-[11px] text-cyan-400">
              {dbState.clients.filter((c: Client) => !c.archived_at).length} Active Clients · {dbState.engagements.filter((e: Engagement) => !e.archived_at).length} Deals
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!isOnline && (
              <span className="text-amber-400 font-mono text-[10px] bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                Offline Mode (Local Cache)
              </span>
            )}
            <PWAInstallButton />
            <button
              onClick={() => setShowNewClientModal(true)}
              className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Client</span>
            </button>
          </div>
        </div>

        {/* Dynamic Screen View */}
        {currentView === 'pipeline' && (
          <KanbanBoard
            stages={dbState.pipeline_stages}
            engagements={dbState.engagements}
            clients={dbState.clients}
            tasks={dbState.tasks}
            settings={dbState.settings}
            onSelectClient={(id) => setSelectedClientId(id)}
            onMoveEngagement={handleMoveEngagement}
            onNewClient={() => setShowNewClientModal(true)}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            stages={dbState.pipeline_stages}
            engagements={dbState.engagements}
            clients={dbState.clients}
            quotes={dbState.quotes}
            activities={dbState.activities}
            tasks={dbState.tasks}
            deliverables={dbState.deliverables}
            assets={dbState.assets}
            assetUsage={dbState.asset_usage}
            samplingCosts={dbState.sampling_costs}
            nbaItems={dbState.nba_items}
            settings={dbState.settings}
            unpricedCount={unpricedCount}
            onSelectClient={(id) => setSelectedClientId(id)}
            onExecuteNba={handleExecuteNba}
          />
        )}

        {currentView === 'table' && (
          <TableView
            clients={dbState.clients}
            engagements={dbState.engagements}
            stages={dbState.pipeline_stages}
            onSelectClient={(id) => setSelectedClientId(id)}
            onImportCsv={(content) => showToast('Imported CSV records', 'Desmond')}
          />
        )}

        {currentView === 'calendar' && (
          <CalendarView
            tasks={dbState.tasks}
            engagements={dbState.engagements}
            clients={dbState.clients}
            onSelectClient={(id) => setSelectedClientId(id)}
          />
        )}

        {currentView === 'clients' && (
          <TableView
            clients={dbState.clients}
            engagements={dbState.engagements}
            stages={dbState.pipeline_stages}
            onSelectClient={(id) => setSelectedClientId(id)}
            onImportCsv={(content) => showToast('Imported CSV records', 'Desmond')}
          />
        )}

        {currentView === 'tasks' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#04091A] text-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">Operator & Agent Tasks</h1>
                <p className="text-xs text-slate-400 mt-1">Overdue items prioritized first.</p>
              </div>
            </div>

            <div className="space-y-2">
              {dbState.tasks.map((task: Task) => (
                <div
                  key={task.id}
                  className="p-3 bg-[#081126] border border-[#162445] rounded flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      onChange={() => handleToggleTask(task.id)}
                      className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                    />
                    <div>
                      <div className={`font-semibold ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                        {task.title}
                      </div>
                      {task.description && <div className="text-[11px] text-slate-400">{task.description}</div>}
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px] text-slate-400">
                    <div>Due: {task.due_at.split('T')[0]}</div>
                    <div>Assignee: <strong className="text-cyan-400">{task.assignee_actor}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'pricebook' && (
          <PriceBookView
            products={dbState.products}
            options={dbState.product_options}
            tiers={dbState.price_tiers}
            relations={dbState.product_relations}
            settings={dbState.settings}
            onUpdateProduct={async (prod) => {
              await fetch('/api/db/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ table: 'products', item: prod }),
              });
              showToast(`Updated price for ${prod.sku}`, 'Desmond');
              fetchState();
            }}
            onAddProduct={() => {}}
          />
        )}

        {currentView === 'assets' && (
          <AssetLibraryView
            assets={dbState.assets}
            assetUsage={dbState.asset_usage}
            clients={dbState.clients}
            deliverables={dbState.deliverables}
            settings={dbState.settings}
            committedHours={committedHours}
          />
        )}

        {currentView === 'api_agent' && (
          <ApiAgentConnectView
            apiKeys={dbState.api_keys}
            onCreateKey={handleCreateKey}
            onRevokeKey={handleRevokeKey}
          />
        )}

        {currentView === 'verification' && <VerificationReportView />}

        {currentView === 'settings' && (
          <SettingsView
            settings={dbState.settings}
            stages={dbState.pipeline_stages}
            customFields={dbState.custom_field_defs}
            onUpdateSettings={handleUpdateSettings}
            onUpdateStage={() => {}}
            onPurgeSampleClient={handlePurgeSampleClient}
            onResetDatabase={handleResetDatabase}
          />
        )}
      </main>

      {/* CLIENT CARD CENTERPIECE (DRAWER/MODAL) */}
      {selectedClient && (
        <ClientCard
          client={selectedClient}
          stages={dbState.pipeline_stages}
          engagements={dbState.engagements.filter((e: Engagement) => e.client_id === selectedClient.id)}
          contacts={dbState.contacts.filter((c: any) => c.client_id === selectedClient.id)}
          requests={dbState.requests.filter((r: RequestItem) => r.client_id === selectedClient.id)}
          deliverables={dbState.deliverables.filter((d: any) => d.client_id === selectedClient.id)}
          quotes={dbState.quotes.filter((q: Quote) => q.client_id === selectedClient.id)}
          activities={dbState.activities.filter((a: Activity) => a.client_id === selectedClient.id)}
          tasks={dbState.tasks.filter((t: Task) => t.client_id === selectedClient.id)}
          questionnaires={dbState.questionnaires.filter((q: any) => q.client_id === selectedClient.id)}
          feedbackList={dbState.feedback}
          samplingCosts={dbState.sampling_costs}
          nbaItems={dbState.nba_items.filter((n: NbaItem) => n.client_id === selectedClient.id && n.status === 'open')}
          settings={dbState.settings}
          onClose={() => setSelectedClientId(null)}
          onMoveStage={handleMoveEngagement}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onAddRequest={handleAddRequest}
          onAddActivity={handleAddActivity}
          onGenerateQuestionnaire={handleGenerateQuestionnaire}
          onDraftQuote={handleDraftQuote}
          onDraftEmail={handleDraftEmail}
          onRecordFeedback={handleRecordFeedback}
          onExecuteNba={handleExecuteNba}
          currentActorName="Desmond"
        />
      )}

      {/* COMMAND PALETTE (CTRL/CMD+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        clients={dbState.clients}
        engagements={dbState.engagements}
        quotes={dbState.quotes}
        products={dbState.products}
        onSelectClient={(id) => setSelectedClientId(id)}
        onSelectQuote={(id) => {
          const q = dbState.quotes.find((item: Quote) => item.id === id);
          if (q) window.open(`/quote/${q.token}`, '_blank');
        }}
        onSelectProduct={() => setCurrentView('pricebook')}
        onNewClient={() => setShowNewClientModal(true)}
        onNewTask={() => {
          if (dbState.clients[0]) {
            handleAddTask({
              client_id: dbState.clients[0].id,
              title: 'Follow-up on operational priorities',
              priority: 'high',
            });
          }
        }}
        onNewQuote={() => {
          if (dbState.clients[0] && dbState.engagements[0]) {
            handleDraftQuote(dbState.clients[0].id, dbState.engagements[0].id);
          }
        }}
      />

      {/* REALTIME ACTION TOAST */}
      {liveToast && (
        <div className="fixed bottom-16 md:bottom-6 right-4 z-50 p-3 bg-[#0a1633] border border-cyan-500 rounded-lg shadow-2xl flex items-center gap-2.5 text-xs text-white animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <div className="font-semibold text-cyan-200">{liveToast.message}</div>
            <div className="text-[10px] text-slate-400 font-mono">Updated by {liveToast.actor}</div>
          </div>
        </div>
      )}

      {/* NEW CLIENT MODAL */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md bg-[#0a1329] border border-cyan-800 rounded-lg p-5 space-y-4 text-slate-100">
            <h3 className="font-bold text-white text-base">Register New Client</h3>

            <form onSubmit={handleCreateClientSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Client / Company Name *:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Apex Haulers or Sarah Ndlovu"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-[#070e20] text-slate-100 border border-slate-700 rounded p-2 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Industry:</label>
                <input
                  type="text"
                  placeholder="e.g. Logistics, Fintech, FMCG"
                  value={newClientIndustry}
                  onChange={(e) => setNewClientIndustry(e.target.value)}
                  className="w-full bg-[#070e20] text-slate-100 border border-slate-700 rounded p-2 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Website (optional):</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newClientWebsite}
                  onChange={(e) => setNewClientWebsite(e.target.value)}
                  className="w-full bg-[#070e20] text-slate-100 border border-slate-700 rounded p-2 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newClientName.trim()}
                  className="px-4 py-1.5 font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded disabled:opacity-50"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
