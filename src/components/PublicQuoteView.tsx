import React, { useState, useEffect } from 'react';
import { Quote, QuoteLine, CrmSettings } from '../types/crm';
import { CheckCircle, AlertCircle, Printer, FileText, ExternalLink, ShieldCheck } from 'lucide-react';

interface PublicQuoteViewProps {
  token: string;
  onAccepted?: () => void;
}

export const PublicQuoteView: React.FC<PublicQuoteViewProps> = ({ token, onAccepted }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ quote: Quote; lines: QuoteLine[]; client: any; settings: any } | null>(null);
  const [signerName, setSignerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchQuote();
  }, [token]);

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/public/quote/${token}`);
      if (!resp.ok) throw new Error('Quote not found or invalid link');
      const json = await resp.json();
      setData(json);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const resp = await fetch(`/api/public/quote/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signer_name: signerName }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Failed to accept quote');
      setSuccessMsg(json.message);
      fetchQuote();
      if (onAccepted) onAccepted();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#04091A] flex items-center justify-center p-6 text-slate-300 font-mono text-xs">
        Loading commercial proposal...
      </div>
    );
  }

  if (errorMsg && !data) {
    return (
      <div className="min-h-screen bg-[#04091A] flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-[#081126] border border-red-800 rounded-lg p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <h2 className="text-base font-bold">Proposal Link Expired or Invalid</h2>
          <p className="text-xs text-slate-400">{errorMsg}</p>
        </div>
      </div>
    );
  }

  const { quote, lines, client, settings } = data!;
  const isAccepted = quote.status === 'accepted';

  return (
    <div className="min-h-screen bg-[#04091A] text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Print / PDF Action Bar */}
        <div className="flex items-center justify-between no-print bg-[#081126] border border-[#162445] p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-cyan-400">CoreIQ Create</span>
            <span className="text-xs text-slate-400">· Commercial Proposal</span>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-[#0f1d3d] hover:bg-[#162752] border border-[#1e325c] rounded transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Save as PDF / Print</span>
          </button>
        </div>

        {/* Success Banner */}
        {isAccepted && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <div>
                <div className="font-bold text-sm text-emerald-300">Proposal Accepted</div>
                <div className="text-xs text-emerald-200/80">
                  Confirmed by <strong>{quote.accepted_by_name}</strong> on{' '}
                  {new Date(quote.accepted_at!).toLocaleDateString()}.
                </div>
              </div>
            </div>
            {quote.payment_link_url && (
              <a
                href={quote.payment_link_url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded"
              >
                Proceed to Deposit
              </a>
            )}
          </div>
        )}

        {/* PRINTABLE PROPOSAL CONTAINER */}
        <div className="bg-[#081126] border border-[#162445] rounded-lg p-6 md:p-8 space-y-6 shadow-xl print:border-none print:shadow-none print:bg-white print:text-black">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#162445] pb-6 print:border-black/20">
            <div>
              <div className="text-2xl font-black text-cyan-400 tracking-tight print:text-black">COREIQ CREATE</div>
              <div className="text-xs text-slate-400 mt-1 print:text-slate-600">
                AI Solutions, Multi-Agent Systems & High-Throughput Automation
              </div>
              <div className="text-xs text-slate-400 print:text-slate-600">contact@coreiq.create</div>
            </div>

            <div className="text-right font-mono text-xs">
              <div className="text-base font-bold text-white print:text-black">{quote.quote_code}</div>
              <div className="text-slate-400 print:text-slate-600">Date: {quote.created_at.split('T')[0]}</div>
              <div className="text-slate-400 print:text-slate-600">Valid Until: {quote.valid_until}</div>
            </div>
          </div>

          {/* Client Prepared For */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] mb-1">Prepared For</div>
              <div className="font-bold text-base text-white print:text-black">{client?.name || 'Valued Client'}</div>
              <div className="text-slate-400 font-mono print:text-slate-600">{client?.client_code}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] mb-1">Status</div>
              <div className="font-bold text-sm uppercase font-mono text-cyan-400 print:text-black">{quote.status}</div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#162445] text-slate-400 font-mono uppercase text-[10px] print:border-black/20">
                  <th className="py-2.5 px-2">Item / Solution Scope</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                  <th className="py-2.5 px-2 text-right">Unit Price</th>
                  <th className="py-2.5 px-2 text-right">Total ({quote.currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#162445]/60 print:divide-black/10">
                {lines.map((line) => (
                  <tr key={line.id}>
                    <td className="py-3 px-2">
                      <div className="font-semibold text-slate-100 print:text-black">{line.description}</div>
                      {line.discount_pct > 0 && (
                        <div className="text-[10px] text-amber-400 print:text-amber-800">
                          Applied line discount: {line.discount_pct}%
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center font-mono">{line.qty}</td>
                    <td className="py-3 px-2 text-right font-mono">{line.unit_price.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-slate-100 print:text-black">
                      {line.line_total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end pt-2 border-t border-[#162445] print:border-black/20">
            <div className="w-64 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400 print:text-slate-600">
                <span>Subtotal:</span>
                <span>{quote.subtotal.toLocaleString()} {quote.currency}</span>
              </div>
              <div className="flex justify-between text-slate-400 print:text-slate-600">
                <span>VAT ({Math.round(quote.tax_rate * 100)}%):</span>
                <span>{quote.tax_total.toLocaleString()} {quote.currency}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-cyan-400 print:text-black pt-2 border-t border-slate-800 print:border-black/20">
                <span>Total:</span>
                <span>{quote.total.toLocaleString()} {quote.currency}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          {quote.terms_md && (
            <div className="pt-4 border-t border-[#162445] print:border-black/20 text-xs text-slate-300 print:text-slate-700 space-y-1.5">
              <div className="font-bold text-white print:text-black uppercase text-[10px] tracking-wider">
                Commercial Terms & Scope
              </div>
              <div className="p-3 bg-[#050b1a] print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded text-[11px] leading-relaxed whitespace-pre-wrap">
                {quote.terms_md}
              </div>
            </div>
          )}

          {/* Payment Link If Set */}
          {quote.payment_link_url && (
            <div className="p-3 bg-[#0d1a38] border border-cyan-800/60 rounded text-xs flex items-center justify-between no-print">
              <span>Online Payment Provider:</span>
              <a
                href={quote.payment_link_url}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 font-mono font-bold flex items-center gap-1 hover:underline"
              >
                <span>{quote.payment_link_url}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* ACCEPTANCE SIGNATURE BOX */}
          {!isAccepted && (
            <form onSubmit={handleAccept} className="pt-6 border-t border-[#162445] no-print space-y-3">
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Accept Commercial Proposal & Commission Build</span>
              </div>
              <p className="text-xs text-slate-400">
                By entering your full name below, you confirm agreement to the scope of delivery and commercial terms.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Enter your full legal name..."
                  className="flex-1 bg-[#050b1a] text-xs text-white border border-slate-700 rounded p-2.5 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submitting || !signerName.trim()}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Confirming...' : 'Accept & Proceed'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
