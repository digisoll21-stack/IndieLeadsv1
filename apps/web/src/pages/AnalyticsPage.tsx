import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, TrendingUp, AlertTriangle, Mail, Reply,
  Loader2, RefreshCw, Shield, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart as RPieChart, Pie, Cell, LabelList
} from 'recharts';
import apiClient from '../utils/api-client';
import { motion } from 'framer-motion';
import Skeleton from '../components/Skeleton';

interface PulseDay { name: string; date: string; sent: number; replies: number; }
interface SentimentItem { name: string; value: number; }
interface CampaignRow {
  id: string; name: string; status: string; steps: number;
  sent: number; failed: number; bounced: number; spamComplaint: number;
  replies: number; total: number; replyRate: number; bounceRate: number;
}
interface BounceStats {
  hard: number; soft: number; spam: number;
  total: number; bounceRate: number; totalSent: number; period: string;
}

const SENTIMENT_COLORS = ['#10b981', '#94a3b8', '#f43f5e', '#f59e0b', '#8b5cf6'];

const statusColor = (status: string) => {
  if (status === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'paused') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (status === 'completed') return 'bg-blue-50 text-blue-700 border-blue-100';
  return 'bg-slate-50 text-slate-500 border-slate-100';
};

const AnalyticsPage: React.FC<{ theme: 'ethereal' | 'glass' }> = ({ theme }) => {
  const isEthereal = theme === 'ethereal';
  const primaryColor = '#10b981';

  const [pulse, setPulse] = useState<PulseDay[]>([]);
  const [sentiment, setSentiment] = useState<SentimentItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [bounceStats, setBounceStats] = useState<BounceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pulseRes, sentimentRes, campaignsRes, bounceRes] = await Promise.all([
        apiClient.get('/analytics/pulse'),
        apiClient.get('/analytics/sentiment'),
        apiClient.get('/analytics/campaigns'),
        apiClient.get('/bounces/stats'),
      ]);
      setPulse(pulseRes.data || []);
      setSentiment(sentimentRes.data || []);
      setCampaigns(campaignsRes.data || []);
      setBounceStats(bounceRes.data || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load analytics data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Derived totals from pulse data
  const totalSent = pulse.reduce((s, d) => s + d.sent, 0);
  const totalReplies = pulse.reduce((s, d) => s + d.replies, 0);
  const replyRate = totalSent > 0 ? ((totalReplies / totalSent) * 100).toFixed(1) : '0.0';

  const cardBase = 'bg-white border border-slate-100 shadow-sm shadow-slate-200/50';
  const textPrimary = 'text-slate-900';
  const textMuted = 'text-slate-500';
  const divider = 'divide-slate-50 border-slate-100';

  const tooltipStyle = {
    backgroundColor: '#fff', border: '1px solid #f1f5f9',
    borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    fontSize: '12px', fontWeight: '600',
  };

  return (
    <div className="space-y-10 fade-in pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${textPrimary}`}>Analytics</h1>
          <p className={`${textMuted} text-sm mt-1`}>Live performance data from your campaigns and email engine.</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-medium">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Emails Sent', icon: Mail, color: 'text-blue-500',
            value: isLoading ? '—' : totalSent.toLocaleString(),
            sub: 'last 7 days',
            trend: null,
          },
          {
            label: 'Replies', icon: Reply, color: 'text-emerald-500',
            value: isLoading ? '—' : totalReplies.toLocaleString(),
            sub: `${replyRate}% reply rate`,
            trend: null,
          },
          {
            label: 'Bounce Rate', icon: AlertTriangle, color: 'text-rose-500',
            value: isLoading ? '—' : `${bounceStats?.bounceRate ?? 0}%`,
            sub: `${bounceStats?.total ?? 0} bounces (30d)`,
            trend: bounceStats ? (bounceStats.bounceRate > 5 ? 'bad' : 'good') : null,
          },
          {
            label: 'Spam Complaints', icon: Shield, color: 'text-amber-500',
            value: isLoading ? '—' : String(bounceStats?.spam ?? 0),
            sub: 'last 30 days',
            trend: bounceStats ? (bounceStats.spam > 0 ? 'bad' : 'good') : null,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-6 rounded-2xl relative overflow-hidden group ${cardBase}`}
          >
            <stat.icon className={`absolute -bottom-3 -right-3 w-14 h-14 opacity-[0.06] ${stat.color}`} />
            <p className={`text-[10px] font-bold uppercase tracking-widest ${textMuted} mb-2`}>{stat.label}</p>
            {isLoading
              ? <Skeleton className="w-20 h-8 mt-1" />
              : <p className={`text-3xl font-bold ${textPrimary}`}>{stat.value}</p>
            }
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${textMuted}`}>
              {stat.trend === 'good' && <ArrowUpRight size={12} className="text-emerald-500" />}
              {stat.trend === 'bad' && <ArrowDownRight size={12} className="text-rose-500" />}
              {stat.sub}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* 7-day Trend */}
        <div className={`rounded-2xl p-8 ${cardBase}`}>
          <h3 className={`text-base font-bold mb-6 flex items-center ${textPrimary}`}>
            <TrendingUp className="mr-3 text-emerald-500" size={18} /> 7-Day Volume Trend
          </h3>
          {isLoading ? (
            <Skeleton className="w-full h-[220px]" />
          ) : pulse.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-[220px] ${textMuted} text-sm`}>No data yet.</div>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pulse}>
                  <defs>
                    <linearGradient id="gradSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primaryColor} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradReply" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '600', paddingTop: '12px' }} />
                  <Area type="monotone" dataKey="sent" name="Sent" stroke={primaryColor} strokeWidth={2.5} fill="url(#gradSent)" dot={false} />
                  <Area type="monotone" dataKey="replies" name="Replies" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gradReply)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Reply Sentiment Pie */}
        <div className={`rounded-2xl p-8 ${cardBase}`}>
          <h3 className={`text-base font-bold mb-6 flex items-center ${textPrimary}`}>
            <BarChart3 className="mr-3 text-purple-500" size={18} /> Reply Sentiment (30d)
          </h3>
          {isLoading ? (
            <Skeleton className="w-full h-[220px]" />
          ) : sentiment.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-[220px] ${textMuted} text-sm`}>
              No replies yet. Start a campaign to see sentiment data.
            </div>
          ) : (
            <div className="h-[220px] flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie data={sentiment} innerRadius={55} outerRadius={85} paddingAngle={6} dataKey="value">
                    {sentiment.map((_, index) => (
                      <Cell key={index} fill={SENTIMENT_COLORS[index % SENTIMENT_COLORS.length]} stroke="none" />
                    ))}
                    <LabelList dataKey="value" position="outside" style={{ fontSize: '11px', fontWeight: '700', fill: '#64748b' }} />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Bounce Breakdown Bar */}
      {!isLoading && bounceStats && (
        <div className={`rounded-2xl p-8 ${cardBase}`}>
          <h3 className={`text-base font-bold mb-6 flex items-center ${textPrimary}`}>
            <AlertTriangle className="mr-3 text-rose-500" size={18} /> Bounce Breakdown (30d)
          </h3>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'Hard Bounces', value: bounceStats.hard, color: 'bg-rose-500', sub: 'Invalid addresses' },
              { label: 'Soft Bounces', value: bounceStats.soft, color: 'bg-amber-400', sub: 'Temporary failures' },
              { label: 'Spam Complaints', value: bounceStats.spam, color: 'bg-orange-500', sub: 'Complaint reports' },
            ].map(item => (
              <div key={item.label} className="p-5 rounded-xl border bg-slate-50/60 border-slate-100">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color} mb-3`} />
                <p className={`text-xs font-bold uppercase tracking-widest ${textMuted} mb-1`}>{item.label}</p>
                <p className={`text-3xl font-bold ${textPrimary}`}>{item.value}</p>
                <p className={`text-xs ${textMuted} mt-1`}>{item.sub}</p>
              </div>
            ))}
          </div>
          {bounceStats.bounceRate > 5 && (
            <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-medium">
              <AlertTriangle size={16} />
              Your bounce rate ({bounceStats.bounceRate}%) is above the safe threshold of 5%. Review your lead list quality.
            </div>
          )}
        </div>
      )}

      {/* Campaign Performance Table */}
      <div className={`rounded-2xl overflow-hidden ${cardBase}`}>
        <div className={`px-8 py-5 border-b ${divider} flex items-center justify-between bg-slate-50/50`}>
          <h2 className={`text-base font-bold ${textPrimary}`}>Campaign Performance</h2>
          <span className={`text-xs font-bold ${textMuted}`}>{campaigns.length} campaigns</span>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="w-full h-12 rounded-xl" />)}
          </div>
        ) : campaigns.length === 0 ? (
          <div className={`p-16 text-center ${textMuted} text-sm`}>No campaigns yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`text-[10px] font-bold uppercase tracking-widest ${textMuted} bg-slate-50/50 border-b border-slate-100`}>
                  <th className="px-8 py-4">Campaign</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Sent</th>
                  <th className="px-8 py-4">Replies</th>
                  <th className="px-8 py-4">Reply Rate</th>
                  <th className="px-8 py-4">Bounce Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y font-medium divide-slate-50">
                {campaigns.map((c) => (
                  <tr key={c.id} className="transition-all hover:bg-slate-50/40">
                    <td className="px-8 py-5">
                      <p className={`text-sm font-bold ${textPrimary} truncate max-w-[200px]`}>{c.name}</p>
                      <p className={`text-xs ${textMuted} mt-0.5`}>{c.steps} sequence steps</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${statusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className={`px-8 py-5 text-sm font-bold ${textPrimary}`}>{c.sent.toLocaleString()}</td>
                    <td className={`px-8 py-5 text-sm font-bold ${textPrimary}`}>{c.replies}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-slate-100">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(c.replyRate * 3, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${c.replyRate > 5 ? 'text-emerald-600' : textMuted}`}>
                          {c.replyRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-xs font-bold ${c.bounceRate > 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {c.bounceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AnalyticsPage;