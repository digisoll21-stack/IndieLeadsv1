import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Reply, Users, AlertCircle, TrendingUp, ArrowUpRight, ArrowDownRight, Zap, Plus, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '../utils/api-client';
import Skeleton from '../components/Skeleton';

const StatCard: React.FC<{
  title: string; value: string; change: string; isPositive: boolean; icon: React.ElementType; isLoading?: boolean;
}> = ({ title, value, change, isPositive, icon: Icon, isLoading }) => {
  const colorClass = 'bg-emerald-50 text-emerald-600';

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-2.5 rounded-xl transition-all ${colorClass}`}>
          <Icon size={20} />
        </div>
        {isLoading ? (
          <Skeleton className="w-12 h-5 rounded-full" />
        ) : (
          <div className={`flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {isPositive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
            {change}
          </div>
        )}
      </div>
      <div className="relative z-10">
        <h3 className="text-sm font-semibold mb-1 text-slate-500">{title}</h3>
        {isLoading ? (
          <Skeleton className="w-24 h-8 mt-2" />
        ) : (
          <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        )}
      </div>
    </div>
  );
};

const DashboardPage: React.FC<{ theme: 'ethereal' | 'glass' }> = ({ theme }) => {
  const isEthereal = theme === 'ethereal';
  const navigate = useNavigate();
  const primaryColor = '#10b981';
  const [stats, setStats] = useState({ leads: '0', inboxes: '0', campaigns: '0' });
  const [chartData, setChartData] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [lRes, iRes, cRes, pRes, uRes] = await Promise.all([
          apiClient.get('/leads'),
          apiClient.get('/inboxes'),
          apiClient.get('/campaigns'),
          apiClient.get('/analytics/pulse'),
          apiClient.get('/users/me')
        ]);

        setStats({
          leads: (lRes.data?.length || 0).toLocaleString(),
          inboxes: (iRes.data?.data?.length || iRes.data?.length || 0).toString(),
          campaigns: (cRes.data?.data?.length || cRes.data?.length || 0).toString()
        });

        setCampaigns(cRes.data?.data || cRes.data || []);
        setChartData(pRes.data || []);
        setUser(uRes.data);
      } catch (err) {
        console.error('Data fetch failed');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { title: 'Total Leads', value: stats.leads, change: '+2.4%', isPositive: true, icon: Users, path: '/leads' },
    { title: 'Email Accounts', value: stats.inboxes, change: '+0.0%', isPositive: true, icon: Zap, path: '/inboxes' },
    { title: 'Active Campaigns', value: stats.campaigns, change: '+12.5%', isPositive: true, icon: TrendingUp, path: '/campaigns' },
    { title: 'Fleet Health', value: '98.2%', change: '+0.1%', isPositive: true, icon: AlertCircle, path: '/inboxes' },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Verification Banner */}
      {!isLoading && user && !user.emailVerifiedAt && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">Email not verified</p>
              <p className="text-xs text-amber-700">Please verify your email to ensure full account security and deliverability.</p>
            </div>
          </div>
          <button
            onClick={() => { /* resend logic */ }}
            className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors bg-white px-4 py-2 rounded-lg border border-amber-200"
          >
            Resend Link
          </button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor your latest performance metrics at a glance.</p>
        </div>
        <button
          onClick={() => navigate('/campaigns/new')}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:bg-slate-800 active:scale-[0.98] flex items-center justify-center shadow-lg shadow-slate-200"
        >
          <Plus size={18} className="mr-2" /> Create Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} onClick={() => navigate(card.path)} className="cursor-pointer">
            <StatCard isLoading={isLoading} title={card.title} value={card.value} change={card.change} isPositive={card.isPositive} icon={card.icon} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-slate-100 shadow-sm shadow-slate-200/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-slate-50 text-slate-900">
                <TrendingUp size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Sending Performance</h2>
            </div>
            <select className="text-xs font-semibold px-4 py-2 rounded-lg outline-none border transition-all bg-white border-slate-200 text-slate-700">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            {isLoading ? (
              <Skeleton className="w-full h-full rounded-2xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primaryColor} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="sent" stroke={primaryColor} strokeWidth={3} fillOpacity={1} fill="url(#colorMain)" />
                  <Area type="monotone" dataKey="replies" stroke="#8b5cf6" strokeWidth={3} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 flex flex-col border border-slate-100 shadow-sm shadow-slate-200/50">
          <h2 className="text-xl font-bold mb-8 text-slate-900">Recent Campaigns</h2>
          <div className="flex-1 space-y-5 overflow-y-auto pr-2">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-20 h-3" />
                  </div>
                  <Skeleton className="w-12 h-6 rounded-md" />
                </div>
              ))
            ) : campaigns.length > 0 ? (
              campaigns.slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-3 -mx-3 rounded-xl transition-colors" onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate text-slate-900">{campaign.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${campaign.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      <p className="text-xs font-medium text-slate-500 capitalize">{campaign.status}</p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs font-bold text-slate-900">32% open</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-10">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                  <Mail size={24} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">No campaigns yet.</p>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/campaigns')}
            className="w-full mt-8 py-3 rounded-xl text-sm font-semibold transition-all bg-slate-50 text-slate-700 hover:bg-slate-100">
            View all campaigns
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;