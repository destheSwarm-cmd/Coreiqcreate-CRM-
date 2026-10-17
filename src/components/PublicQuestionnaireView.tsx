import React, { useState, useEffect } from 'react';
import { Questionnaire, QuestionnaireQuestion } from '../types/crm';
import { CheckCircle2, AlertCircle, Send, ArrowRight, ArrowLeft } from 'lucide-react';

interface PublicQuestionnaireViewProps {
  token: string;
}

export const PublicQuestionnaireView: React.FC<PublicQuestionnaireViewProps> = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [client, setClient] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestionnaire();
  }, [token]);

  const fetchQuestionnaire = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/public/questionnaire/${token}`);
      if (!resp.ok) throw new Error('Questionnaire not found or link expired');
      const data = await resp.json();
      setQuestionnaire(data.questionnaire);
      setClient(data.client);
      if (data.questionnaire.status === 'completed') {
        setSubmitted(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    const updated = { ...answers, [questionId]: value };
    setAnswers(updated);
    // Autosave in localStorage
    try {
      localStorage.setItem(`coreiq_qn_${token}`, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const resp = await fetch(`/api/public/questionnaire/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to submit questionnaire');
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
        Loading discovery questionnaire...
      </div>
    );
  }

  if (errorMsg && !questionnaire) {
    return (
      <div className="min-h-screen bg-[#04091A] flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-[#081126] border border-red-800 rounded-lg p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <h2 className="text-base font-bold">Link Not Found or Expired</h2>
          <p className="text-xs text-slate-400">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#04091A] flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-[#081126] border border-emerald-800 rounded-lg p-8 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Thank You!</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your discovery requirements have been submitted to the CoreIQ engineering team.
            We will synthesize your build brief and prepare your free prototype.
          </p>
        </div>
      </div>
    );
  }

  const questions = questionnaire?.questions || [];
  const currentQ = questions[currentIndex];
  const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="min-h-screen bg-[#04091A] text-slate-100 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl bg-[#081126] border border-[#162445] rounded-lg shadow-2xl overflow-hidden p-6 md:p-8 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-cyan-400 text-xs font-bold uppercase tracking-wider">
              {client ? client.name : 'CoreIQ Discovery'}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>

          <h1 className="text-base md:text-lg font-bold text-white tracking-tight">
            {questionnaire?.title}
          </h1>

          {/* Progress Bar */}
          <div className="w-full bg-[#050b1a] h-1.5 rounded-full overflow-hidden mt-3 border border-slate-800">
            <div
              className="bg-cyan-400 h-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Current Question Block */}
        {currentQ && (
          <div className="space-y-4 min-h-[160px]">
            <label className="block text-sm font-semibold text-slate-100 leading-snug">
              {currentQ.label}
              {currentQ.required && <span className="text-red-400 ml-1">*</span>}
            </label>

            {/* Input type render */}
            {currentQ.type === 'long_text' && (
              <textarea
                autoFocus
                rows={4}
                value={answers[currentQ.id] || ''}
                onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                placeholder={currentQ.placeholder || 'Your response...'}
                className="w-full bg-[#050b1a] text-xs text-slate-100 border border-slate-700 rounded-lg p-3 focus:border-cyan-500 focus:outline-none"
              />
            )}

            {currentQ.type === 'short_text' && (
              <input
                type="text"
                autoFocus
                value={answers[currentQ.id] || ''}
                onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                placeholder={currentQ.placeholder || 'Type here...'}
                className="w-full bg-[#050b1a] text-xs text-slate-100 border border-slate-700 rounded-lg p-3 focus:border-cyan-500 focus:outline-none"
              />
            )}

            {currentQ.type === 'single_choice' && (
              <div className="space-y-2">
                {currentQ.options?.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleAnswerChange(currentQ.id, opt)}
                    className={`w-full p-3 rounded-lg text-xs text-left border transition-all ${
                      answers[currentQ.id] === opt
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-semibold'
                        : 'bg-[#050b1a] text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {currentQ.type === 'date' && (
              <input
                type="date"
                value={answers[currentQ.id] || ''}
                onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                className="w-full bg-[#050b1a] text-xs text-slate-100 border border-slate-700 rounded-lg p-3 focus:border-cyan-500 focus:outline-none"
              />
            )}
          </div>
        )}

        {/* Navigation / Submit Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#162445]">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white disabled:opacity-30"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((idx) => Math.min(questions.length - 1, idx + 1))}
              className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Complete & Submit'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
