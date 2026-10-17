import React, { useState, useEffect } from 'react';
import { Feedback, Deliverable } from '../types/crm';
import { Star, CheckCircle, AlertCircle, Send } from 'lucide-react';

interface PublicFeedbackViewProps {
  token: string;
}

export const PublicFeedbackView: React.FC<PublicFeedbackViewProps> = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [satisfaction, setSatisfaction] = useState(5);
  const [wouldPay, setWouldPay] = useState<'yes' | 'maybe' | 'no'>('yes');
  const [comments, setComments] = useState('');
  const [requestedChanges, setRequestedChanges] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, [token]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/public/feedback/${token}`);
      if (!resp.ok) throw new Error('Feedback link not found or expired');
      const data = await resp.json();
      setFeedback(data.feedback);
      setDeliverable(data.deliverable);
      if (data.feedback.status === 'completed') {
        setSubmitted(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const resp = await fetch(`/api/public/feedback/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          satisfaction,
          would_pay: wouldPay,
          comments,
          requested_changes: requestedChanges,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to submit feedback');
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#04091A] flex items-center justify-center p-6 text-slate-300 font-mono text-xs">
        Loading feedback form...
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#04091A] flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-[#081126] border border-emerald-800 rounded-lg p-8 text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Feedback Logged!</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Thank you for rating your prototype build. We are using your input to refine the solution.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04091A] text-slate-100 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-lg bg-[#081126] border border-[#162445] rounded-lg p-6 md:p-8 space-y-6 shadow-2xl">
        <div>
          <span className="font-mono text-cyan-400 text-xs font-bold uppercase tracking-wider">
            Prototype Evaluation
          </span>
          <h1 className="text-lg md:text-xl font-bold text-white mt-1">
            {deliverable?.name || 'Your Working Prototype'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Share your quick 30-second verdict so we can tailor the next step.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* 1-5 Rating */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              How satisfied are you with this prototype? (1-5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSatisfaction(val)}
                  className={`flex-1 py-2 rounded-lg font-mono font-bold text-sm border transition-all ${
                    satisfaction === val
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-xs'
                      : 'bg-[#050b1a] text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Would you pay */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              Would you pay for a full production deployment of this solution?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['yes', 'maybe', 'no'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setWouldPay(opt)}
                  className={`py-2 rounded-lg text-xs capitalize border font-medium transition-all ${
                    wouldPay === opt
                      ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                      : 'bg-[#050b1a] text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Requested Changes */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              What changes or improvements would you like to see?
            </label>
            <textarea
              rows={3}
              value={requestedChanges}
              onChange={(e) => setRequestedChanges(e.target.value)}
              placeholder="Features to add, adjustments, workflow revisions..."
              className="w-full bg-[#050b1a] text-xs text-slate-100 border border-slate-700 rounded-lg p-2.5 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Free Text Comments */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              General feedback or thoughts:
            </label>
            <textarea
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Any other notes..."
              className="w-full bg-[#050b1a] text-xs text-slate-100 border border-slate-700 rounded-lg p-2.5 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Submitting...' : 'Submit Verdict'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
