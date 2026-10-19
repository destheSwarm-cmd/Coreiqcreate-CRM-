import React, { useState, useEffect } from 'react';
import { BusinessSettings, Client, Invoice, PaymentMethod } from '../types/crm';
import {
  FileText,
  DollarSign,
  CreditCard,
  BookOpen,
  ShieldAlert,
  Save,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Download,
  Bell,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface PricingTermsViewProps {
  clients: Client[];
  userRole: string;
  onShowToast: (msg: string, author?: string) => void;
}

export const PricingTermsView: React.FC<PricingTermsViewProps> = ({
  clients,
  userRole,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'numbering' | 'payments' | 'terms' | 'gates' | 'schema'>('profile');
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [schemaStatus, setSchemaStatus] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);

  // Historical Invoice Form state
  const [histNumber, setHistNumber] = useState('CIQ-0001');
  const [histClientId, setHistClientId] = useState('');
  const [histDate, setHistDate] = useState('2026-09-15');
  const [histDescription, setHistDescription] = useState('Foundational AI Systems Architecture');
  const [histAmount, setHistAmount] = useState('18500');
  const [histNotes, setHistNotes] = useState('Historical contract issued and settled prior to CRM installation.');

  // Add Payment Method state
  const [newMethodType, setNewMethodType] = useState<PaymentMethod['type']>('wise');
  const [newMethodLabel, setNewMethodLabel] = useState('Wise Transfer');
  const [newMethodInstructions, setNewMethodInstructions] = useState('Please remit in ZAR or USD via Wise');

  const isOwner = userRole === 'owner';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sb_session_token') || '';
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const [setRes, invRes, schRes] = await Promise.all([
        fetch('/api/business-settings', { headers }),
        fetch('/api/crm/invoices', { headers }),
        fetch('/api/crm/schema-status', { headers }),
      ]);

      if (setRes.ok) {
        const json = await setRes.json();
        setSettings(json.settings);
      }
      if (invRes.ok) {
        const json = await invRes.json();
        setInvoices(json.invoices || []);
      }
      if (schRes.ok) {
        const json = await schRes.json();
        setSchemaStatus(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings || !isOwner) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('sb_session_token') || '';
      const resp = await fetch('/api/business-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (resp.ok) {
        onShowToast('Business settings saved successfully', 'CoreIQ Operator');
      } else {
        const err = await resp.json();
        onShowToast(`Failed to save: ${err.message || err.error}`, 'Error');
      }
    } catch (e: any) {
      onShowToast(e.message, 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordHistoricalInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!histClientId) {
      alert('Please select a client');
      return;
    }
    const token = localStorage.getItem('sb_session_token') || '';
    try {
      const resp = await fetch('/api/crm/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_id: histClientId,
          custom_invoice_number: histNumber,
          is_historical: true,
          items: [
            {
              description: histDescription,
              qty: 1,
              unit_price: Number(histAmount),
              discount_pct: 0,
            },
          ],
          notes: histNotes,
        }),
      });

      if (resp.ok) {
        onShowToast(`Recorded historical invoice ${histNumber}`, 'System');
        setShowHistoryModal(false);
        loadData();
      } else {
        const err = await resp.json();
        alert(err.message || 'Failed to save historical invoice');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddPaymentMethod = () => {
    if (!settings) return;
    const newMethod: PaymentMethod = {
      id: `pm_${Date.now()}`,
      type: newMethodType,
      label: newMethodLabel,
      enabled: true,
      rows: [
        { label: 'Account / Email', value: '' },
        { label: 'Reference Notes', value: '' },
      ],
      instructions: newMethodInstructions,
    };
    const updated = {
      ...settings,
      payment_methods: [...settings.payment_methods, newMethod],
    };
    setSettings(updated);
    setShowAddMethodModal(false);
    onShowToast(`Added payment method ${newMethodLabel}`, 'Settings');
  };

  const handleTestPush = async () => {
    const token = localStorage.getItem('sb_session_token') || '';
    try {
      const resp = await fetch('/api/push/test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        onShowToast('Dispatched test push notification to Android Chrome', 'Push System');
      }
    } catch (e: any) {
      onShowToast(e.message, 'Error');
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center text-cyan-400 font-mono text-xs">
        Loading Pricing, Terms & Business Configuration...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#04091A] text-slate-100 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#162445] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            <span>Pricing & Commercial Terms</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Trading identity, invoicing numbering, payment rails, contract terms, and agent gate policies.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-semibold rounded text-xs transition-all shadow-md min-h-[44px] sm:min-h-[36px]"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-[#162445] space-x-2 text-xs scrollbar-none pb-1">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-2 border-b-2 font-medium shrink-0 min-h-[44px] flex items-center gap-1.5 ${
            activeTab === 'profile' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Business Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('numbering')}
          className={`px-3 py-2 border-b-2 font-medium shrink-0 min-h-[44px] flex items-center gap-1.5 ${
            activeTab === 'numbering' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Numbering & Invoices ({invoices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3 py-2 border-b-2 font-medium shrink-0 min-h-[44px] flex items-center gap-1.5 ${
            activeTab === 'payments' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payment Methods ({settings.payment_methods.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('terms')}
          className={`px-3 py-2 border-b-2 font-medium shrink-0 min-h-[44px] flex items-center gap-1.5 ${
            activeTab === 'terms' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Terms Blocks</span>
        </button>
        <button
          onClick={() => setActiveTab('gates')}
          className={`px-3 py-2 border-b-2 font-medium shrink-0 min-h-[44px] flex items-center gap-1.5 ${
            activeTab === 'gates' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Agent Gates & Push</span>
        </button>
        <button
          onClick={() => setActiveTab('schema')}
          className={`px-3 py-2 border-b-2 font-medium shrink-0 min-h-[44px] flex items-center gap-1.5 ${
            activeTab === 'schema' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Schema Status</span>
        </button>
      </div>

      {/* TAB 1: BUSINESS PROFILE & DEFAULTS */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-3xl">
          <div className="p-4 md:p-5 bg-[#081126] border border-[#162445] rounded-lg space-y-4 text-xs">
            <h3 className="font-bold text-white text-sm">Commercial Entity Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Trading Name</label>
                <input
                  type="text"
                  value={settings.trading_name}
                  onChange={(e) => setSettings({ ...settings, trading_name: e.target.value })}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Tagline</label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Operator Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Website URL</label>
                <input
                  type="text"
                  value={settings.website}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Physical / Postal Address</label>
                <input
                  type="text"
                  value={settings.address || ''}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#162445] grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. 2026/123456/07"
                  value={settings.registration_number || ''}
                  onChange={(e) => setSettings({ ...settings, registration_number: e.target.value })}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">VAT Number</label>
                <input
                  type="text"
                  placeholder="e.g. 4012345678"
                  value={settings.vat_number || ''}
                  onChange={(e) => setSettings({ ...settings, vat_number: e.target.value })}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.vat_enabled}
                    onChange={(e) => setSettings({ ...settings, vat_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
                <span className="font-semibold text-slate-200">VAT Registered (15%)</span>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-5 bg-[#081126] border border-[#162445] rounded-lg space-y-4 text-xs">
            <h3 className="font-bold text-white text-sm">Commercial Defaults</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Currency</label>
                <input
                  type="text"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Payment Due (Days)</label>
                <input
                  type="number"
                  value={settings.payment_due_days}
                  onChange={(e) => setSettings({ ...settings, payment_due_days: Number(e.target.value) })}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Quote Validity (Days)</label>
                <input
                  type="number"
                  value={settings.quote_validity_days}
                  onChange={(e) => setSettings({ ...settings, quote_validity_days: Number(e.target.value) })}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Deposit Required (%)</label>
                <input
                  type="number"
                  value={settings.deposit_pct}
                  onChange={(e) => setSettings({ ...settings, deposit_pct: Number(e.target.value) })}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NUMBERING & INVOICES */}
      {activeTab === 'numbering' && (
        <div className="space-y-6">
          <div className="p-4 md:p-5 bg-[#081126] border border-[#162445] rounded-lg max-w-2xl space-y-4 text-xs">
            <h3 className="font-bold text-white text-sm">Sequential Document Numbering</h3>
            <p className="text-slate-400 text-[11px]">
              Note: <strong>CIQ-0001</strong> was previously issued outside the CRM. The counter is primed so the next CRM generated invoice is <strong>CIQ-0002</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Next Invoice Counter</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-400 font-bold">{settings.invoice_prefix}</span>
                  <input
                    type="number"
                    value={settings.next_invoice_number}
                    onChange={(e) => setSettings({ ...settings, next_invoice_number: Number(e.target.value) })}
                    className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Next Quote Counter</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-400 font-bold">{settings.quote_prefix}</span>
                  <input
                    type="number"
                    value={settings.next_quote_number}
                    onChange={(e) => setSettings({ ...settings, next_quote_number: Number(e.target.value) })}
                    className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowHistoryModal(true)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Record Historical Invoice (CIQ-0001, etc.)</span>
              </button>
            </div>
          </div>

          {/* Invoices List */}
          <div className="p-4 md:p-5 bg-[#081126] border border-[#162445] rounded-lg space-y-3 text-xs">
            <h3 className="font-bold text-white text-sm">Issued & Historical Invoices</h3>
            {invoices.length === 0 ? (
              <p className="text-slate-500 text-xs">No invoices issued yet.</p>
            ) : (
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 bg-[#0a1329] border border-[#162445] rounded flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-400 text-sm">{inv.invoice_number}</span>
                        {inv.is_historical && (
                          <span className="px-1.5 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 rounded text-[9px] font-mono">
                            HISTORICAL
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] uppercase font-bold">
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Client: <strong className="text-slate-200">{inv.bill_to_snapshot?.name || 'Client'}</strong> · Due: {inv.due_date}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono">
                        <div className="font-bold text-white">R {Number(inv.total || 0).toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">Due: R {Number(inv.amount_due ?? inv.total ?? 0).toFixed(2)}</div>
                      </div>
                      <a
                        href={`/api/invoices/${inv.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT METHODS */}
      {activeTab === 'payments' && (
        <div className="space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Enabled payment rails are rendered on generated invoice PDFs under <strong>PAYMENT DETAILS</strong>.
            </p>
            <button
              onClick={() => setShowAddMethodModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Payment Rail</span>
            </button>
          </div>

          <div className="space-y-4">
            {settings.payment_methods.map((pm, idx) => (
              <div key={pm.id} className="p-4 bg-[#081126] border border-[#162445] rounded-lg text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#162445] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{pm.label}</span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase">({pm.type})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={pm.enabled}
                        onChange={(e) => {
                          const updated = [...settings.payment_methods];
                          updated[idx] = { ...updated[idx], enabled: e.target.checked };
                          setSettings({ ...settings, payment_methods: updated });
                        }}
                        className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                      />
                      <span className={pm.enabled ? 'text-cyan-400 font-semibold' : 'text-slate-500'}>
                        {pm.enabled ? 'Active on Invoices' : 'Disabled'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Ordered Rows */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400">Account Details:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pm.rows.map((row, rIdx) => (
                      <div key={rIdx}>
                        <label className="block text-[10px] text-slate-400 mb-0.5">{row.label}</label>
                        <input
                          type="text"
                          value={row.value}
                          placeholder={`Enter ${row.label}`}
                          onChange={(e) => {
                            const updatedMethods = [...settings.payment_methods];
                            const updatedRows = [...updatedMethods[idx].rows];
                            updatedRows[rIdx] = { ...updatedRows[rIdx], value: e.target.value };
                            updatedMethods[idx] = { ...updatedMethods[idx], rows: updatedRows };
                            setSettings({ ...settings, payment_methods: updatedMethods });
                          }}
                          className="w-full bg-[#04091A] border border-[#162445] rounded px-2.5 py-1.5 text-slate-100 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Instructions for Client:</label>
                  <input
                    type="text"
                    value={pm.instructions || ''}
                    placeholder="e.g. Please use invoice number as reference and email proof of payment"
                    onChange={(e) => {
                      const updated = [...settings.payment_methods];
                      updated[idx] = { ...updated[idx], instructions: e.target.value };
                      setSettings({ ...settings, payment_methods: updated });
                    }}
                    className="w-full bg-[#04091A] border border-[#162445] rounded px-2.5 py-1.5 text-slate-100 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TERMS BLOCKS */}
      {activeTab === 'terms' && (
        <div className="space-y-4 max-w-3xl text-xs">
          <p className="text-slate-400 text-xs">
            Standard modular terms printed on proposals, build briefs, and invoices.
          </p>

          {Object.entries(settings.terms_blocks).map(([key, text]) => (
            <div key={key} className="p-4 bg-[#081126] border border-[#162445] rounded-lg space-y-2">
              <label className="block font-bold text-white text-xs uppercase tracking-wider">
                {key.replace(/_/g, ' ')}
              </label>
              <textarea
                rows={3}
                value={text}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    terms_blocks: { ...settings.terms_blocks, [key]: e.target.value },
                  });
                }}
                className="w-full bg-[#04091A] border border-[#162445] rounded p-2.5 text-slate-100 text-xs font-sans leading-relaxed focus:outline-none focus:border-cyan-500"
              />
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: AGENT GATES & PUSH NOTIFICATIONS */}
      {activeTab === 'gates' && (
        <div className="space-y-6 max-w-3xl text-xs">
          {/* Agent Governance */}
          <div className="p-4 md:p-5 bg-[#081126] border border-[#162445] rounded-lg space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>Autonomous Agent Guardrails</span>
            </h3>

            <div className="flex items-center justify-between p-3 bg-[#0a1329] border border-[#162445] rounded">
              <div>
                <div className="font-semibold text-white">Emergency Agent Pause Switch</div>
                <div className="text-[11px] text-slate-400">
                  When active, external AI agents receive 423 PAUSED on writes. Reads remain intact.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.agents_paused}
                  onChange={(e) => setSettings({ ...settings, agents_paused: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Outbound Email Mode</label>
                <select
                  value={settings.send_mode}
                  onChange={(e) => setSettings({ ...settings, send_mode: e.target.value as any })}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-slate-100"
                >
                  <option value="draft">Draft Mode Only (Safe)</option>
                  <option value="live">Live Dispatch (Outbound)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Max Discount Before Human Approval (%)</label>
                <input
                  type="number"
                  value={settings.followup_max_per_stage || 10}
                  onChange={(e) => setSettings({ ...settings, followup_max_per_stage: Number(e.target.value) })}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Web Push Configuration */}
          <div className="p-4 md:p-5 bg-[#081126] border border-[#162445] rounded-lg space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span>Android Chrome Web Push Alerts</span>
            </h3>
            <p className="text-slate-400 text-xs">
              Direct background alerts to the owner's phone for high-value business events.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {Object.entries(settings.push_events || {}).map(([evt, enabled]) => (
                <label key={evt} className="flex items-center gap-2 p-2 bg-[#0a1329] border border-[#162445] rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        push_events: { ...settings.push_events, [evt]: e.target.checked },
                      });
                    }}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                  />
                  <span className="capitalize text-slate-200">{evt.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={handleTestPush}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded font-semibold text-xs flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Send Test Push Notification</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SCHEMA STATUS CARD */}
      {activeTab === 'schema' && (
        <div className="space-y-4 max-w-3xl text-xs">
          <div className="p-4 bg-[#081126] border border-[#162445] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Postgres Schema Verification Status</h3>
              <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                schemaStatus?.status === 'ALL_OK' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
              }`}>
                {schemaStatus?.status || 'VERIFYING'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Every additive table and column is tracked here. You can copy the idempotent migration script from <code>supabase/migrations/20261019_002_coreiq_extensions.sql</code> into the Supabase SQL editor at any time.
            </p>
          </div>

          <div className="space-y-2">
            {(schemaStatus?.tables || []).map((t: any) => (
              <div
                key={t.table}
                className="p-3 bg-[#081126] border border-[#162445] rounded flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-mono font-bold text-white">{t.table}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-slate-400">
                    {t.columns.length} columns verified
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-mono text-[10px] font-bold">
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Record Historical Invoice */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#081126] border border-[#162445] rounded-xl max-w-md w-full p-5 space-y-4 text-xs">
            <h3 className="font-bold text-white text-base">Record Historical Invoice</h3>
            <p className="text-slate-400 text-[11px]">
              Register an invoice issued outside the CRM (e.g. CIQ-0001) to keep audit continuity.
            </p>

            <form onSubmit={handleRecordHistoricalInvoice} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Invoice Number</label>
                <input
                  type="text"
                  required
                  value={histNumber}
                  onChange={(e) => setHistNumber(e.target.value)}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Client</label>
                <select
                  required
                  value={histClientId}
                  onChange={(e) => setHistClientId(e.target.value)}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-white"
                >
                  <option value="">Select client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.client_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Issue Date</label>
                <input
                  type="date"
                  required
                  value={histDate}
                  onChange={(e) => setHistDate(e.target.value)}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={histDescription}
                  onChange={(e) => setHistDescription(e.target.value)}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Total Settled Amount (ZAR)</label>
                <input
                  type="number"
                  required
                  value={histAmount}
                  onChange={(e) => setHistAmount(e.target.value)}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold"
                >
                  Save Historical Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Payment Method */}
      {showAddMethodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#081126] border border-[#162445] rounded-xl max-w-md w-full p-5 space-y-4 text-xs">
            <h3 className="font-bold text-white text-base">Add Payment Method</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Payment Method Type</label>
                <select
                  value={newMethodType}
                  onChange={(e) => setNewMethodType(e.target.value as PaymentMethod['type'])}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-white"
                >
                  <option value="wise">Wise (International)</option>
                  <option value="paypal">PayPal</option>
                  <option value="payfast">PayFast (South Africa)</option>
                  <option value="skrill">Skrill</option>
                  <option value="custom">Custom Rail</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Display Label</label>
                <input
                  type="text"
                  value={newMethodLabel}
                  onChange={(e) => setNewMethodLabel(e.target.value)}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Instructions for Remittance</label>
                <input
                  type="text"
                  value={newMethodInstructions}
                  onChange={(e) => setNewMethodInstructions(e.target.value)}
                  className="w-full bg-[#04091A] border border-[#162445] rounded px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddMethodModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddPaymentMethod}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold"
                >
                  Add Method
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
