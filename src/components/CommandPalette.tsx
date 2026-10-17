import React, { useState, useEffect } from 'react';
import { Search, User, Briefcase, FileText, Package, Plus, X } from 'lucide-react';
import { Client, Engagement, Quote, Product } from '../types/crm';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  engagements: Engagement[];
  quotes: Quote[];
  products: Product[];
  onSelectClient: (clientId: string) => void;
  onSelectQuote: (quoteId: string) => void;
  onSelectProduct: (productId: string) => void;
  onNewClient: () => void;
  onNewTask: () => void;
  onNewQuote: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  clients,
  engagements,
  quotes,
  products,
  onSelectClient,
  onSelectQuote,
  onSelectProduct,
  onNewClient,
  onNewTask,
  onNewQuote,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredClients = clients
    .filter((c) => !c.archived_at && (c.name.toLowerCase().includes(q) || c.client_code.toLowerCase().includes(q)))
    .slice(0, 5);

  const filteredEngagements = engagements
    .filter((e) => !e.archived_at && (e.title.toLowerCase().includes(q) || e.engagement_code.toLowerCase().includes(q)))
    .slice(0, 5);

  const filteredQuotes = quotes
    .filter((qu) => qu.quote_code.toLowerCase().includes(q))
    .slice(0, 4);

  const filteredProducts = products
    .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-[#0a1329] border border-cyan-900/80 rounded-lg shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, engagements, quotes, products or run actions..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-slate-800/40 text-xs">
          {/* Quick Actions */}
          <div className="py-1">
            <div className="px-3 py-1 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Actions</div>
            <button
              onClick={() => {
                onClose();
                onNewClient();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded hover:bg-slate-800/60 text-slate-200"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Create New Client</span>
              <kbd className="ml-auto font-mono text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">n</kbd>
            </button>
            <button
              onClick={() => {
                onClose();
                onNewTask();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded hover:bg-slate-800/60 text-slate-200"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Create Operator Task</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onNewQuote();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded hover:bg-slate-800/60 text-slate-200"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Draft Commercial Quote</span>
            </button>
          </div>

          {/* Clients */}
          {filteredClients.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Clients</div>
              {filteredClients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onClose();
                    onSelectClient(c.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left rounded hover:bg-slate-800/60"
                >
                  <User className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-medium text-slate-200 truncate">{c.name}</span>
                  <span className="text-slate-500 font-mono text-[11px] ml-auto shrink-0">{c.client_code}</span>
                </button>
              ))}
            </div>
          )}

          {/* Engagements */}
          {filteredEngagements.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Engagements</div>
              {filteredEngagements.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    onClose();
                    onSelectClient(e.client_id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left rounded hover:bg-slate-800/60"
                >
                  <Briefcase className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-slate-200 truncate">{e.title}</span>
                  <span className="text-slate-500 font-mono text-[11px] ml-auto shrink-0">{e.engagement_code}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quotes */}
          {filteredQuotes.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Quotes</div>
              {filteredQuotes.map((q) => (
                <button
                  key={q.id}
                  onClick={() => {
                    onClose();
                    onSelectQuote(q.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left rounded hover:bg-slate-800/60"
                >
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-mono text-slate-200">{q.quote_code}</span>
                  <span className="text-slate-400 capitalize">· {q.status}</span>
                  <span className="font-mono text-cyan-400 ml-auto shrink-0">{q.total} {q.currency}</span>
                </button>
              ))}
            </div>
          )}

          {/* Products */}
          {filteredProducts.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Products & SKUs</div>
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onClose();
                    onSelectProduct(p.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left rounded hover:bg-slate-800/60"
                >
                  <Package className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-slate-200">{p.name}</span>
                  <span className="text-slate-500 font-mono text-[11px] ml-auto shrink-0">{p.sku}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-800/70 bg-[#070e20] text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span><kbd className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded">↑↓</kbd> navigate</span>
            <span><kbd className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded">esc</kbd> close</span>
          </div>
          <span className="font-mono text-cyan-400">CoreIQ Command Hub</span>
        </div>
      </div>
    </div>
  );
};
