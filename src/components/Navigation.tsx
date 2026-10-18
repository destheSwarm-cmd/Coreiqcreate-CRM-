import React from 'react';
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
  | 'pricebook'
  | 'assets'
  | 'api_agent'
  | 'verification'
  | 'settings';

interface NavigationProps {
  currentView: MainNavView;
  onNavigate: (view: MainNavView) => void;
  onOpenCommandPalette: () => void;
  currentRole: AppRole;
  onRoleChange?: (role: AppRole) => void;
  brandName: string;
  userEmail?: string;
  onSignOut?: () => void;
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
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems: { id: MainNavView; label: string; icon: React.ReactNode; group?: string }[] = [
    { id: 'pipeline', label: 'Pipeline', icon: <Kanban className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'table', label: 'Data Table', icon: <Table className="w-4 h-4" /> },
    { id: 'calendar', label: 'Sales Diary', icon: <Calendar className="w-4 h-4" /> },
    { id: 'clients', label: 'Clients', icon: <Users className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'pricebook', label: 'Price Book', icon: <Package className="w-4 h-4" /> },
    { id: 'assets', label: 'Asset Library', icon: <Boxes className="w-4 h-4" /> },
    { id: 'api_agent', label: 'MCP & Agent Hub', icon: <Bot className="w-4 h-4" /> },
    { id: 'verification', label: 'Part C Verification', icon: <FileCheck2 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-[#081126] border-r border-[#162445] shrink-0 h-screen select-none">
        {/* Brand Lockup */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#162445]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center">
              <span className="font-bold text-cyan-400 text-xs font-mono">IQ</span>
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight">{brandName}</span>
              <div className="text-[10px] text-cyan-400 font-mono">CoreIQ Operator</div>
            </div>
          </div>
        </div>

        {/* Command Search Bar Trigger */}
        <div className="p-3">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-400 bg-[#0d1a38] hover:bg-[#122247] border border-[#1e325c] rounded transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Search / Jump...</span>
            </div>
            <kbd className="font-mono text-[10px] text-slate-400 bg-[#070e20] px-1.5 py-0.5 rounded border border-slate-700">⌘K</kbd>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 text-xs">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded transition-all font-medium text-left ${
                  isActive
                    ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1d3d]'
                }`}
              >
                <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>{item.icon}</span>
                <span>{item.label}</span>
                {item.id === 'verification' && (
                  <span className="ml-auto text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-800">
                    PASS
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Role Display & Operator Identity (from server) */}
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
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#0d1a38] hover:bg-red-950/60 text-slate-300 hover:text-red-300 text-xs rounded border border-[#1e325c] hover:border-red-800 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          )}
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Auth: Supabase</span>
            <span className="text-emerald-400">● Live</span>
          </div>
        </div>
      </aside>

      {/* Top Mobile / Tablet Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#081126] border-b border-[#162445] sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-cyan-950 border border-cyan-500/40 flex items-center justify-center">
            <span className="font-bold text-cyan-400 text-[10px] font-mono">IQ</span>
          </div>
          <span className="text-sm font-bold text-white">{brandName}</span>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton />
          <button
            onClick={onOpenCommandPalette}
            className="p-2 text-slate-400 hover:text-white rounded bg-[#0d1a38] border border-[#1e325c]"
            title="Command Palette"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white rounded bg-[#0d1a38] border border-[#1e325c]"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 top-[53px] bg-black/80 backdrop-blur-xs">
          <div className="bg-[#081126] border-b border-[#162445] p-4 max-h-[80vh] overflow-y-auto">
            <div className="space-y-1 mb-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded text-sm text-left ${
                    currentView === item.id
                      ? 'bg-cyan-950 text-cyan-300 font-semibold'
                      : 'text-slate-300 hover:bg-[#0f1d3d]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-[#162445] space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Verified Server Role:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  currentRole === 'owner' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                  currentRole === 'admin' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                  currentRole === 'operator' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                  'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {currentRole}
                </span>
              </div>
              {userEmail && (
                <div className="text-[11px] text-slate-300 truncate font-mono">
                  {userEmail}
                </div>
              )}
              {onSignOut && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-red-950/40 hover:bg-red-950/70 text-red-200 text-xs rounded border border-red-800 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Bar (Pipeline, Clients, Tasks, Quotes/PriceBook, More) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#060c1c] border-t border-[#162445] flex items-center justify-around h-14 px-2 safe-area-pb">
        <button
          onClick={() => onNavigate('pipeline')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] ${
            currentView === 'pipeline' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <Kanban className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 font-medium">Pipeline</span>
        </button>

        <button
          onClick={() => onNavigate('clients')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] ${
            currentView === 'clients' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 font-medium">Clients</span>
        </button>

        <button
          onClick={() => onNavigate('tasks')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] ${
            currentView === 'tasks' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 font-medium">Tasks</span>
        </button>

        <button
          onClick={() => onNavigate('pricebook')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] ${
            currentView === 'pricebook' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <Package className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 font-medium">Price Book</span>
        </button>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex flex-col items-center justify-center flex-1 h-full min-h-[44px] text-slate-400"
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 font-medium">More</span>
        </button>
      </nav>
    </>
  );
};
