import React, { useState, useEffect, useCallback } from 'react';
import {
  Flame, CheckCircle2, BarChart3, Info, Pause, Play,
  Loader2, AlertTriangle, RefreshCw, Zap, TrendingUp, Mail
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '../utils/api-client';
import { motion } from 'framer-motion';

interface WarmupAccount {
  id: string;
  inboxId: string;
  dailyLimit: number;
  rampUpPerDay: number;
  todaySent: number;
  totalSent: number;
  totalReceived: number;
  reputationScore: number;
  createdAt: string;
  inbox: {
    id: string;
    email: string;
    fromName: string;
    status: string;
    warmupEnabled: boolean;
  };
}

const WarmupPage: React.FC<{ theme: 'ethereal' | 'glass' }> = ({ theme }) => {
  const isEthereal = theme === 'ethereal';
  const primaryColor = '#10b981';

  const [accounts, setAccounts] = useState<WarmupAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isTriggeringCycle, setIsTriggeringCycle] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const { data } = await apiClient.get('/warmup');
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load warmup data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async (account: WarmupAccount) => {
    setTogglingId(account.inboxId);
    try {
      await apiClient.put(`/warmup/${account.inboxId}/toggle`, {
        enabled: !account.inbox.warmupEnabled,
      });
      await fetchData();
    } catch {
      // silently fail, data will stay as-is
    } finally {
      setTogglingId(null);
    }
  };

  const handleTriggerCycle = async () => {
    setIsTriggeringCycle(true);
    try {
      await apiClient.post('/warmup/trigger-cycle');
      await fetchData();
    } catch {
      // silently fail
    } finally {
      setIsTriggeringCycle(false);
    }
  };

  // --- Derived Stats ---
  const activeCount = accounts.filter(a => a.inbox.warmupEnabled).length;
  const totalSent = accounts.reduce((sum, a) => sum + a.totalSent, 0);
  const totalReceived = accounts.reduce((sum, a) => sum + a.totalReceived, 0);
  const avgReputation = accounts.length > 0
    ? Math.round(accounts.reduce((sum, a) => sum + a.reputationScore, 0) / accounts.length)
    : 100;

  // Build a ramp curve chart from the real account data (days active × rampUpPerDay)
  const rampData = accounts.length > 0
    ? Array.from({ length: 7 }, (_, i) => {
      const targetVol = accounts.reduce((sum, a) => {
        const target = Math.min((i + 1) * a.rampUpPerDay, a.dailyLimit);
        return sum + target;
      }, 0);
      return { day: `D${i + 1}`, vol: targetVol };
    })
    : [
      { day: 'D1', vol: 5 }, { day: 'D2', vol: 10 }, { day: 'D3', vol: 15 },
      { day: 'D4', vol: 20 }, { day: 'D5', vol: 25 }, { day: 'D6', vol: 35 }, { day: 'D7', vol: 50 },
    ];

  const cardBase = 'bg-white border border-slate-100 shadow-sm shadow-slate-200/50';

  const textPrimary = 'text-slate-900';
  const textMuted = 'text-slate-500';

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${textPrimary}`}>Email Warmup</h1>
          <p className={`${textMuted} text-sm mt-1`}>Protect your deliverability with automated peer simulations.</p>
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <div className="px-4 py-2 rounded-xl flex items-center border bg-emerald-50 border-emerald-100">
              <div className="w-2 h-2 rounded-full mr-2.5 animate-pulse bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-700">
                {activeCount} Inbox{activeCount !== 1 ? 'es' : ''} Active
              </span>
            </div>
          )}
          <button
            onClick={handleTriggerCycle}
            disabled={isTriggeringCycle}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 disabled:opacity-50 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            {isTriggeringCycle ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className="text-emerald-500" />}
            Run Cycle Now
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border transition-all active:scale-95 bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-medium">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { icon: Flame, label: 'Active Inboxes', value: activeCount.toString(), sub: 'warmup enabled', color: 'text-orange-500' },
          { icon: TrendingUp, label: 'Avg. Reputation', value: `${avgReputation}%`, sub: 'health score', color: 'text-emerald-500' },
          { icon: Mail, label: 'Total Sent', value: totalSent.toLocaleString(), sub: 'all time', color: 'text-blue-500' },
          { icon: CheckCircle2, label: 'Total Received', value: totalReceived.toLocaleString(), sub: 'all time', color: 'text-purple-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-6 rounded-2xl relative overflow-hidden group ${cardBase}`}
          >
            <stat.icon className={`absolute -bottom-3 -right-3 w-16 h-16 opacity-5 transition-transform duration-500 group-hover:scale-110 ${stat.color}`} />
            <p className={`text-xs font-bold uppercase tracking-widest ${textMuted} mb-2`}>{stat.label}</p>
            <p className={`text-3xl font-bold ${textPrimary}`}>{stat.value}</p>
            <p className={`text-xs ${textMuted} mt-1`}>{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Monitored Senders Table */}
        <div className={`lg:col-span-2 rounded-2xl overflow-hidden flex flex-col ${cardBase}`}>
          <div className="px-8 py-5 border-b flex items-center justify-between border-slate-100 bg-slate-50/50">
            <h2 className={`text-base font-bold ${textPrimary}`}>Monitored Senders</h2>
            <span className={`text-xs font-bold ${textMuted}`}>{accounts.length} enrolled</span>
          </div>

          {accounts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 px-8 text-center">
              <Flame size={40} className="text-slate-300 mb-4" />
              <p className={`font-bold text-base ${textPrimary}`}>No inboxes enrolled</p>
              <p className={`text-sm ${textMuted} mt-2 max-w-sm`}>
                Enable warmup on one of your inboxes from the Inboxes page to start building sender reputation.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`text-[10px] font-bold uppercase tracking-widest ${textMuted} bg-slate-50/50 border-b border-slate-100`}>
                    <th className="px-8 py-4">Email Handle</th>
                    <th className="px-8 py-4">Today's Progress</th>
                    <th className="px-8 py-4">Reputation</th>
                    <th className="px-8 py-4 text-right">Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {accounts.map((account) => {
                    const progress = account.dailyLimit > 0 ? (account.todaySent / account.dailyLimit) * 100 : 0;
                    const repColor = account.reputationScore >= 90 ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                      : account.reputationScore >= 70 ? 'text-amber-600 bg-amber-50 border-amber-100'
                        : 'text-rose-600 bg-rose-50 border-rose-100';
                    const isToggling = togglingId === account.inboxId;

                    return (
                      <tr key={account.id} className="transition-all group hover:bg-slate-50/50">
                        <td className="px-8 py-5">
                          <p className={`text-sm font-bold ${textPrimary}`}>{account.inbox.email}</p>
                          <p className={`text-xs ${textMuted} mt-0.5`}>{account.inbox.fromName || '—'}</p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center space-x-3">
                            <div className="w-28 h-1.5 rounded-full overflow-hidden bg-slate-100">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${textMuted}`}>{account.todaySent}/{account.dailyLimit}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${repColor}`}>
                            {account.reputationScore}% Healthy
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button
                            onClick={() => handleToggle(account)}
                            disabled={isToggling}
                            className={`p-2.5 rounded-xl transition-all border active:scale-95 ${account.inbox.warmupEnabled
                              ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
                              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-900 shadow-sm'
                              }`}
                            title={account.inbox.warmupEnabled ? 'Pause warmup' : 'Resume warmup'}
                          >
                            {isToggling
                              ? <Loader2 size={16} className="animate-spin" />
                              : account.inbox.warmupEnabled ? <Pause size={16} /> : <Play size={16} />
                            }
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Simulation Curve + Info */}
        <div className={`rounded-2xl flex flex-col ${cardBase} p-8`}>
          <h3 className={`text-base font-bold mb-6 flex items-center ${textPrimary}`}>
            <BarChart3 className="mr-3 text-emerald-500" size={18} /> Ramp-Up Curve
          </h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rampData}>
                <defs>
                  <linearGradient id="colorRamp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Area
                  type="monotone"
                  dataKey="vol"
                  stroke={primaryColor}
                  strokeWidth={2.5}
                  fill="url(#colorRamp)"
                  dot={{ fill: primaryColor, strokeWidth: 0, r: 3 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #f1f5f9',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                  formatter={(value: any) => [`${value} emails`, 'Daily Target']}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 p-5 rounded-xl border bg-slate-50/80 border-slate-100">
            <p className={`text-xs font-medium leading-relaxed ${textMuted}`}>
              <Info size={14} className="inline mr-1.5 text-emerald-500" />
              AI nodes simulate realistic thread depth (1–4 replies) at randomized delays to maximize sender authority scores across ISP networks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarmupPage;