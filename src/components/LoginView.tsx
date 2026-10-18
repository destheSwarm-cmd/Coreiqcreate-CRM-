import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'sign_in' | 'sign_up'>('sign_in');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'sign_in') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          setErrorMessage(error.message);
        }
      } else {
        const { error, data } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) {
          setErrorMessage(error.message);
        } else if (data.session) {
          setSuccessMessage('Account created and signed in successfully!');
        } else {
          setSuccessMessage('Account created! Please check your email to confirm registration or sign in.');
          setMode('sign_in');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#04091A] flex flex-col items-center justify-center p-4 text-slate-100 antialiased select-none font-sans">
      <div className="w-full max-w-md bg-[#081126] border border-[#162445] rounded-xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center mb-3 shadow-lg shadow-cyan-950/50">
            <span className="font-bold text-cyan-400 text-lg font-mono">IQ</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">CoreIQ CRM</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise Client & Pipeline Management
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-5 p-3 rounded-lg bg-amber-950/60 border border-amber-800/80 flex items-start gap-2.5 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">Supabase Connection Required</p>
              <p className="text-[11px] text-amber-400/90 mt-0.5">
                Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect to your Supabase instance.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded bg-red-950/70 border border-red-800 flex items-start gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded bg-emerald-950/70 border border-emerald-800 flex items-start gap-2 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Operator Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@coreiq.com"
                className="w-full bg-[#0d1a38] text-xs text-slate-100 placeholder-slate-500 rounded border border-[#1e325c] focus:outline-none focus:border-cyan-500 pl-9 pr-3 py-2.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0d1a38] text-xs text-slate-100 placeholder-slate-500 rounded border border-[#1e325c] focus:outline-none focus:border-cyan-500 pl-9 pr-3 py-2.5"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-cyan-950"
          >
            {isSubmitting ? (
              <span className="font-mono">Authenticating...</span>
            ) : (
              <>
                <span>{mode === 'sign_in' ? 'Sign In to CoreIQ' : 'Create Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-5 pt-4 border-t border-[#162445] text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {mode === 'sign_in'
              ? "Don't have an operator account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-500/70" />
          <span>Protected by Supabase Auth & Row Level Security</span>
        </div>
      </div>
    </div>
  );
};
