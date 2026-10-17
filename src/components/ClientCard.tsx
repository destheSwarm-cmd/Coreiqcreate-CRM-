import React, { useState } from 'react';
import {
  User,
  Phone,
  MessageCircle,
  Mail,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Send,
  Sparkles,
  FileText,
  DollarSign,
  Layers,
  ArrowRight,
  CheckSquare,
  HelpCircle,
  Calendar,
  X,
  Edit2,
  Trash2,
  Paperclip,
  Share2,
} from 'lucide-react';
import {
  Client,
  Contact,
  Engagement,
  PipelineStage,
  RequestItem,
  Deliverable,
  Quote,
  Activity,
  Task,
  Questionnaire,
  Feedback,
  SamplingCost,
  NbaItem,
  CrmSettings,
} from '../types/crm';

interface ClientCardProps {
  client: Client;
  stages: PipelineStage[];
  engagements: Engagement[];
  contacts: Contact[];
  requests: RequestItem[];
  deliverables: Deliverable[];
  quotes: Quote[];
  activities: Activity[];
  tasks: Task[];
  questionnaires: Questionnaire[];
  feedbackList: Feedback[];
  samplingCosts: SamplingCost[];
  nbaItems: NbaItem[];
  settings: CrmSettings;
  onClose: () => void;
  onMoveStage: (engagementId: string, toStageId: string, reason: string, override: boolean) => void;
  onAddTask: (task: Partial<Task>) => void;
  onToggleTask: (taskId: string) => void;
  onAddRequest: (req: Partial<RequestItem>) => void;
  onAddActivity: (act: Partial<Activity>) => void;
  onGenerateQuestionnaire: (clientId: string, engagementId: string) => void;
  onDraftQuote: (clientId: string, engagementId: string) => void;
  onDraftEmail: (type: 'followup' | 'quote' | 'upsell') => void;
  onRecordFeedback: (fb: Partial<Feedback>) => void;
  onExecuteNba: (nba: NbaItem) => void;
  currentActorName: string;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  stages,
  engagements,
  contacts,
  requests,
  deliverables,
  quotes,
  activities,
  tasks,
  questionnaires,
  feedbackList,
  samplingCosts,
  nbaItems,
  settings,
  onClose,
  onMoveStage,
  onAddTask,
  onToggleTask,
  onAddRequest,
  onAddActivity,
  onGenerateQuestionnaire,
  onDraftQuote,
  onDraftEmail,
  onRecordFeedback,
  onExecuteNba,
  currentActorName,
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedEngId, setSelectedEngId] = useState<string>(engagements[0]?.id || '');
  const [stageMoveModal, setStageMoveModal] = useState<{ open: boolean; targetStageId: string; reason: string }>({
    open: false,
    targetStageId: '',
    reason: '',
  });

  // Modal states for adding items
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');

  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [newReqTitle, setNewReqTitle] = useState('');
  const [newReqDesc, setNewReqDesc] = useState('');
  const [newReqCategory, setNewReqCategory] = useState('Automation');

  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [newNoteBody, setNewNoteBody] = useState('');
  const [newNoteType, setNewNoteType] = useState<'note' | 'call' | 'meeting'>('note');

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [fbSatisfaction, setFbSatisfaction] = useState(5);
  const [fbWouldPay, setFbWouldPay] = useState<'yes' | 'maybe' | 'no'>('yes');
  const [fbComments, setFbComments] = useState('');
  const [fbChanges, setFbChanges] = useState('');

  const currentEngagement = engagements.find((e) => e.id === selectedEngId) || engagements[0];
  const primaryContact = contacts.find((c) => c.is_primary) || contacts[0];

  const currentStage = stages.find((s) => s.id === currentEngagement?.stage_id);
  const daysInStage = currentEngagement
    ? Math.max(0, Math.floor((Date.now() - new Date(currentEngagement.stage_entered_at).getTime()) / (1000 * 3600 * 24)))
    : 0;

  const isOverSla = currentStage?.sla_days ? daysInStage > currentStage.sla_days : false;
  const isNearSla = currentStage?.sla_days ? daysInStage >= currentStage.sla_days * 0.8 && !isOverSla : false;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'requests', label: `Requests (${requests.length})` },
    { id: 'discovery', label: `Discovery (${questionnaires.length})` },
    { id: 'sampling', label: `Sampling (${deliverables.filter((d) => d.is_sample).length})` },
    { id: 'built', label: `Built (${deliverables.length})` },
    { id: 'quotes', label: `Quotes (${quotes.length})` },
    { id: 'emails', label: 'Emails' },
    { id: 'activity', label: `Activity (${activities.length})` },
    { id: 'tasks', label: `Tasks (${tasks.filter((t) => t.status === 'open').length})` },
    { id: 'files', label: 'Files' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-5xl bg-[#081126] border border-[#162445] rounded-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-100">
        {/* HEADER BAR */}
        <div className="px-5 py-4 border-b border-[#162445] bg-[#0a142e] shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">{client.name}</h1>
                <span className="font-mono text-xs text-cyan-400 bg-cyan-950/70 border border-cyan-800/80 px-2 py-0.5 rounded">
                  {client.client_code}
                </span>
                {client.is_sample && (
                  <span className="font-mono text-[10px] text-amber-300 bg-amber-950/80 border border-amber-800 px-1.5 py-0.5 rounded">
                    SAMPLE CLIENT
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                <span>{client.industry || 'Tech/Automation'}</span>
                <span>·</span>
                <span>Owner: <strong className="text-slate-200">{client.owner_actor}</strong></span>
                <span>·</span>
                <span>Source: {client.source}</span>
                {client.website && (
                  <>
                    <span>·</span>
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Health Score Badge & Quick Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Health Score with reasons dropdown tooltip */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 bg-[#0d1a38] border border-[#1e325c] rounded cursor-help"
                title={client.health_reasons?.join('\n') || 'Health Score computed from activity and SLA'}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    client.health_score >= 80 ? 'bg-emerald-400' : client.health_score >= 50 ? 'bg-amber-400' : 'bg-red-500'
                  }`}
                />
                <span className="text-xs font-mono font-bold text-slate-200">{client.health_score}</span>
                <span className="text-[10px] text-slate-400 uppercase">Health</span>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1.5">
                {primaryContact?.phone && (
                  <a
                    href={`tel:${primaryContact.phone}`}
                    className="p-2 text-slate-300 hover:text-white bg-[#0f1d3d] border border-[#1e325c] rounded hover:bg-[#162752]"
                    title={`Call ${primaryContact.full_name}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
                {primaryContact?.whatsapp && (
                  <a
                    href={`https://wa.me/${primaryContact.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-emerald-400 hover:text-emerald-300 bg-[#0f1d3d] border border-[#1e325c] rounded hover:bg-[#162752]"
                    title="Open WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                )}
                {primaryContact?.email && (
                  <a
                    href={`mailto:${primaryContact.email}`}
                    className="p-2 text-blue-400 hover:text-blue-300 bg-[#0f1d3d] border border-[#1e325c] rounded hover:bg-[#162752]"
                    title="Send Email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setShowNewTaskModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-cyan-300 bg-cyan-950/80 border border-cyan-800 rounded hover:bg-cyan-900"
                >
                  <Plus className="w-3 h-3" />
                  <span className="hidden sm:inline">Task</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* STAGE STEPPER */}
          {currentEngagement && (
            <div className="mt-4 pt-3 border-t border-[#162445]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">{currentEngagement.title}</span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {currentEngagement.engagement_code}
                  </span>
                  {engagements.length > 1 && (
                    <select
                      value={selectedEngId}
                      onChange={(e) => setSelectedEngId(e.target.value)}
                      className="bg-slate-900 text-[11px] text-slate-300 border border-slate-700 rounded px-1.5 py-0.5"
                    >
                      {engagements.map((eng) => (
                        <option key={eng.id} value={eng.id}>
                          {eng.engagement_code} - {eng.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="text-[11px] font-mono">
                  <span className="text-slate-400">Days in stage: </span>
                  <span className={`font-bold ${isOverSla ? 'text-red-400' : isNearSla ? 'text-amber-400' : 'text-slate-200'}`}>
                    {daysInStage}d {currentStage?.sla_days ? `/ ${currentStage.sla_days}d SLA` : ''}
                  </span>
                </div>
              </div>

              {/* Stepper Bar */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                {stages.map((stg, idx) => {
                  const isCurrent = stg.id === currentEngagement.stage_id;
                  const isPast = stages.findIndex((s) => s.id === currentEngagement.stage_id) > idx;

                  return (
                    <button
                      key={stg.id}
                      onClick={() => setStageMoveModal({ open: true, targetStageId: stg.id, reason: '' })}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-medium whitespace-nowrap transition-all border shrink-0 ${
                        isCurrent
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-xs'
                          : isPast
                          ? 'bg-[#0b162f] text-slate-300 border-slate-700 hover:border-slate-500'
                          : 'bg-[#060d1e] text-slate-500 border-[#142347] hover:border-slate-700'
                      }`}
                      title={stg.guidance_md}
                    >
                      <span className="font-mono text-[9px] opacity-70">{idx + 1}</span>
                      <span>{stg.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* GUIDANCE PANEL ("What to do now") */}
          {currentStage && (
            <div className="mt-3 p-3 bg-[#0d1a38] border border-cyan-900/60 rounded flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">Current Stage Guidance</span>
                  <span className="text-xs font-semibold text-white">· {currentStage.name}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{currentStage.guidance_md}</p>
              </div>

              {/* Next Best Actions as one-tap buttons */}
              <div className="flex items-center flex-wrap gap-2 shrink-0">
                {nbaItems.slice(0, 2).map((nba) => (
                  <button
                    key={nba.id}
                    onClick={() => onExecuteNba(nba)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{nba.title}</span>
                  </button>
                ))}
                {currentStage.key === 'sampling_review' && (
                  <button
                    onClick={() => setShowFeedbackModal(true)}
                    className="px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-800 rounded hover:bg-emerald-900"
                  >
                    Log Feedback
                  </button>
                )}
                {currentStage.key === 'proposal' && (
                  <button
                    onClick={() => onDraftQuote(client.id, currentEngagement.id)}
                    className="px-2.5 py-1 text-xs font-semibold text-cyan-300 bg-cyan-950/80 border border-cyan-800 rounded hover:bg-cyan-900"
                  >
                    Create Quote
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* TABS HEADER */}
        <div className="flex items-center px-4 border-b border-[#162445] bg-[#070e22] overflow-x-auto shrink-0 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-300">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Left Column: Key Details & Contacts */}
              <div className="space-y-4">
                <div className="p-3 bg-[#0d1a38] border border-[#162445] rounded">
                  <h3 className="font-bold text-white text-xs mb-2 uppercase tracking-wider">Primary Contact</h3>
                  {primaryContact ? (
                    <div className="space-y-1.5 text-slate-300">
                      <div className="font-semibold text-slate-100">{primaryContact.full_name}</div>
                      <div className="text-slate-400">{primaryContact.role_title || 'Lead Contact'}</div>
                      <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
                        <Mail className="w-3 h-3 text-cyan-400" />
                        <a href={`mailto:${primaryContact.email}`} className="hover:underline">{primaryContact.email}</a>
                      </div>
                      {primaryContact.phone && (
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-cyan-400" />
                          <span>{primaryContact.phone}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-500 italic">No contacts registered yet</div>
                  )}
                </div>

                {/* Custom Fields */}
                <div className="p-3 bg-[#0d1a38] border border-[#162445] rounded">
                  <h3 className="font-bold text-white text-xs mb-2 uppercase tracking-wider">Custom Fields</h3>
                  <div className="space-y-1.5">
                    {Object.entries(client.custom || {}).map(([key, val]) => (
                      <div key={key} className="flex justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="font-medium text-slate-200">{String(val)}</span>
                      </div>
                    ))}
                    {Object.keys(client.custom || {}).length === 0 && (
                      <div className="text-slate-500 italic">No custom field values</div>
                    )}
                  </div>
                </div>

                {/* Client Notes */}
                <div className="p-3 bg-[#0d1a38] border border-[#162445] rounded">
                  <h3 className="font-bold text-white text-xs mb-1 uppercase tracking-wider">Notes</h3>
                  <p className="text-slate-300 whitespace-pre-wrap">{client.notes || 'No general notes.'}</p>
                </div>
              </div>

              {/* Middle Column: Scoped Requests & Deliverables */}
              <div className="space-y-4">
                <div className="p-3 bg-[#0d1a38] border border-[#162445] rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Requests ({requests.length})</h3>
                    <button
                      onClick={() => setShowNewRequestModal(true)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {requests.map((r) => (
                      <div key={r.id} className="p-2 bg-[#091226] border border-slate-800 rounded">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{r.title}</span>
                          <span className="font-mono text-[10px] text-cyan-400 uppercase">{r.status}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-1 line-clamp-2">{r.description}</p>
                      </div>
                    ))}
                    {requests.length === 0 && <div className="text-slate-500 italic">No scoped requests yet.</div>}
                  </div>
                </div>

                {/* Quick sampling cost stats */}
                <div className="p-3 bg-[#0d1a38] border border-[#162445] rounded">
                  <h3 className="font-bold text-white text-xs mb-2 uppercase tracking-wider">Sampling Metrics</h3>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-[#091226] rounded border border-slate-800">
                      <div className="text-lg font-bold font-mono text-cyan-400">
                        {samplingCosts.reduce((acc, c) => acc + c.hours, 0)}h
                      </div>
                      <div className="text-[10px] text-slate-400">Hours Invested</div>
                    </div>
                    <div className="p-2 bg-[#091226] rounded border border-slate-800">
                      <div className="text-lg font-bold font-mono text-emerald-400">
                        {feedbackList.length > 0 ? `${feedbackList[feedbackList.length - 1].satisfaction}/5` : 'N/A'}
                      </div>
                      <div className="text-[10px] text-slate-400">Latest Score</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Latest Timeline & Tasks */}
              <div className="space-y-4">
                <div className="p-3 bg-[#0d1a38] border border-[#162445] rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Tasks ({tasks.filter((t) => t.status === 'open').length})</h3>
                    <button
                      onClick={() => setShowNewTaskModal(true)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {tasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-start gap-2 p-1.5 rounded hover:bg-slate-800/40"
                      >
                        <input
                          type="checkbox"
                          checked={t.status === 'done'}
                          onChange={() => onToggleTask(t.id)}
                          className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                        />
                        <div className="flex-1">
                          <div className={`font-medium ${t.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {t.title}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Due: {t.due_at.split('T')[0]} · {t.assignee_actor}
                          </div>
                        </div>
                      </div>
                    ))}
                    {tasks.length === 0 && <div className="text-slate-500 italic">No tasks created.</div>}
                  </div>
                </div>

                {/* Latest Activity */}
                <div className="p-3 bg-[#0d1a38] border border-[#162445] rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider">Latest Activity</h3>
                    <button
                      onClick={() => setShowNewNoteModal(true)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Note</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {activities.slice(0, 3).map((a) => (
                      <div key={a.id} className="border-l-2 border-cyan-800 pl-2 py-0.5">
                        <div className="font-medium text-slate-200">{a.summary}</div>
                        <div className="text-[10px] text-slate-400">
                          {a.actor_name} · {new Date(a.occurred_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Client Project Requests & Scope</h3>
                  <p className="text-slate-400">Every deliverable item requested by the client or captured via questionnaire.</p>
                </div>
                <button
                  onClick={() => setShowNewRequestModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/80 border border-cyan-800 rounded hover:bg-cyan-900"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Request</span>
                </button>
              </div>

              <div className="space-y-3">
                {requests.map((r) => (
                  <div key={r.id} className="p-3 bg-[#0d1a38] border border-[#162445] rounded">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{r.title}</span>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {r.category}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-cyan-400 uppercase font-semibold">{r.status}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed mb-2">{r.description}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                      <span>Source: {r.source}</span>
                      <span>Priority: {r.priority}</span>
                      <span>Logged by: {r.created_by_actor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DISCOVERY */}
          {activeTab === 'discovery' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Interactive Discovery Questionnaires</h3>
                  <p className="text-slate-400">Send questionnaire to client without requiring login.</p>
                </div>
                <button
                  onClick={() => onGenerateQuestionnaire(client.id, currentEngagement.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950 border border-cyan-700 rounded hover:bg-cyan-900"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Governor: Generate Questionnaire</span>
                </button>
              </div>

              {questionnaires.map((qn) => (
                <div key={qn.id} className="p-4 bg-[#0d1a38] border border-[#162445] rounded space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{qn.title}</h4>
                      <div className="text-[11px] text-slate-400">
                        Status: <strong className="text-cyan-400 uppercase font-mono">{qn.status}</strong> · Expires: {qn.expires_at.split('T')[0]}
                      </div>
                    </div>
                    <a
                      href={`/q/${qn.token}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-200 bg-[#122247] hover:bg-[#182d5e] border border-cyan-800/80 rounded"
                    >
                      <span>Public Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* AI Synthesized Requirements Brief */}
                  {qn.ai_summary && (
                    <div className="p-3 bg-[#081126] border border-cyan-900/50 rounded">
                      <div className="flex items-center gap-1.5 font-bold text-cyan-400 text-xs mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Governor AI Requirements Summary</span>
                      </div>
                      <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{qn.ai_summary}</p>
                    </div>
                  )}

                  {/* Questions count */}
                  <div className="text-slate-400 text-[11px]">
                    Questions included: {qn.questions.length} items (What the business does, outcomes, pain points, budget, sample criteria).
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: SAMPLING */}
          {activeTab === 'sampling' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Free Working Sample Deliverables & Feedback</h3>
                  <p className="text-slate-400">Track sample builds, days waiting for feedback, and client satisfaction.</p>
                </div>
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950 border border-emerald-800 rounded hover:bg-emerald-900"
                >
                  Record Feedback
                </button>
              </div>

              {/* Sample Deliverables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deliverables
                  .filter((d) => d.is_sample)
                  .map((d) => (
                    <div key={d.id} className="p-3 bg-[#0d1a38] border border-[#162445] rounded space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{d.name}</span>
                        <span className="font-mono text-[10px] text-cyan-400 uppercase">{d.status}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{d.description}</p>
                      <div className="flex items-center gap-2 pt-2">
                        {d.live_url && (
                          <a
                            href={d.live_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-cyan-300 bg-cyan-950/80 border border-cyan-800 rounded"
                          >
                            <span>Live Demo</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {d.repo_url && (
                          <a
                            href={d.repo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 bg-slate-900 border border-slate-700 rounded"
                          >
                            <span>Repo</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Feedback History */}
              <div className="p-3 bg-[#0d1a38] border border-[#162445] rounded">
                <h4 className="font-bold text-white text-xs mb-2 uppercase tracking-wider">Feedback History</h4>
                <div className="space-y-2">
                  {feedbackList.map((f) => (
                    <div key={f.id} className="p-2.5 bg-[#091226] border border-slate-800 rounded">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 font-bold text-sm">Rating: {f.satisfaction}/5</span>
                          <span className="text-slate-400">· Would pay: <strong className="text-slate-200 capitalize">{f.would_pay}</strong></span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{f.source}</span>
                      </div>
                      <p className="text-slate-300 mt-1">{f.comments}</p>
                      {f.requested_changes && (
                        <div className="mt-1 text-amber-300 text-[11px]">
                          <strong>Requested Changes:</strong> {f.requested_changes}
                        </div>
                      )}
                    </div>
                  ))}
                  {feedbackList.length === 0 && <div className="text-slate-500 italic">No feedback recorded yet.</div>}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BUILT */}
          {activeTab === 'built' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Built Software Gallery ("Stock is Software")</h3>
                  <p className="text-slate-400">All live apps, agents, websites, workflows, and integrations built for this client.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deliverables.map((d) => (
                  <div key={d.id} className="p-3 bg-[#0d1a38] border border-[#162445] rounded space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{d.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {d.deliverable_code} · v{d.version} · {d.kind}
                        </div>
                      </div>
                      <span className="font-mono text-xs text-emerald-400 uppercase font-bold">{d.status}</span>
                    </div>

                    <p className="text-slate-300 text-[11px] leading-relaxed">{d.description}</p>

                    <div className="flex flex-wrap gap-1">
                      {d.tech_stack?.map((t) => (
                        <span key={t} className="text-[10px] text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                      {d.live_url && (
                        <a
                          href={d.live_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-cyan-300 bg-cyan-950 border border-cyan-800 rounded hover:bg-cyan-900"
                        >
                          <span>Open Live</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {d.repo_url && (
                        <a
                          href={d.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-xs text-slate-300 bg-slate-900 border border-slate-700 rounded hover:bg-slate-800"
                        >
                          Repository
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: QUOTES */}
          {activeTab === 'quotes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Commercial Quotes & Proposals</h3>
                  <p className="text-slate-400">Versions, terms, online acceptance, and generated build briefs.</p>
                </div>
                <button
                  onClick={() => onDraftQuote(client.id, currentEngagement.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950 border border-cyan-800 rounded hover:bg-cyan-900"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Draft Quote</span>
                </button>
              </div>

              {quotes.map((q) => (
                <div key={q.id} className="p-4 bg-[#0d1a38] border border-[#162445] rounded space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">{q.quote_code}</span>
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                            q.status === 'accepted'
                              ? 'text-emerald-400 bg-emerald-950 border border-emerald-800'
                              : q.status === 'sent'
                              ? 'text-cyan-400 bg-cyan-950 border border-cyan-800'
                              : q.status === 'pending_approval'
                              ? 'text-amber-400 bg-amber-950 border border-amber-800'
                              : 'text-slate-400 bg-slate-900 border border-slate-800'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Total: <strong className="text-cyan-300 font-mono text-sm">{q.total} {q.currency}</strong> (VAT incl) · Valid until: {q.valid_until}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`/quote/${q.token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-[#122247] hover:bg-[#182d5e] border border-cyan-800 rounded"
                      >
                        <span>View Proposal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {q.status === 'accepted' && q.accepted_by_name && (
                    <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/80 rounded text-emerald-200 text-xs">
                      ✓ Accepted by <strong>{q.accepted_by_name}</strong> on {new Date(q.accepted_at!).toLocaleDateString()}.
                      Build Brief generated for Hermes / Odin nodes.
                    </div>
                  )}
                </div>
              ))}
              {quotes.length === 0 && <div className="text-slate-500 italic">No quotes created for this client yet.</div>}
            </div>
          )}

          {/* TAB 7: EMAILS */}
          {activeTab === 'emails' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Threaded Email Inbox & Cadences</h3>
                  <p className="text-slate-400">Current Send-Mode: <strong className="text-cyan-400 uppercase font-mono">{settings.send_mode}</strong></p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDraftEmail('followup')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950 border border-cyan-800 rounded hover:bg-cyan-900"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Draft Follow-up</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#0d1a38] border border-[#162445] rounded space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-semibold text-white">Recent Inbound / Outbound Messages</span>
                  <span className="text-[11px] text-slate-400 font-mono">provider: Resend</span>
                </div>
                <div className="p-2.5 bg-[#091226] border border-slate-800 rounded">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-200">Freight dispatch inquiry</span>
                    <span className="font-mono text-cyan-400">received</span>
                  </div>
                  <p className="text-slate-300 mt-1">
                    "Hi Desmond, we need a way to auto-notify drivers when they leave the yard. Can you help?"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ACTIVITY */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white">Unified Audit & Activity Timeline</h3>
                <button
                  onClick={() => setShowNewNoteModal(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950 border border-cyan-800 rounded hover:bg-cyan-900"
                >
                  + Add Timeline Note
                </button>
              </div>

              <div className="space-y-2">
                {activities.map((a) => (
                  <div key={a.id} className="p-3 bg-[#0d1a38] border border-[#162445] rounded">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{a.summary}</span>
                        <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {a.type}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-cyan-400">
                        {a.actor_type === 'agent' ? `Agent [${a.actor_name}]` : a.actor_name}
                      </span>
                    </div>
                    {a.body && <p className="text-slate-300 text-xs mt-1 leading-relaxed">{a.body}</p>}
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {new Date(a.occurred_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Operator Tasks</h3>
                <button
                  onClick={() => setShowNewTaskModal(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950 border border-cyan-800 rounded hover:bg-cyan-900"
                >
                  + New Task
                </button>
              </div>

              <div className="space-y-2">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-[#0d1a38] border border-[#162445] rounded">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={t.status === 'done'}
                        onChange={() => onToggleTask(t.id)}
                        className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                      />
                      <div>
                        <div className={`font-semibold ${t.status === 'done' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                          {t.title}
                        </div>
                        {t.description && <div className="text-slate-400 text-[11px]">{t.description}</div>}
                      </div>
                    </div>
                    <div className="text-right font-mono text-[10px] text-slate-400">
                      <div>Due: {t.due_at.split('T')[0]}</div>
                      <div>{t.assignee_actor}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: FILES */}
          {activeTab === 'files' && (
            <div className="p-4 bg-[#0d1a38] border border-[#162445] rounded space-y-3 text-center py-10">
              <Paperclip className="w-8 h-8 text-cyan-400 mx-auto opacity-70" />
              <div className="font-bold text-white">Supabase Storage / Client Files</div>
              <p className="text-slate-400 max-w-md mx-auto">
                Private client storage bucket with signed URLs. No secrets or credentials are stored here.
              </p>
              <button className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700">
                Upload File or Asset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* STAGE MOVE SHEET / MODAL */}
      {stageMoveModal.open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md bg-[#0a1329] border border-cyan-800 rounded-lg p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Transition Pipeline Stage</h3>
            <p className="text-xs text-slate-300">
              Moving to <strong>{stages.find((s) => s.id === stageMoveModal.targetStageId)?.name}</strong> requires a logged reason.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason for Move <span className="text-red-400">*</span>:
              </label>
              <textarea
                value={stageMoveModal.reason}
                onChange={(e) => setStageMoveModal({ ...stageMoveModal, reason: e.target.value })}
                placeholder="e.g. Sample verified with client; ready for quote"
                className="w-full bg-[#070e20] text-xs text-slate-200 border border-slate-700 rounded p-2.5 focus:border-cyan-500 focus:outline-none"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setStageMoveModal({ open: false, targetStageId: '', reason: '' })}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={stageMoveModal.reason.trim().length < 3}
                onClick={() => {
                  onMoveStage(currentEngagement.id, stageMoveModal.targetStageId, stageMoveModal.reason, true);
                  setStageMoveModal({ open: false, targetStageId: '', reason: '' });
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded"
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW TASK MODAL */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-sm bg-[#0a1329] border border-cyan-800 rounded-lg p-5 space-y-3">
            <h3 className="font-bold text-white text-sm">Add Operator Task</h3>
            <input
              type="text"
              placeholder="Task Title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full bg-[#070e20] text-xs text-slate-200 border border-slate-700 rounded p-2 focus:border-cyan-500 focus:outline-none"
            />
            <input
              type="date"
              value={newTaskDue}
              onChange={(e) => setNewTaskDue(e.target.value)}
              className="w-full bg-[#070e20] text-xs text-slate-200 border border-slate-700 rounded p-2 focus:border-cyan-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowNewTaskModal(false)} className="px-3 py-1 text-xs text-slate-400">Cancel</button>
              <button
                disabled={!newTaskTitle}
                onClick={() => {
                  onAddTask({
                    client_id: client.id,
                    engagement_id: currentEngagement?.id || null,
                    title: newTaskTitle,
                    due_at: newTaskDue ? `${newTaskDue}T17:00:00Z` : new Date().toISOString(),
                    priority: 'high',
                    status: 'open',
                    assignee_actor: currentActorName,
                    source: 'manual',
                  });
                  setNewTaskTitle('');
                  setShowNewTaskModal(false);
                }}
                className="px-3 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded"
              >
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW REQUEST MODAL */}
      {showNewRequestModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md bg-[#0a1329] border border-cyan-800 rounded-lg p-5 space-y-3">
            <h3 className="font-bold text-white text-sm">Log Client Request / Scope Item</h3>
            <input
              type="text"
              placeholder="Request title..."
              value={newReqTitle}
              onChange={(e) => setNewReqTitle(e.target.value)}
              className="w-full bg-[#070e20] text-xs text-slate-200 border border-slate-700 rounded p-2 focus:border-cyan-500 focus:outline-none"
            />
            <textarea
              placeholder="Detailed description of what the client wants us to do..."
              value={newReqDesc}
              onChange={(e) => setNewReqDesc(e.target.value)}
              rows={3}
              className="w-full bg-[#070e20] text-xs text-slate-200 border border-slate-700 rounded p-2 focus:border-cyan-500 focus:outline-none"
            />
            <select
              value={newReqCategory}
              onChange={(e) => setNewReqCategory(e.target.value)}
              className="w-full bg-[#070e20] text-xs text-slate-200 border border-slate-700 rounded p-2"
            >
              {['AI Agent', 'Automation', 'App', 'Website', 'Mobile App', 'Voice AI', 'Chatbot', 'Integration', 'Other'].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowNewRequestModal(false)} className="px-3 py-1 text-xs text-slate-400">Cancel</button>
              <button
                disabled={!newReqTitle}
                onClick={() => {
                  onAddRequest({
                    client_id: client.id,
                    engagement_id: currentEngagement?.id || '',
                    title: newReqTitle,
                    description: newReqDesc,
                    category: newReqCategory,
                    priority: 'high',
                    status: 'scoped',
                    source: 'manual',
                  });
                  setNewReqTitle('');
                  setNewReqDesc('');
                  setShowNewRequestModal(false);
                }}
                className="px-3 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded"
              >
                Save Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW NOTE MODAL */}
      {showNewNoteModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md bg-[#0a1329] border border-cyan-800 rounded-lg p-5 space-y-3">
            <h3 className="font-bold text-white text-sm">Add Timeline Activity Note</h3>
            <select
              value={newNoteType}
              onChange={(e) => setNewNoteType(e.target.value as any)}
              className="w-full bg-[#070e20] text-xs text-slate-200 border border-slate-700 rounded p-2"
            >
              <option value="note">Internal Note</option>
              <option value="call">Phone Call Summary</option>
              <option value="meeting">Meeting Notes</option>
            </select>
            <textarea
              placeholder="What happened or was discussed..."
              value={newNoteBody}
              onChange={(e) => setNewNoteBody(e.target.value)}
              rows={4}
              className="w-full bg-[#070e20] text-xs text-slate-200 border border-slate-700 rounded p-2 focus:border-cyan-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowNewNoteModal(false)} className="px-3 py-1 text-xs text-slate-400">Cancel</button>
              <button
                disabled={!newNoteBody}
                onClick={() => {
                  onAddActivity({
                    client_id: client.id,
                    engagement_id: currentEngagement?.id || null,
                    type: newNoteType,
                    summary: `${newNoteType.toUpperCase()}: ${newNoteBody.slice(0, 40)}...`,
                    body: newNoteBody,
                    actor_type: 'human',
                    actor_name: currentActorName,
                  });
                  setNewNoteBody('');
                  setShowNewNoteModal(false);
                }}
                className="px-3 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded"
              >
                Log Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK RECORD MODAL */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md bg-[#0a1329] border border-emerald-800 rounded-lg p-5 space-y-3 text-slate-100">
            <h3 className="font-bold text-white text-sm">Record Sample Feedback</h3>
            <div>
              <label className="block text-xs font-semibold mb-1">Satisfaction Score (1-5):</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setFbSatisfaction(score)}
                    className={`flex-1 py-1.5 rounded font-mono font-bold text-xs border ${
                      fbSatisfaction === score ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-900 border-slate-700'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Would they pay for this?</label>
              <div className="flex gap-2">
                {(['yes', 'maybe', 'no'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFbWouldPay(opt)}
                    className={`flex-1 py-1 rounded text-xs capitalize border ${
                      fbWouldPay === opt ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 border-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              placeholder="Client verbal comments..."
              value={fbComments}
              onChange={(e) => setFbComments(e.target.value)}
              rows={2}
              className="w-full bg-[#070e20] text-xs border border-slate-700 rounded p-2"
            />

            <textarea
              placeholder="Requested changes (if any)..."
              value={fbChanges}
              onChange={(e) => setFbChanges(e.target.value)}
              rows={2}
              className="w-full bg-[#070e20] text-xs border border-slate-700 rounded p-2"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowFeedbackModal(false)} className="px-3 py-1 text-xs text-slate-400">Cancel</button>
              <button
                onClick={() => {
                  onRecordFeedback({
                    engagement_id: currentEngagement?.id || '',
                    satisfaction: fbSatisfaction,
                    would_pay: fbWouldPay,
                    comments: fbComments,
                    requested_changes: fbChanges,
                    source: 'call',
                  });
                  setShowFeedbackModal(false);
                }}
                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded"
              >
                Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
