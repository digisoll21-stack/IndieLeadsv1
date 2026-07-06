
import React, { useState, useEffect } from 'react';
import { User, Building, CreditCard, Shield, Key, Users, Globe, Crown, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TeamSettingsPage from './settings/TeamSettingsPage';
import TrackingDomainPage from './settings/TrackingDomainPage';
import apiClient from '../utils/api-client';

const SettingsPage: React.FC<{ theme: 'ethereal' | 'glass'; workspace?: { id: string; name: string } }> = ({ theme, workspace }) => {
  const isEthereal = theme === 'ethereal';
  const [activeMenu, setActiveMenu] = useState('Profile');
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [workspaceDetails, setWorkspaceDetails] = useState<any>(null);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    companyName: 'Alpha Growth',
    websiteUrl: 'indieleads.ai'
  });

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/users/me');
      setUser(res.data);
      setFormData(prev => ({
        ...prev,
        firstName: res.data.firstName || '',
        lastName: res.data.lastName || '',
      }));
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkspaceDetails = async () => {
    try {
      const workspaceId = workspace?.id || 'w1';
      const res = await apiClient.get(`/workspaces/${workspaceId}`);
      setWorkspaceDetails(res.data);
      if (res.data) {
        setFormData(prev => ({
          ...prev,
          companyName: res.data.name || prev.companyName,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch workspace details', err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchWorkspaceDetails();
  }, [workspace?.id]);

  const handleUpgrade = async (planName: string) => {
    const planKey = planName.toLowerCase();
    setUpgradingPlan(planKey);
    try {
      const workspaceId = workspace?.id || 'w1';
      const res = await apiClient.post(`/workspaces/${workspaceId}/billing/checkout`, {
        plan: planKey
      });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Failed to initiate upgrade checkout session', err);
    } finally {
      setUpgradingPlan(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
      };
      if (formData.password) payload.password = formData.password;

      await apiClient.patch('/users/me', payload);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const menuItems = [
    { name: 'Profile', icon: User },
    { name: 'Workspace', icon: Building },
    { name: 'Team', icon: Users },
    { name: 'Tracking', icon: Globe },
    { name: 'Subscription', icon: CreditCard },
  ];

  const activePlanKey = workspaceDetails?.plan?.toLowerCase() || 'grow';

  const plans = [
    { name: 'Launch', price: '$49', features: ['3 Active Inboxes', '2,000 Contacts', 'Unlimited Warmup'], current: activePlanKey === 'launch' },
    { name: 'Grow', price: '$99', features: ['25 Active Inboxes', '15,000 Contacts', 'AI Content Analysis'], current: activePlanKey === 'grow', popular: true },
    { name: 'Pro', price: '$199', features: ['100 Active Inboxes', '100,000 Contacts', 'White-labeled Tracking'], current: activePlanKey === 'pro' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 fade-in pb-20">
      <div>
        <h1 className="text-2xl font-bold font-heading tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm">Manage your workspace and subscription.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="w-full lg:w-72 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveMenu(item.name)}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all font-bold text-sm ${activeMenu === item.name
                ? 'bg-slate-100 text-slate-900 border border-slate-200 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              <item.icon className="w-5 h-5 mr-4" />
              {item.name}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeMenu === 'Team' ? (
              <motion.div key="team" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <TeamSettingsPage workspace={workspace} />
              </motion.div>
            ) : activeMenu === 'Tracking' ? (
              <motion.div key="tracking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <TrackingDomainPage />
              </motion.div>
            ) : activeMenu === 'Subscription' ? (
              <motion.div key="sub" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="bg-white p-8 rounded-xl border border-slate-200 relative overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-emerald-100">Active Plan</span>
                      <h2 className="text-2xl font-bold font-heading mt-3 text-slate-900">{activePlanKey.toUpperCase()} Plan</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Next billing cycle</p>
                      <p className="text-sm font-bold text-slate-700">June 12, 2024</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div key={plan.name} className={`bg-white p-6 rounded-xl border flex flex-col shadow-sm ${plan.current ? 'border-slate-900 ring-4 ring-slate-900/5' : 'border-slate-200 opacity-80'}`}>
                      {plan.popular && (
                        <span className="text-[10px] font-bold uppercase text-emerald-600 mb-2 flex items-center">Popular Choice</span>
                      )}
                      <h3 className="text-lg font-bold font-heading text-slate-900">{plan.name}</h3>
                      <div className="flex items-baseline my-4">
                        <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                        <span className="text-xs text-slate-500 ml-1">/mo</span>
                      </div>
                      <div className="flex-1 space-y-3 my-6">
                        {plan.features.map(f => (
                          <div key={f} className="flex items-center text-xs font-medium text-slate-600">
                            <Check size={14} className="mr-2 text-emerald-500" /> {f}
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => !plan.current && handleUpgrade(plan.name)}
                        disabled={plan.current || upgradingPlan !== null}
                        className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${plan.current
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                      >
                        {upgradingPlan === plan.name.toLowerCase() ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-600" />
                        ) : plan.current ? (
                          'Current Plan'
                        ) : (
                          'Select Plan'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : activeMenu === 'Profile' ? (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                <form onSubmit={handleUpdateProfile} className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-8">
                  <h2 className="text-xl font-bold font-heading text-slate-900">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full h-11 px-4 rounded-lg text-sm font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full h-11 px-4 rounded-lg text-sm font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full h-11 px-4 rounded-lg text-sm font-medium border border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">New Password (Optional)</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="w-full h-11 px-4 rounded-lg text-sm font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    {saveStatus === 'success' && (
                      <span className="text-emerald-600 text-xs font-bold flex items-center gap-2">
                        <Check size={16} /> Changes saved successfully
                      </span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="text-rose-600 text-xs font-bold">Failed to save changes</span>
                    )}
                    <div />
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div key="workspace" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                  <h2 className="text-xl font-bold font-heading mb-8 text-slate-900">Workspace Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Company Name</label>
                      <input
                        type="text" defaultValue={formData.companyName}
                        className="w-full h-11 px-4 rounded-lg text-sm font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Website URL</label>
                      <input
                        type="text" defaultValue={formData.websiteUrl}
                        className="w-full h-11 px-4 rounded-lg text-sm font-medium border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-slate-800"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-8">
                    <button className="px-6 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
                      Update Workspace
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
