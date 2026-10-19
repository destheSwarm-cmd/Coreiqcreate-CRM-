import React, { useState, useEffect } from 'react';
import {
  Invoice,
  Payment,
  Retainer,
  Quote,
  Client,
  Product,
  BusinessSettings,
  InvoiceItem,
  QuoteLine,
} from '../types/crm';
import {
  FileText,
  DollarSign,
  Repeat,
  FileCheck,
  Plus,
  Eye,
  Download,
  Share2,
  Send,
  Ban,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  X,
  CreditCard,
  Building,
  User,
  Calendar,
  Layers,
} from 'lucide-react';

interface MoneyViewProps {
  sessionToken: string;
  clients: Client[];
  products: Product[];
  businessSettings?: BusinessSettings;
  onRefresh?: () => void;
  showToast: (msg: string, actor?: string) => void;
  onNavigateToClient?: (clientId: string) => void;
}

type MoneySegment = 'quotes' | 'invoices' | 'payments' | 'retainers';

export const MoneyView: React.FC<MoneyViewProps> = ({
  sessionToken,
  clients,
  products,
  businessSettings,
  onRefresh,
  showToast,
  onNavigateToClient,
}) => {
  const [activeSegment, setActiveSegment] = useState<MoneySegment>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [retainers, setRetainers] = useState<Retainer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [showNewModal, setShowNewModal] = useState<
    'none' | 'invoice' | 'quote' | 'payment' | 'retainer' | 'historical_invoice'
  >('none');
  const [previewDoc, setPreviewDoc] = useState<{ type: 'invoice' | 'quote'; data: any } | null>(null);
  const [voidModalDoc, setVoidModalDoc] = useState<Invoice | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [convertModalQuote, setConvertModalQuote] = useState<Quote | null>(null);
  const [convertMode, setConvertMode] = useState<'full' | 'deposit' | 'balance'>('full');

  // New Invoice / Quote state
  const [formClientId, setFormClientId] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDueDateDays, setFormDueDateDays] = useState(7);
  const [formCustomInvNum, setFormCustomInvNum] = useState('');
  const [formLines, setFormLines] = useState<
    { product_id: string; description: string; sub_description: string; qty: number; unit_price: number }[]
  >([{ product_id: '', description: '', sub_description: '', qty: 1, unit_price: 0 }]);

  // New Payment state
  const [paymentInvoiceId, setPaymentInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('EFT');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // New Retainer state
  const [retainerClientId, setRetainerClientId] = useState('');
  const [retainerDesc, setRetainerDesc] = useState('');
  const [retainerAmount, setRetainerAmount] = useState<number>(0);
  const [retainerCycle, setRetainerCycle] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [retainerStartDate, setRetainerStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, [sessionToken]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${sessionToken}` };
      const [invResp, retResp, boardResp] = await Promise.all([
        fetch('/api/crm/invoices', { headers }),
        fetch('/api/crm/retainers', { headers }),
        fetch('/api/db/state', { headers }),
      ]);

      if (invResp.ok) {
        const invData = await invResp.json();
        setInvoices(invData.invoices || []);
      }
      if (retResp.ok) {
        const retData = await retResp.json();
        setRetainers(retData.retainers || []);
      }
      if (boardResp.ok) {
        const dbData = await boardResp.json();
        const data = dbData.data || {};
        if (data.quotes) setQuotes(data.quotes);
        if (data.payments) setPayments(data.payments);
        if (data.invoices && (!invResp.ok || invoices.length === 0)) setInvoices(data.invoices);
        if (data.retainers && (!retResp.ok || retainers.length === 0)) setRetainers(data.retainers);
      }
    } catch (e) {
      console.warn('Failed to fetch money data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLine = () => {
    setFormLines([...formLines, { product_id: '', description: '', sub_description: '', qty: 1, unit_price: 0 }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (formLines.length === 1) return;
    setFormLines(formLines.filter((_, i) => i !== idx));
  };

  const handleProductSelect = (idx: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const updated = [...formLines];
    updated[idx] = {
      product_id: prod.id,
      description: prod.name,
      sub_description: prod.description || '',
      qty: 1,
      unit_price: prod.base_price || prod.min_price || 0,
    };
    setFormLines(updated);
  };

  const calculateFormSubtotal = () => {
    return formLines.reduce((acc, l) => acc + (Number(l.qty) || 0) * (Number(l.unit_price) || 0), 0);
  };

  // Submit Invoice / Historical Invoice
  const handleCreateInvoice = async (isHistorical: boolean = false) => {
    if (!formClientId) {
      showToast('Please select a client', 'Error');
      return;
    }
    const validLines = formLines.filter((l) => l.description.trim());
    if (validLines.length === 0) {
      showToast('Please add at least one line item', 'Error');
      return;
    }

    try {
      const resp = await fetch('/api/crm/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          client_id: formClientId,
          items: validLines,
          notes: formNotes,
          due_days: formDueDateDays,
          is_historical: isHistorical,
          custom_invoice_number: formCustomInvNum.trim() || undefined,
        }),
      });

      if (resp.ok) {
        const json = await resp.json();
        showToast(`Invoice ${json.invoice?.invoice_number || 'created'} saved successfully`, 'Success');
        setShowNewModal('none');
        resetForm();
        fetchData();
        if (onRefresh) onRefresh();
      } else {
        const err = await resp.json();
        showToast(err.message || 'Failed to create invoice', 'Error');
      }
    } catch (e: any) {
      showToast(e.message || 'Network error', 'Error');
    }
  };

  // Record Payment Submit
  const handleRecordPayment = async () => {
    if (!paymentInvoiceId || !paymentAmount) {
      showToast('Please select an invoice and enter amount', 'Error');
      return;
    }

    try {
      const resp = await fetch('/api/crm/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          invoice_id: paymentInvoiceId,
          amount: Number(paymentAmount),
          payment_method: paymentMethod,
          reference: paymentRef,
          notes: paymentNotes,
        }),
      });

      if (resp.ok) {
        showToast(`Payment of R ${paymentAmount} recorded`, 'Money In');
        setShowNewModal('none');
        setPaymentInvoiceId('');
        setPaymentAmount(0);
        setPaymentRef('');
        setPaymentNotes('');
        fetchData();
        if (onRefresh) onRefresh();
      } else {
        const err = await resp.json();
        showToast(err.message || 'Failed to record payment', 'Error');
      }
    } catch (e: any) {
      showToast(e.message || 'Network error', 'Error');
    }
  };

  // Create Retainer Submit
  const handleCreateRetainer = async () => {
    if (!retainerClientId || !retainerDesc || !retainerAmount) {
      showToast('Please fill all retainer details', 'Error');
      return;
    }

    try {
      const resp = await fetch('/api/crm/retainers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          client_id: retainerClientId,
          description: retainerDesc,
          amount: Number(retainerAmount),
          cycle: retainerCycle,
          start_date: retainerStartDate,
        }),
      });

      if (resp.ok) {
        showToast(`Retainer created: R ${retainerAmount}/${retainerCycle}`, 'Success');
        setShowNewModal('none');
        setRetainerClientId('');
        setRetainerDesc('');
        setRetainerAmount(0);
        fetchData();
        if (onRefresh) onRefresh();
      } else {
        const err = await resp.json();
        showToast(err.message || 'Failed to create retainer', 'Error');
      }
    } catch (e: any) {
      showToast(e.message || 'Network error', 'Error');
    }
  };

  // Void Invoice
  const handleVoidInvoice = async () => {
    if (!voidModalDoc || !voidReason.trim()) {
      showToast('Mandatory void reason is required', 'Error');
      return;
    }

    try {
      const resp = await fetch(`/api/crm/invoices/${voidModalDoc.id}/void`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ reason: voidReason.trim() }),
      });

      if (resp.ok) {
        showToast(`Invoice ${voidModalDoc.invoice_number} voided`, 'Voided');
        setVoidModalDoc(null);
        setVoidReason('');
        fetchData();
        if (onRefresh) onRefresh();
      } else {
        const err = await resp.json();
        showToast(err.message || 'Failed to void invoice', 'Error');
      }
    } catch (e: any) {
      showToast(e.message || 'Network error', 'Error');
    }
  };

  // Convert Quote to Invoice
  const handleConvertQuote = async () => {
    if (!convertModalQuote) return;
    try {
      const resp = await fetch(`/api/crm/quotes/${convertModalQuote.id}/convert-to-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ mode: convertMode }),
      });

      if (resp.ok) {
        const json = await resp.json();
        showToast(`Converted to Invoice ${json.invoice?.invoice_number}`, 'Success');
        setConvertModalQuote(null);
        setActiveSegment('invoices');
        fetchData();
        if (onRefresh) onRefresh();
      } else {
        const err = await resp.json();
        showToast(err.message || 'Failed to convert quote', 'Error');
      }
    } catch (e: any) {
      showToast(e.message || 'Network error', 'Error');
    }
  };

  // Mark sent
  const handleMarkSent = async (type: 'invoice' | 'quote', id: string) => {
    try {
      const resp = await fetch(`/api/db/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          table: type === 'invoice' ? 'invoices' : 'quotes',
          item: { id, status: 'sent', sent_at: new Date().toISOString() },
        }),
      });
      if (resp.ok) {
        showToast(`Document marked as sent`, 'Success');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Share via navigator.share or download
  const handleShareDoc = async (type: 'invoice' | 'quote', docNumber: string, id: string) => {
    const pdfUrl = `/api/${type === 'invoice' ? 'invoices' : 'quotes'}/${id}/pdf`;
    try {
      if (navigator.share) {
        const response = await fetch(pdfUrl, {
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
        const blob = await response.blob();
        const file = new File([blob], `${docNumber}.pdf`, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${docNumber}.pdf`,
            text: `CoreIQ Create ${type.toUpperCase()} ${docNumber}`,
            files: [file],
          });
          return;
        }
      }
      // Fallback: direct download
      handleDownloadPdf(type, id, docNumber);
    } catch (e) {
      handleDownloadPdf(type, id, docNumber);
    }
  };

  const handleDownloadPdf = async (type: 'invoice' | 'quote', id: string, docNumber: string) => {
    try {
      const resp = await fetch(`/api/${type === 'invoice' ? 'invoices' : 'quotes'}/${id}/pdf`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!resp.ok) throw new Error('Download failed');
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      showToast('Failed to download PDF', 'Error');
    }
  };

  const resetForm = () => {
    setFormClientId('');
    setFormNotes('');
    setFormCustomInvNum('');
    setFormLines([{ product_id: '', description: '', sub_description: '', qty: 1, unit_price: 0 }]);
  };

  // Calculate segment totals
  const totalInvoiced = invoices.filter((i) => i.status !== 'void').reduce((acc, i) => acc + (i.total || 0), 0);
  const totalPaid = invoices.filter((i) => i.status !== 'void').reduce((acc, i) => acc + (i.amount_paid || 0), 0);
  const totalDue = invoices.filter((i) => i.status !== 'void').reduce((acc, i) => acc + (i.amount_due || 0), 0);
  const totalQuotes = quotes.reduce((acc, q) => acc + (q.total || 0), 0);
  const totalRetainersMRR = retainers.filter((r) => r.status === 'active').reduce((acc, r) => acc + (r.amount || 0), 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#04091A] text-slate-100 overflow-hidden relative">
      {/* Segment Header Bar */}
      <div className="p-3 sm:p-4 bg-[#081126] border-b border-[#162445] shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Segment Tabs */}
        <div className="flex items-center gap-1 bg-[#0d1a38] p-1 rounded-lg border border-[#1e325c] overflow-x-auto">
          <button
            onClick={() => setActiveSegment('invoices')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-semibold text-xs transition-all shrink-0 ${
              activeSegment === 'invoices'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Invoices ({invoices.length})</span>
          </button>

          <button
            onClick={() => setActiveSegment('quotes')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-semibold text-xs transition-all shrink-0 ${
              activeSegment === 'quotes'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Quotes ({quotes.length})</span>
          </button>

          <button
            onClick={() => setActiveSegment('payments')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-semibold text-xs transition-all shrink-0 ${
              activeSegment === 'payments'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Payments ({payments.length})</span>
          </button>

          <button
            onClick={() => setActiveSegment('retainers')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md font-semibold text-xs transition-all shrink-0 ${
              activeSegment === 'retainers'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span>Retainers ({retainers.length})</span>
          </button>
        </div>

        {/* Action Button: + New */}
        <div className="flex items-center gap-2">
          {activeSegment === 'invoices' && (
            <>
              <button
                onClick={() => {
                  resetForm();
                  setShowNewModal('historical_invoice');
                }}
                className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#0d1a38] border border-[#1e325c] rounded-lg transition-colors"
              >
                Record Historical
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowNewModal('invoice');
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg flex items-center gap-1.5 shadow-md shadow-cyan-950 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Invoice</span>
              </button>
            </>
          )}

          {activeSegment === 'quotes' && (
            <button
              onClick={() => {
                resetForm();
                setShowNewModal('quote');
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg flex items-center gap-1.5 shadow-md shadow-cyan-950 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Quote</span>
            </button>
          )}

          {activeSegment === 'payments' && (
            <button
              onClick={() => setShowNewModal('payment')}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-1.5 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          )}

          {activeSegment === 'retainers' && (
            <button
              onClick={() => setShowNewModal('retainer')}
              className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg flex items-center gap-1.5 shadow-md shadow-cyan-950 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Retainer</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 pb-24">
        {/* INVOICES LIST */}
        {activeSegment === 'invoices' && (
          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="p-8 text-center bg-[#081126] border border-[#162445] rounded-xl text-slate-400 text-sm">
                No invoices recorded yet. Click <strong>+ New Invoice</strong> or <strong>Record Historical</strong> to begin.
              </div>
            ) : (
              invoices.map((inv) => {
                const client = clients.find((c) => c.id === inv.client_id);
                return (
                  <div
                    key={inv.id}
                    className="p-4 bg-[#081126] border border-[#162445] hover:border-[#223766] rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-bold text-cyan-400 text-sm">{inv.invoice_number}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            inv.status === 'paid'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : inv.status === 'partially_paid'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : inv.status === 'void'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-blue-950 text-blue-400 border border-blue-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                        {inv.is_historical && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                            Historical
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {inv.bill_to_snapshot?.name || client?.name || 'Client'}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-3">
                        <span>Issued: {inv.issue_date}</span>
                        <span>·</span>
                        <span>Due: {inv.due_date}</span>
                      </div>
                    </div>

                    {/* Financials & Actions */}
                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-[#162445]">
                      <div className="text-left md:text-right">
                        <div className="text-xs text-slate-400">Total / Due</div>
                        <div className="font-mono font-bold text-sm text-white">
                          R {Number(inv.total).toFixed(2)}
                        </div>
                        {inv.status !== 'paid' && inv.status !== 'void' && (
                          <div className="text-xs font-mono text-amber-400 font-semibold">
                            Due: R {Number(inv.amount_due).toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setPreviewDoc({ type: 'invoice', data: inv })}
                          title="In-app Preview"
                          className="p-2 bg-[#0d1a38] hover:bg-[#122247] border border-[#1e325c] text-cyan-300 rounded-lg text-xs"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPdf('invoice', inv.id, inv.invoice_number)}
                          title="Download PDF"
                          className="p-2 bg-[#0d1a38] hover:bg-[#122247] border border-[#1e325c] text-slate-200 rounded-lg text-xs"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleShareDoc('invoice', inv.invoice_number, inv.id)}
                          title="Share"
                          className="p-2 bg-[#0d1a38] hover:bg-[#122247] border border-[#1e325c] text-slate-200 rounded-lg text-xs"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        {inv.status === 'draft' && (
                          <button
                            onClick={() => handleMarkSent('invoice', inv.id)}
                            title="Mark as sent"
                            className="p-2 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800 text-blue-300 rounded-lg text-xs"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {inv.status !== 'paid' && inv.status !== 'void' && (
                          <>
                            <button
                              onClick={() => {
                                setPaymentInvoiceId(inv.id);
                                setPaymentAmount(inv.amount_due || inv.total);
                                setShowNewModal('payment');
                              }}
                              title="Record Payment"
                              className="px-2.5 py-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded-lg text-xs font-semibold"
                            >
                              Pay
                            </button>
                            <button
                              onClick={() => {
                                setVoidModalDoc(inv);
                                setVoidReason('');
                              }}
                              title="Void Invoice"
                              className="p-2 bg-red-950/50 hover:bg-red-950 border border-red-800 text-red-300 rounded-lg text-xs"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* QUOTES LIST */}
        {activeSegment === 'quotes' && (
          <div className="space-y-3">
            {quotes.length === 0 ? (
              <div className="p-8 text-center bg-[#081126] border border-[#162445] rounded-xl text-slate-400 text-sm">
                No quotes generated yet. Click <strong>+ New Quote</strong> to create a commercial proposal.
              </div>
            ) : (
              quotes.map((quote) => {
                const client = clients.find((c) => c.id === quote.client_id);
                return (
                  <div
                    key={quote.id}
                    className="p-4 bg-[#081126] border border-[#162445] hover:border-[#223766] rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-cyan-400 text-sm">{quote.quote_code}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            quote.status === 'accepted'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : quote.status === 'sent'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {quote.status}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-white">{client?.name || 'Client'}</div>
                      <div className="text-xs text-slate-400">Valid Until: {quote.valid_until}</div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-[#162445]">
                      <div className="text-left md:text-right">
                        <div className="text-xs text-slate-400">Total Quote</div>
                        <div className="font-mono font-bold text-sm text-white">
                          R {Number(quote.total).toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setPreviewDoc({ type: 'quote', data: quote })}
                          title="Preview"
                          className="p-2 bg-[#0d1a38] hover:bg-[#122247] border border-[#1e325c] text-cyan-300 rounded-lg text-xs"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPdf('quote', quote.id, quote.quote_code)}
                          title="Download PDF"
                          className="p-2 bg-[#0d1a38] hover:bg-[#122247] border border-[#1e325c] text-slate-200 rounded-lg text-xs"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setConvertModalQuote(quote);
                            setConvertMode('full');
                          }}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <span>Convert to Invoice</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* PAYMENTS LIST */}
        {activeSegment === 'payments' && (
          <div className="space-y-3">
            {payments.length === 0 ? (
              <div className="p-8 text-center bg-[#081126] border border-[#162445] rounded-xl text-slate-400 text-sm">
                No payments recorded yet. Click <strong>Record Payment</strong> to reconcile received deposits.
              </div>
            ) : (
              payments.map((p) => {
                const client = clients.find((c) => c.id === p.client_id);
                return (
                  <div
                    key={p.id}
                    className="p-4 bg-[#081126] border border-[#162445] rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">
                        {client?.name || 'Client Payment'}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {p.payment_date} · {p.payment_method} {p.reference ? `· Ref: ${p.reference}` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400 text-base">
                        + R {Number(p.amount).toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-500">By {p.recorded_by_actor || 'Operator'}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* RETAINERS LIST */}
        {activeSegment === 'retainers' && (
          <div className="space-y-3">
            {retainers.length === 0 ? (
              <div className="p-8 text-center bg-[#081126] border border-[#162445] rounded-xl text-slate-400 text-sm">
                No active retainers. Click <strong>+ New Retainer</strong> to track ongoing monthly maintenance agreements.
              </div>
            ) : (
              retainers.map((r) => {
                const client = clients.find((c) => c.id === r.client_id);
                return (
                  <div
                    key={r.id}
                    className="p-4 bg-[#081126] border border-[#162445] rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{r.description}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono uppercase">
                          {r.cycle}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mt-1">Client: {client?.name || 'Client'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Next Invoice: <span className="text-cyan-400 font-mono">{r.next_invoice_date}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-white text-base">
                        R {Number(r.amount).toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-400">per {r.cycle.replace('ly', '')}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Sticky Bottom Totals Bar (Requirement A2) */}
      <div className="sticky bottom-0 left-0 right-0 p-3 sm:p-4 bg-[#081126] border-t border-[#162445] flex items-center justify-between text-xs z-30 shadow-2xl safe-area-pb">
        <div className="flex items-center gap-4 flex-wrap">
          {activeSegment === 'invoices' && (
            <>
              <div>
                <span className="text-slate-400">Billed: </span>
                <span className="font-mono font-bold text-white">R {totalInvoiced.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400">Collected: </span>
                <span className="font-mono font-bold text-emerald-400">R {totalPaid.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400">Outstanding: </span>
                <span className="font-mono font-bold text-amber-400">R {totalDue.toFixed(2)}</span>
              </div>
            </>
          )}

          {activeSegment === 'quotes' && (
            <div>
              <span className="text-slate-400">Total Pipeline Quotes: </span>
              <span className="font-mono font-bold text-cyan-400">R {totalQuotes.toFixed(2)}</span>
            </div>
          )}

          {activeSegment === 'payments' && (
            <div>
              <span className="text-slate-400">Total Reconciled: </span>
              <span className="font-mono font-bold text-emerald-400">
                R {payments.reduce((acc, p) => acc + (p.amount || 0), 0).toFixed(2)}
              </span>
            </div>
          )}

          {activeSegment === 'retainers' && (
            <div>
              <span className="text-slate-400">Active Monthly Retainers (MRR): </span>
              <span className="font-mono font-bold text-cyan-400">R {totalRetainersMRR.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
          South African Rand (ZAR)
        </div>
      </div>

      {/* IN-APP HTML PREVIEW MODAL (Exact CIQ-0001 Replica for Android Chrome) */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Controls Bar */}
            <div className="p-3 bg-[#081126] text-white flex items-center justify-between border-b border-[#162445]">
              <span className="font-bold text-xs font-mono text-cyan-400">
                {previewDoc.type.toUpperCase()}: {previewDoc.data.invoice_number || previewDoc.data.quote_code}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleDownloadPdf(
                      previewDoc.type,
                      previewDoc.data.id,
                      previewDoc.data.invoice_number || previewDoc.data.quote_code
                    )
                  }
                  className="px-2.5 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded flex items-center gap-1 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Render Body matching CIQ-0001 */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs font-sans">
              {/* Top Navy Banner */}
              <div className="bg-[#1e295d] text-white p-5 rounded-lg flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold tracking-tight">CoreIQ Create</h1>
                  <p className="text-xs text-blue-200 mt-0.5">Ideas | Intelligence | Action</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold tracking-wider">
                    {previewDoc.type === 'invoice' ? 'INVOICE' : 'QUOTE'}
                  </h2>
                </div>
              </div>

              {/* FROM & BILL TO Columns */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">FROM</div>
                  <div className="font-bold text-slate-900 text-sm">CoreIQ Create</div>
                  <div className="text-slate-600 mt-0.5">{businessSettings?.email || 'coreiqcreate@gmail.com'}</div>
                  <div className="text-slate-600">
                    {businessSettings?.website || 'coreiqcreate-ten.vercel.app'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {previewDoc.type === 'invoice' ? 'BILL TO' : 'PROPOSED TO'}
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {previewDoc.data.bill_to_snapshot?.name ||
                      clients.find((c) => c.id === previewDoc.data.client_id)?.name ||
                      'Client'}
                  </div>
                  {previewDoc.data.bill_to_snapshot?.attention && (
                    <div className="text-slate-600 mt-0.5">
                      Attention: {previewDoc.data.bill_to_snapshot.attention}
                    </div>
                  )}
                  {previewDoc.data.bill_to_snapshot?.address && (
                    <div className="text-slate-600">{previewDoc.data.bill_to_snapshot.address}</div>
                  )}
                </div>
              </div>

              {/* Meta strip */}
              <div className="bg-slate-100 p-3 rounded-lg grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">
                    {previewDoc.type === 'invoice' ? 'INVOICE NO' : 'QUOTE NO'}
                  </div>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    {previewDoc.data.invoice_number || previewDoc.data.quote_code}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">DATE</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {previewDoc.data.issue_date || previewDoc.data.created_at?.split('T')[0]}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">
                    {previewDoc.type === 'invoice' ? 'DUE DATE' : 'VALID UNTIL'}
                  </div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {previewDoc.data.due_date || previewDoc.data.valid_until}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-[#1e295d] text-white p-2.5 grid grid-cols-12 font-bold text-[11px]">
                  <div className="col-span-6">DESCRIPTION</div>
                  <div className="col-span-2 text-center">QTY</div>
                  <div className="col-span-2 text-right">UNIT PRICE</div>
                  <div className="col-span-2 text-right">AMOUNT</div>
                </div>
                <div className="divide-y divide-slate-100">
                  {(previewDoc.data.items || previewDoc.data.lines || [
                    { description: 'Website build & AI assistant demo', qty: 1, unit_price: previewDoc.data.total, amount: previewDoc.data.total },
                  ]).map((item: any, i: number) => (
                    <div key={i} className="p-3 grid grid-cols-12 items-center text-slate-800">
                      <div className="col-span-6">
                        <div className="font-semibold">{item.description || item.title}</div>
                        {item.sub_description && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5">{item.sub_description}</div>
                        )}
                      </div>
                      <div className="col-span-2 text-center font-mono">{item.qty || item.quantity || 1}</div>
                      <div className="col-span-2 text-right font-mono">
                        R {Number(item.unit_price || 0).toFixed(2)}
                      </div>
                      <div className="col-span-2 text-right font-mono font-bold">
                        R {Number(item.amount || item.line_total || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Due Banner */}
              <div className="flex justify-end">
                <div className="bg-[#1e295d] text-white py-2 px-6 rounded-md flex items-center justify-between gap-6 min-w-[220px]">
                  <span className="font-bold">TOTAL DUE</span>
                  <span className="font-mono font-bold text-sm">
                    R {Number(previewDoc.data.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment details replica */}
              <div className="pt-2 border-t border-slate-200 space-y-1.5 text-[11px]">
                <div className="font-bold text-slate-900 uppercase">PAYMENT DETAILS</div>
                <div className="grid grid-cols-2 gap-1 text-slate-700">
                  <div>Bank: <strong>Capitec</strong></div>
                  <div>Account holder: <strong>Mr MD Mashele</strong></div>
                  <div>Account type: <strong>Savings</strong></div>
                  <div>Account number: <strong>1204104725</strong></div>
                  <div>Branch code: <strong>470010</strong></div>
                  <div>Payment reference: <strong>{previewDoc.data.invoice_number || previewDoc.data.quote_code}</strong></div>
                </div>
                <div className="text-slate-500 text-[10px] pt-1">
                  Please use the payment reference above and send proof of payment to coreiqcreate@gmail.com.
                </div>
                <div className="text-slate-700 font-semibold text-[10px]">Thank you for your business.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW INVOICE / HISTORICAL INVOICE MODAL */}
      {(showNewModal === 'invoice' || showNewModal === 'historical_invoice') && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#081126] border border-[#162445] rounded-xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#162445] pb-3">
              <h3 className="font-bold text-white text-sm">
                {showNewModal === 'historical_invoice' ? 'Record Historical Invoice' : 'Create New Commercial Invoice'}
              </h3>
              <button onClick={() => setShowNewModal('none')} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Client *</label>
                <select
                  value={formClientId}
                  onChange={(e) => setFormClientId(e.target.value)}
                  className="w-full bg-[#0d1a38] text-white border border-[#1e325c] rounded p-2.5 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.client_code})
                    </option>
                  ))}
                </select>
              </div>

              {showNewModal === 'historical_invoice' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Historical Invoice Number (e.g. CIQ-0001)
                  </label>
                  <input
                    type="text"
                    value={formCustomInvNum}
                    onChange={(e) => setFormCustomInvNum(e.target.value)}
                    placeholder="CIQ-0001"
                    className="w-full bg-[#0d1a38] text-white border border-[#1e325c] rounded p-2.5 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Payment Due (Days)</label>
                <input
                  type="number"
                  value={formDueDateDays}
                  onChange={(e) => setFormDueDateDays(Number(e.target.value) || 7)}
                  className="w-full bg-[#0d1a38] text-white border border-[#1e325c] rounded p-2.5 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Line items section */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {formLines.map((line, idx) => (
                  <div key={idx} className="p-3 bg-[#0d1a38] border border-[#1e325c] rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">Item #{idx + 1}</span>
                      {formLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-red-400 text-xs hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-0.5">Quick Pick Catalog Item</label>
                        <select
                          value={line.product_id}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="w-full bg-[#081126] text-white border border-[#1e325c] rounded p-2 text-xs"
                        >
                          <option value="">-- Custom Line --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (R {p.base_price || p.min_price || 0})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-0.5">Description *</label>
                        <input
                          type="text"
                          required
                          value={line.description}
                          onChange={(e) => {
                            const updated = [...formLines];
                            updated[idx].description = e.target.value;
                            setFormLines(updated);
                          }}
                          placeholder="e.g. Website build & AI assistant demo"
                          className="w-full bg-[#081126] text-white border border-[#1e325c] rounded p-2 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Sub-description (Optional)</label>
                      <input
                        type="text"
                        value={line.sub_description}
                        onChange={(e) => {
                          const updated = [...formLines];
                          updated[idx].sub_description = e.target.value;
                          setFormLines(updated);
                        }}
                        placeholder="e.g. Client branding, delivery link & setup"
                        className="w-full bg-[#081126] text-white border border-[#1e325c] rounded p-2 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-0.5">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={line.qty}
                          onChange={(e) => {
                            const updated = [...formLines];
                            updated[idx].qty = Number(e.target.value) || 1;
                            setFormLines(updated);
                          }}
                          className="w-full bg-[#081126] text-white border border-[#1e325c] rounded p-2 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-0.5">Unit Price (R)</label>
                        <input
                          type="number"
                          value={line.unit_price}
                          onChange={(e) => {
                            const updated = [...formLines];
                            updated[idx].unit_price = Number(e.target.value) || 0;
                            setFormLines(updated);
                          }}
                          className="w-full bg-[#081126] text-white border border-[#1e325c] rounded p-2 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Calculation */}
              <div className="p-3 bg-[#0d1a38] border border-[#1e325c] rounded-lg flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Total Invoice Amount:</span>
                <span className="font-mono font-bold text-white text-sm">
                  R {calculateFormSubtotal().toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#162445]">
              <button
                type="button"
                onClick={() => setShowNewModal('none')}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCreateInvoice(showNewModal === 'historical_invoice')}
                className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md"
              >
                {showNewModal === 'historical_invoice' ? 'Save Historical Invoice' : 'Issue Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showNewModal === 'payment' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#081126] border border-[#162445] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#162445] pb-3">
              <h3 className="font-bold text-white text-sm">Record Client Payment</h3>
              <button onClick={() => setShowNewModal('none')} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Invoice *</label>
                <select
                  value={paymentInvoiceId}
                  onChange={(e) => {
                    setPaymentInvoiceId(e.target.value);
                    const inv = invoices.find((i) => i.id === e.target.value);
                    if (inv) setPaymentAmount(inv.amount_due || inv.total);
                  }}
                  className="w-full bg-[#0d1a38] text-white border border-[#1e325c] rounded p-2.5 text-xs font-mono"
                >
                  <option value="">-- Select Unpaid Invoice --</option>
                  {invoices
                    .filter((i) => i.status !== 'void' && i.status !== 'paid')
                    .map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} (Due: R {Number(inv.amount_due).toFixed(2)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Amount Paid (R) *</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                  className="w-full bg-[#0d1a38] text-white border border-[#1e325c] rounded p-2.5 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-[#0d1a38] text-white border border-[#1e325c] rounded p-2.5 text-xs"
                >
                  <option value="EFT">Electronic Funds Transfer (EFT)</option>
                  <option value="Card">Card</option>
                  <option value="Instant EFT">Instant EFT / Ozow</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Bank / Reference</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. Capitec POP #92831"
                  className="w-full bg-[#0d1a38] text-white border border-[#1e325c] rounded p-2.5 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#162445]">
              <button
                type="button"
                onClick={() => setShowNewModal('none')}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordPayment}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE RETAINER MODAL */}
      {showNewModal === 'retainer' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#081126] border border-[#162445] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#162445] pb-3">
              <h3 className="font-bold text-white text-sm">Create New Retainer</h3>
              <button onClick={() => setShowNewModal('none')} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Client *</label>
                <select
                  value={retainerClientId}
                  onChange={(e) => setRetainerClientId(e.target.value)}
                  className="w-full bg-[#0d1a38] text-white border border-[#1e325c] rounded p-2.5 text-xs"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.client_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Retainer Title *</label>
                <input
                  type="text"
                  value={retainerDesc}
                  onChange={(e) => setRetainerDesc(e.target.value)}
                  placeholder="e.g. Monthly Maintenance & WhatsApp Bot Support"
                  className="w-full bg-[#0d1a38] text-white border border-[#1e325c] rounded p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Amount (R) *</label>
                  <input
                    type="number"
                    value={retainerAmount}
                    onChange={(e) => setRetainerAmount(Number(e.target.value) || 0)}
                    className="w-full bg-[#0d1a38] text-white border border-[#1e325c] rounded p-2.5 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Billing Cycle</label>
                  <select
                    value={retainerCycle}
                    onChange={(e) => setRetainerCycle(e.target.value as any)}
                    className="w-full bg-[#0d1a38] text-white border border-[#1e325c] rounded p-2.5 text-xs"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={retainerStartDate}
                  onChange={(e) => setRetainerStartDate(e.target.value)}
                  className="w-full bg-[#0d1a38] text-white border border-[#1e325c] rounded p-2.5 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#162445]">
              <button
                type="button"
                onClick={() => setShowNewModal('none')}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateRetainer}
                className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md"
              >
                Create Retainer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOID INVOICE MODAL (Mandatory reason requirement) */}
      {voidModalDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#081126] border border-red-900 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm">Void Invoice {voidModalDoc.invoice_number}</h3>
            </div>
            <p className="text-xs text-slate-300">
              In accordance with commercial accounting compliance, invoices cannot be deleted. Voiding will permanently cancel the balance due. A mandatory explanation is required.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">
                Mandatory Void Reason *
              </label>
              <textarea
                required
                rows={3}
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="e.g. Client requested modification of deliverables before payment"
                className="w-full bg-[#0d1a38] text-white border border-[#1e325c] rounded p-2.5 text-xs focus:border-red-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVoidModalDoc(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!voidReason.trim()}
                onClick={handleVoidInvoice}
                className="px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-600 rounded disabled:opacity-50"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONVERT QUOTE MODAL */}
      {convertModalQuote && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#081126] border border-[#162445] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#162445] pb-3">
              <h3 className="font-bold text-white text-sm">
                Convert Quote {convertModalQuote.quote_code} to Invoice
              </h3>
              <button onClick={() => setConvertModalQuote(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Converting this quote will generate a sequential commercial invoice (CIQ-0002+) and mark the quote as accepted.
              </p>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Conversion Mode</label>
                <select
                  value={convertMode}
                  onChange={(e) => setConvertMode(e.target.value as any)}
                  className="w-full bg-[#0d1a38] text-white border border-[#1e325c] rounded p-2.5 text-xs"
                >
                  <option value="full">100% Full Commercial Invoice (R {convertModalQuote.total})</option>
                  <option value="deposit">50% Mobilization Deposit (R {(convertModalQuote.total * 0.5).toFixed(2)})</option>
                  <option value="balance">50% Handover Balance (R {(convertModalQuote.total * 0.5).toFixed(2)})</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#162445]">
              <button
                type="button"
                onClick={() => setConvertModalQuote(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConvertQuote}
                className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md"
              >
                Convert & Issue Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
