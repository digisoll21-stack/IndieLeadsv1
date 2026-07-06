import React, { useState } from 'react';
import { Zap, Mail, Lock, ArrowRight, ShieldCheck, Activity, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api-client';

const LoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data } = await apiClient.post('/auth/login', {
        email: email.trim(),
        password: password
      });

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('workspaceId', data.workspace?.id || 'w1');
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin();
        navigate('/dashboard');
      } else {
        throw new Error('Protocol mismatch. Credentials rejected.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Handshake timed out.';
      setError(Array.isArray(msg) ? msg.join('. ') : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen theme-ethereal flex items-center justify-center p-6 bg-slate-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-100/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-sky-100/30 blur-[120px] rounded-full"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[450px] bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100 relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-200"
          >
            <Zap className="text-white w-8 h-8 fill-current" />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-900 font-heading">IndieLeads</h1>
          <p className="text-slate-500 font-medium mt-2">The Pro Deliverability Protocol</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-xl flex items-start"
          >
            <AlertCircle size={18} className="mr-3 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-12 pl-12 pr-4 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mt-2 ml-1">
              <label className="block text-sm font-semibold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-12 pl-12 pr-4 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 text-white h-12 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center group mt-8 shadow-lg shadow-slate-200"
          >
            {isLoading ? <Activity className="w-5 h-5 mr-3 animate-spin" /> : 'Sign in to account'}
            {!isLoading && <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500 font-medium">
            New to IndieLeads? <button onClick={() => navigate('/signup')} className="text-emerald-600 font-semibold hover:text-emerald-700">Create an account</button>
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center space-x-2 text-xs text-slate-400 font-medium">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>World-class security included</span>
        </div>
      </motion.div>
    </div >
  );
};

export default LoginPage;