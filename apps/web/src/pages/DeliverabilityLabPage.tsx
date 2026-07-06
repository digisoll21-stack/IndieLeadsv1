import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Globe, TrendingUp, Play, Zap, ChevronRight, Fingerprint,
  AlertCircle, CheckCircle2, X, Mail, Loader2, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '../utils/api-client';

const DeliverabilityLabPage: React.FC<{ theme: 'ethereal' | 'glass' }> = ({ theme }) => {
  const isEthereal = theme === 'ethereal';
  const primaryColor = '#10b981';

  const [history, setHistory] = useState<any[]>([]);
  const [inboxes, setInboxes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  // Test Form State
  const [showTestModal, setShowTestModal] = useState(false);
  const [testConfig, setTestConfig] = useState({ inboxId: '', subject: '', body: '' });
  const [activeTest, setActiveTest] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [{ data: historyData }, { data: inboxesData }] = await Promise.all([
        apiClient.get('/deliverability-lab/history'),
        apiClient.get('/inboxes')
      ]);
      setHistory(historyData || []);
      setInboxes(Array.isArray(inboxesData) ? inboxesData : (inboxesData.data || []));

      if (historyData.length > 0) {
        setActiveTest(historyData[0]);
      }
    } catch (err) {
      console.error('Fetch failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runTest = async () => {
    if (!testConfig.inboxId || !testConfig.subject) return;
    setIsTesting(true);
    try {
      const { data } = await apiClient.post('/deliverability-lab/test', testConfig);
      setActiveTest(data);
      setShowTestModal(false);
      setTestConfig({ inboxId: '', subject: '', body: '' });
      fetchData();
    } catch (err) {
      alert('Audit engine failure.');
    } finally {
      setIsTesting(false);
    }
  };

  const chartData = history.slice(0, 7).reverse().map(t => ({
    day: new Date(t.createdAt).toLocaleDateString('en-US', { weekday: 'short' }),
    score: t.score
  }));

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
      <p className="text-sm font-black uppercase tracking-widest text-slate-400">Synchronizing Lab Data...</p>
    </div>
  );

  return (
    <div className="space-y-8 fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black font-heading tracking-tight text-[#064e3b]">Deliverability Lab</h1>
          <p className="text-slate-600 font-medium">Functional DNS auditing, placement heuristics, and AI fingerprinting.</p>
        </div>
        <button
          onClick={() => setShowTestModal(true)}
          className="btn-primary px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95 flex items-center"
        >
          <Play className="w-4 h-4 mr-3" />
          Launch Placement Audit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Score Card */}
        <div className="glass-surface rounded-[2.5rem] p-10 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 -mr-16 -mt-16 bg-[#10b981]"></div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-10 text-center">
            {activeTest ? `Latest Audit: ${new Date(activeTest.createdAt).toLocaleDateString()}` : 'System Reputation'}
          </h3>
          <div className="relative w-48 h-48 flex items-center justify-center mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
              <motion.circle
                cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent"
                strokeDasharray={502}
                initial={{ strokeDashoffset: 502 }}
                animate={{ strokeDashoffset: 502 - (502 * (activeTest?.score || 90) / 100) }}
                transition={{ duration: 2, ease: "easeOut" }}
                style={{ stroke: primaryColor }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-black font-heading text-[#064e3b]">{activeTest?.score || '--'}</span>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">
                {(activeTest?.score || 0) > 80 ? 'Excellent' : (activeTest?.score || 0) > 50 ? 'Moderate' : 'Risk Warning'}
              </span>
            </div>
          </div>

          <div className="w-full space-y-6">
            <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-8">
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">SPF</p>
                {activeTest?.dnsHealth?.spf ? <CheckCircle2 size={16} className="mx-auto text-emerald-500" /> : <AlertCircle size={16} className="mx-auto text-rose-500" />}
              </div>
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">DKIM</p>
                {activeTest?.dnsHealth?.dkim ? <CheckCircle2 size={16} className="mx-auto text-emerald-500" /> : <AlertCircle size={16} className="mx-auto text-rose-500" />}
              </div>
              <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">DMARC</p>
                {activeTest?.dnsHealth?.dmarc ? <CheckCircle2 size={16} className="mx-auto text-emerald-500" /> : <AlertCircle size={16} className="mx-auto text-amber-500" />}
              </div>
            </div>
          </div>
        </div>

        {/* Chart View */}
        <div className="lg:col-span-2 glass-surface rounded-[2.5rem] p-10 flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-lg font-black font-heading flex items-center text-[#064e3b]">
              <TrendingUp className="w-5 h-5 mr-3 text-[#10b981]" /> Deliverability Pulse
            </h3>
            <div className="flex items-center space-x-2 text-[10px] font-black text-slate-500 uppercase">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
              <span>Trend Accuracy: High</span>
            </div>
          </div>
          <div className="flex-1 min-h-[250px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorLab" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={11} dy={10} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }} />
                  <Area type="monotone" dataKey="score" stroke={primaryColor} strokeWidth={4} fill="url(#colorLab)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                <BarChart3 size={40} />
                <p className="text-xs font-bold uppercase tracking-widest">No audit history available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Detail / Recommendations */}
      {activeTest && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-surface rounded-[2.5rem] p-10 space-y-8">
            <h4 className="text-lg font-black font-heading text-[#064e3b] flex items-center">
              <ShieldCheck className="w-5 h-5 mr-3 text-emerald-500" /> AI Recommendations
            </h4>
            <div className="space-y-4">
              {activeTest.recommendations.map((rec: string, i: number) => (
                <div key={i} className="flex items-start space-x-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm shrink-0">{i + 1}</div>
                  <p className="text-sm font-bold text-slate-700">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-surface rounded-[2.5rem] p-10 space-y-8">
            <h4 className="text-lg font-black font-heading text-[#064e3b] flex items-center">
              <Globe className="w-5 h-5 mr-3 text-blue-500" /> Placement Predictions
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(activeTest.placement).map(([provider, target]: [string, any]) => (
                <div key={provider} className="p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-500">{provider}</span>
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${target === 'primary' ? 'bg-emerald-50 text-emerald-600' : target === 'promotions' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                    {target}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History Button at Bottom */}
      <div className="glass-surface rounded-[3rem] p-12 flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 blur-[100px] opacity-10 -ml-32 -mt-32 bg-[#10b981]"></div>
        <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center shrink-0 shadow-2xl relative z-10 bg-[#10b981]">
          <Fingerprint className="text-white" size={48} />
        </div>
        <div className="flex-1 relative z-10">
          <h4 className="text-2xl font-black font-heading mb-4 text-[#064e3b]">Deliverability Fingerprinting</h4>
          <p className="text-slate-600 text-sm font-medium leading-relaxed max-w-2xl">
            Audit history tracking SPF/DKIM integrity and AI-powered spam trigger detection over time. Run tests periodically to ensure sender health.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-2xl font-black text-[#064e3b]">{history.length}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total<br />Audits</span>
        </div>
      </div>

      {/* Test Modal */}
      <AnimatePresence>
        {showTestModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl rounded-[2.5rem] overflow-hidden border border-white shadow-2xl bg-white p-10"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black font-heading text-[#064e3b]">Placement Audit</h2>
                    <p className="text-sm font-medium text-slate-500">Configure your test parameters.</p>
                  </div>
                </div>
                <button onClick={() => setShowTestModal(false)} className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Sending Node</label>
                  <select
                    value={testConfig.inboxId}
                    onChange={(e) => setTestConfig({ ...testConfig, inboxId: e.target.value })}
                    className="w-full h-14 px-6 rounded-2xl text-sm font-bold bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">Select an Inbox</option>
                    {inboxes.map(inbox => (
                      <option key={inbox.id} value={inbox.id}>{inbox.email}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Subject Line</label>
                  <input
                    value={testConfig.subject}
                    onChange={(e) => setTestConfig({ ...testConfig, subject: e.target.value })}
                    placeholder="e.g. Quick question regarding your fleet scaling"
                    className="w-full h-14 px-6 rounded-2xl text-sm font-bold bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Body</label>
                  <textarea
                    rows={6}
                    value={testConfig.body}
                    onChange={(e) => setTestConfig({ ...testConfig, body: e.target.value })}
                    placeholder="Paste your email content here for fingerprinting..."
                    className="w-full p-6 rounded-[1.5rem] text-sm font-bold bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                  />
                </div>

                <button
                  onClick={runTest}
                  disabled={isTesting || !testConfig.inboxId || !testConfig.subject}
                  className="w-full h-16 rounded-[1.5rem] bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-slate-200 flex items-center justify-center transition-all hover:bg-slate-800 disabled:opacity-50"
                >
                  {isTesting ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Play className="w-5 h-5 mr-3" />}
                  {isTesting ? 'Analyzing ISP Signals...' : 'Initiate Full Audit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeliverabilityLabPage;
