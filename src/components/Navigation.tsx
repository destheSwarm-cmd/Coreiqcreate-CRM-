import React, { useState, useEffect } from 'react';
import {
  Kanban,
  Table,
  Users,
  CheckSquare,
  Package,
  Boxes,
  Bot,
  FileCheck2,
  Settings,
  ShieldCheck,
  Search,
  Menu,
  X,
  Calendar,
  Layers,
  LayoutDashboard,
  LogOut,
  Receipt,
  DollarSign,
  Plus,
  Pause,
  Play,
  Activity,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { AppRole } from '../types/crm';

export type MainNavView =
  | 'pipeline'
  | 'dashboard'
  | 'table'
  | 'calendar'
  | 'clients'
  | 'tasks'
  | 'money'
  | 'pricebook'
  | 'assets'
  | 'api_agent'
  | 'verification'
  | 'settings'
  | 'pricing_terms'
  | 'agent_activity';

interface NavigationProps {
  currentView: MainNavView;
  onNavigate: (view: MainNavView) => void;
  onOpenCommandPalette: () => void;
  currentRole: AppRole;
  onRoleChange?: (role: AppRole) => void;
  brandName: string;
  userEmail?: string;
  onSignOut?: () => void;
  agentsPaused?: boolean;
  onToggleAgentsPaused?: () => void;
  onQuickNew?: () => void;
  unreadIntakeCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  onOpenCommandPalette,
  currentRole,
  onRoleChange,
  brandName,
  userEmail,
  onSignOut,
  agentsPaused = false,
  onToggleAgentsPaused,
  onQuickNew,
  unreadIntakeCount = 0,
}) => {
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  // Android back-button integration: push history entry when More sheet opens
  useEffect(() => {
    if (moreSheetOpen) {
      window.history.pushState({ sheet: 'more' }, '');
      const handlePopState = () => {
        setMoreSheetOpen(false);
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [moreSheetOpen]);

  const handleCloseMoreSheet = () => {
    if (window.history.state?.sheet === 'more') {
      window.history.back();
    } else {
      setMoreSheetOpen(false);
    }
  };

  const navItems: { id: MainNavView; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'pipeline', label: 'Pipeline', icon: <Kanban className="w-5 h-5" /> },
    { id: 'clients', label: 'Clients', icon: <Users className="w-5 h-5" /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'money', label: 'Money (Quotes/Invoices)', icon: <DollarSign className="w-5 h-5" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'table', label: 'Data Table', icon: <Table className="w-5 h-5" /> },
    { id: 'calendar', label: 'Sales Diary', icon: <Calendar className="w-5 h-5" /> },
    { id: 'pricebook', label: 'Price Book', icon: <Package className="w-5 h-5" /> },
    { id: 'assets', label: 'Asset Library', icon: <Boxes className="w-5 h-5" /> },
    { id: 'pricing_terms', label: 'Pricing & Terms', icon: <Receipt className="w-5 h-5" /> },
    { id: 'agent_activity', label: 'Agent Activity', icon: <Activity className="w-5 h-5" /> },
    { id: 'api_agent', label: 'MCP & Agent Hub', icon: <Bot className="w-5 h-5" /> },
    { id: 'verification', label: 'Part C Verification', icon: <FileCheck2 className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  // Secondary items shown in the full-screen "More" sheet
  const moreSheetItems: { id: MainNavView; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 text-cyan-400" />, desc: 'Needs you, follow-ups, and executive metrics' },
    { id: 'table', label: 'Data Table', icon: <Table className="w-5 h-5 text-blue-400" />, desc: 'Tabular client directory with sticky first column' },
    { id: 'calendar', label: 'Sales Diary', icon: <Calendar className="w-5 h-5 text-purple-400" />, desc: 'Timeline diary of closing dates and follow-ups' },
    { id: 'pricebook', label: 'Price Book', icon: <Package className="w-5 h-5 text-amber-400" />, desc: 'Product catalog, base pricing, and tiers' },
    { id: 'assets', label: 'Asset Library', icon: <Boxes className="w-5 h-5 text-emerald-400" />, desc: 'Reusable code assets and automation templates' },
    { id: 'pricing_terms', label: 'Pricing & Terms', icon: <Receipt className="w-5 h-5 text-indigo-400" />, desc: 'Commercial banking details, deposit % and terms' },
    { id: 'agent_activity', label: 'Agent Activity', icon: <Activity className="w-5 h-5 text-pink-400" />, desc: 'Live audit log of autonomous agents and tools' },
    { id: 'api_agent', label: 'MCP & Agent Hub', icon: <Bot className="w-5 h-5 text-cyan-400" />, desc: '34 MCP tools, scopes, and Claude agent keys' },
    { id: 'verification', label: 'Part C Verification', icon: <FileCheck2 className="w-5 h-5 text-emerald-400" />, desc: '14-point automated test suite' },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5 text-slate-400" />, desc: 'Postgres schema status, branding, and exports' },
  ];

  return (
    <>
      {/* Desktop Left Sidebar (Visible >= 1024px) */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#081126] border-r border-[#162445] shrink-0 h-screen select-none">
        {/* Brand Lockup */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#162445]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center shadow-md">
              <span className="font-bold text-cyan-400 text-sm font-mono">IQ</span>
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight">{brandName}</span>
              <div className="text-[10px] text-cyan-400 font-mono">CoreIQ Operator</div>
            </div>
          </div>

          {/* Agents Pause Global Switch */}
          {onToggleAgentsPaused && (
            <button
              onClick={onToggleAgentsPaused}
              title={agentsPaused ? 'Agents Paused - Click to Resume' : 'Agents Active - Click to Pause'}
              className={`p-1.5 rounded-lg border flex items-center gap-1 text-[11px] font-mono transition-all ${
                agentsPaused
                  ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              }`}
            >
              {agentsPaused ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Command Search Bar Trigger */}
        <div className="p-3">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-400 bg-[#0d1a38] hover:bg-[#122247] border border-[#1e325c] rounded-lg transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Search / Jump...</span>
            </div>
            <kbd className="font-mono text-[10px] text-slate-400 bg-[#070e20] px-1.5 py-0.5 rounded border border-slate-700">⌘K</kbd>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-1 text-xs">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-left ${
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-800 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#0f1d3d]'
                }`}
              >
                <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.id === 'pipeline' && unreadIntakeCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-cyan-500 text-black font-bold font-mono text-[10px] rounded-full">
                    {unreadIntakeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Role Display & Operator Identity */}
        <div className="p-3 border-t border-[#162445] bg-[#060c1c]">
          <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Verified Server Role</span>
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
              currentRole === 'owner' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
              currentRole === 'admin' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
              currentRole === 'operator' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
              'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              {currentRole}
            </span>
          </div>
          {userEmail && (
            <div className="text-[11px] text-slate-300 truncate font-mono mb-2" title={userEmail}>
              {userEmail}
            </div>
          )}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-2 bg-[#0d1a38] hover:bg-red-950/60 text-slate-300 hover:text-red-300 text-xs rounded-lg border border-[#1e325c] hover:border-red-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Top Mobile & Tablet Header (< 1024px) */}
      <header className="lg:hidden flex items-center justify-between px-3 py-2.5 bg-[#081126] border-b border-[#162445] sticky top-0 z-40 safe-area-pt">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center">
            <span className="font-bold text-cyan-400 text-xs font-mono">IQ</span>
          </div>
          <span className="text-sm font-bold text-white capitalize">{currentView.replace(/_/g, ' ')}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick New Button (+) */}
          {onQuickNew && (
            <button
              onClick={onQuickNew}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm"
              title="Add New Client"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}

          {/* Search Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white rounded-lg bg-[#0d1a38] border border-[#1e325c]"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Agents Paused Switch */}
          {onToggleAgentsPaused && (
            <button
              onClick={onToggleAgentsPaused}
              title={agentsPaused ? 'Resume Agents' : 'Pause All Agents'}
              className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all ${
                agentsPaused
                  ? 'bg-amber-950 text-amber-300 border-amber-700'
                  : 'bg-[#0d1a38] text-slate-300 border-[#1e325c]'
              }`}
            >
              {agentsPaused ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
            </button>
          )}
        </div>
      </header>

      {/* FULL-SCREEN "MORE" SHEET (Below 1024px) */}
      {moreSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[#04091A] text-slate-100 flex flex-col safe-area-pt safe-area-pb animate-in fade-in duration-150">
          {/* Top Bar with Android Back Button / Close */}
          <div className="px-4 py-3 bg-[#081126] border-b border-[#162445] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">More Modules</span>
              <span className="text-xs text-slate-400 font-mono">CoreIQ Operator</span>
            </div>
            <button
              onClick={handleCloseMoreSheet}
              className="p-2 text-slate-300 hover:text-white rounded-lg bg-[#0d1a38] border border-[#1e325c]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sheet List of Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-20">
            {moreSheetItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  handleCloseMoreSheet();
                }}
                className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                  currentView === item.id
                    ? 'bg-cyan-950/80 border-cyan-800 text-white'
                    : 'bg-[#081126] border-[#162445] hover:border-[#1e325c] text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-lg bg-[#0d1a38] border border-[#1e325c]">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{item.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>
            ))}

            {/* Operator Auth Details & Sign Out */}
            <div className="pt-4 mt-4 border-t border-[#162445] space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Verified Role:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-950 text-purple-300 border border-purple-800">
                  {currentRole}
                </span>
              </div>
              {userEmail && (
                <div className="text-xs text-slate-300 font-mono truncate">
                  {userEmail}
                </div>
              )}
              {onSignOut && (
                <button
                  onClick={() => {
                    handleCloseMoreSheet();
                    onSignOut();
                  }}
                  className="w-full py-3 px-4 bg-red-950/50 hover:bg-red-950 text-red-200 text-xs font-semibold rounded-lg border border-red-800 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Operator Workspace</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Tab Bar (< 1024px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#060c1c] border-t border-[#162445] flex items-center justify-around h-16 px-1 safe-area-pb select-none">
        <button
          onClick={() => onNavigate('pipeline')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] relative ${
            currentView === 'pipeline' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Kanban className="w-5 h-5" />
          <span className="text-[11px] mt-0.5 font-medium">Pipeline</span>
          {unreadIntakeCount > 0 && (
            <span className="absolute top-1.5 right-4 w-4 h-4 bg-cyan-400 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadIntakeCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onNavigate('clients')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] ${
            currentView === 'clients' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[11px] mt-0.5 font-medium">Clients</span>
        </button>

        <button
          onClick={() => onNavigate('tasks')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] ${
            currentView === 'tasks' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[11px] mt-0.5 font-medium">Tasks</span>
        </button>

        <button
          onClick={() => onNavigate('money')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] ${
            currentView === 'money' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[11px] mt-0.5 font-medium">Money</span>
        </button>

        <button
          onClick={() => setMoreSheetOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] ${
            moreSheetOpen ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[11px] mt-0.5 font-medium">More</span>
        </button>
      </nav>
    </>
  );
};
