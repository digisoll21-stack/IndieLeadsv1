import React, { useState } from 'react';
import { Zap, Mail, Lock, ArrowRight, ShieldCheck, Building, Activity, AlertCircle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api-client';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');

  const nextStep = () => setStep(step + 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step < 3) {
      nextStep();
    } else {
      setIsLoading(true);
      const formData = {
        email: email.trim(),
        password: password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        workspaceName: workspaceName.trim()
      };

      try {
        const baseUrl = apiClient.defaults.baseURL;
        const response = await fetch(`${baseUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok && data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('workspaceId', data.workspace?.id || '');
          localStorage.setItem('user', JSON.stringify(data.user));
          navigate('/dashboard');
        } else {
          const errorMsg = data.message || 'Registration failed';
          throw new Error(Array.isArray(errorMsg) ? errorMsg.join('. ') : errorMsg);
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen theme-ethereal flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#10b981]/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-sky-400/10 blur-[150px] rounded-full"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[480px] glass-surface rounded-[3rem] p-12 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#10b981]/30">
            <Zap className="text-white w-9 h-9 fill-current" />
          </div>
          <h1 className="text-3xl font-black text-[#064e3b] font-heading tracking-tighter">Initiate Protocol</h1>
          <div className="flex items-center space-x-2 mt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-[#10b981]' : 'w-2 bg-slate-200'}`}></div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center">
            <AlertCircle size={16} className="mr-3 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Terminal Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email" required placeholder="solo@indieleads.io"
                      className="w-full h-14 pl-12 pr-4 rounded-2xl text-sm font-bold bg-white/60 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-[#10b981]/10 transition-all"
                      value={email} onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Secure Passkey</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password" required minLength={8} placeholder="••••••••••••"
                      className="w-full h-14 pl-12 pr-4 rounded-2xl text-sm font-bold bg-white/60 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-[#10b981]/10 transition-all"
                      value={password} onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">First Name</label>
                    <input
                      required placeholder="Alex"
                      className="w-full h-14 px-6 rounded-2xl text-sm font-bold bg-white/60 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-[#10b981]/10 transition-all"
                      value={firstName} onChange={e => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Last Name</label>
                    <input
                      required placeholder="Reed"
                      className="w-full h-14 px-6 rounded-2xl text-sm font-bold bg-white/60 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-[#10b981]/10 transition-all"
                      value={lastName} onChange={e => setLastName(e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Workspace Entity</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required placeholder="Alpha Growth"
                      className="w-full h-14 pl-12 pr-4 rounded-2xl text-sm font-bold bg-white/60 border border-slate-200 focus:outline-none focus:ring-4 focus:ring-[#10b981]/10 transition-all"
                      value={workspaceName} onChange={e => setWorkspaceName(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-[0.2em]">You can invite teammates after initialization.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit" disabled={isLoading}
            className="w-full btn-primary h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center group mt-10"
          >
            {isLoading ? <Activity className="w-5 h-5 mr-3 animate-spin" /> : (step === 3 ? 'Authorize Access' : 'Continue')}
            {!isLoading && <ArrowRight size={18} className="ml-3 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            Existing Authority? <button onClick={() => navigate('/login')} className="text-[#10b981] hover:underline">Sign In</button>
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center space-x-3 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
          <ShieldCheck size={14} className="text-[#10b981]" />
          <span>ISO 27001 Protocol</span>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;