import React, { useState, useEffect } from 'react';
import { Mail, Plus, ShieldCheck, Settings, Trash2, RefreshCw, X, ChevronRight, AlertCircle, CheckCircle2, Loader2, Search, Filter, MoreVertical, Play, Pause, Activity, Globe, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../utils/api-client';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import BulkUpdateModal from '../components/BulkUpdateModal';

const PROVIDER_CONFIGS = {
  google: {
    name: 'Google Workspace',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    help: 'Requires a 16-character App Password generated in your Google Account security settings. Using Port 587 for better reliability.'
  },
  outlook: {
    name: 'Microsoft 365',
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    help: 'Requires an App Password if Multi-Factor Authentication is enabled on your account.'
  },
  smtp: {
    name: 'Custom SMTP/IMAP',
    smtpHost: '',
    smtpPort: 465,
    imapHost: '',
    imapPort: 993,
    help: 'Contact your email administrator for specialized SMTP and IMAP host settings.'
  }
};

const AddInboxModal: React.FC<{ isOpen: boolean; onClose: () => void; onCreated: () => void; theme: 'ethereal' | 'glass' }> = ({ isOpen, onClose, onCreated, theme }) => {
  const isEthereal = theme === 'ethereal';
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState<keyof typeof PROVIDER_CONFIGS | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '', fromName: '', smtpHost: '', smtpPort: 465, imapHost: '', imapPort: 993 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleProviderSelect = (key: keyof typeof PROVIDER_CONFIGS) => {
    const config = PROVIDER_CONFIGS[key];
    setProvider(key);
    setFormData(prev => ({
      ...prev,
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      imapHost: config.imapHost,
      imapPort: config.imapPort
    }));
    setStep(2);
  };

  const resetForm = () => {
    setStep(1);
    setProvider(null);
    setFormData({ email: '', password: '', fromName: '', smtpHost: '', smtpPort: 587, imapHost: '', imapPort: 993 });
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setError('');

    try {
      await apiClient.post('/inboxes', {
        email: formData.email,
        provider,
        fromName: formData.fromName || formData.email.split('@')[0],
        credentials: {
          smtpHost: formData.smtpHost,
          smtpPort: Number(formData.smtpPort),
          smtpUser: formData.email,
          smtpPass: formData.password,
          imapHost: formData.imapHost,
          imapPort: Number(formData.imapPort),
          imapUser: formData.email,
          imapPass: formData.password
        }
      });
      onCreated();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Connection handshake failed.');
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl rounded-3xl shadow-2xl bg-white border border-slate-100 my-auto"
      >
        <div className="px-8 py-6 flex items-center justify-between border-b border-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Connect Email Account</h2>
            <p className="text-sm text-slate-500 mt-1">Add your professional mailbox to IndieLeads.</p>
          </div>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-xl">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start text-red-700 text-sm font-medium">
              <AlertCircle size={20} className="mr-3 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-6">
              <p className="text-sm font-semibold text-slate-900">Choose your email provider</p>
              <div className="grid grid-cols-1 gap-4">
                {(Object.entries(PROVIDER_CONFIGS) as [keyof typeof PROVIDER_CONFIGS, any][]).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => handleProviderSelect(key)}
                    className="flex items-center justify-between p-5 rounded-2xl border transition-all bg-white border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/30 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50">
                        <Mail size={24} className="text-slate-900" />
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-base block text-slate-900">{config.name}</span>
                        <span className="text-xs text-slate-500">Fast & secure connection</span>
                      </div>
                    </div>
                    <ArrowRight size={20} className="text-slate-300 group-hover:text-emerald-500" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-5 rounded-2xl border flex items-start space-x-4 mb-8 bg-amber-50 border-amber-100">
                <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-600" />
                <p className="text-xs font-medium leading-relaxed text-amber-800">{provider && PROVIDER_CONFIGS[provider].help}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                  <input
                    type="email" required placeholder="alex@company.com"
                    className="w-full h-12 px-4 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 transition-all bg-slate-50 border-slate-100 focus:border-emerald-500 focus:ring-emerald-500/10"
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Sender Name</label>
                  <input
                    type="text" placeholder="Alex Reed"
                    className="w-full h-12 px-4 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 transition-all bg-slate-50 border-slate-100 focus:border-emerald-500 focus:ring-emerald-500/10"
                    value={formData.fromName} onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  {provider === 'smtp' ? 'SMTP Password' : 'App Password'}
                </label>
                <input
                  type="password" required
                  placeholder={provider === 'smtp' ? 'Your email password' : '•••• •••• •••• ••••'}
                  className="w-full h-12 px-4 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 transition-all bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/10"
                  value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {provider === 'smtp' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 pt-6 border-t border-slate-50 mt-6">
                  <p className="text-sm font-bold text-slate-900">Connection Details</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 ml-1">SMTP Host</label>
                      <input
                        type="text" required placeholder="smtp.example.com"
                        className="w-full h-11 px-4 rounded-xl text-sm font-medium border focus:outline-none transition-all bg-slate-50 border-slate-100"
                        value={formData.smtpHost} onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 ml-1">SMTP Port</label>
                      <input
                        type="number" required
                        className="w-full h-11 px-4 rounded-xl text-sm font-medium border focus:outline-none transition-all bg-slate-50 border-slate-100"
                        value={formData.smtpPort} onChange={(e) => setFormData({ ...formData, smtpPort: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 ml-1">IMAP Host</label>
                      <input
                        type="text" required placeholder="imap.example.com"
                        className="w-full h-11 px-4 rounded-xl text-sm font-medium border focus:outline-none transition-all bg-slate-50 border-slate-100"
                        value={formData.imapHost} onChange={(e) => setFormData({ ...formData, imapHost: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 ml-1">IMAP Port</label>
                      <input
                        type="number" required
                        className="w-full h-11 px-4 rounded-xl text-sm font-medium border focus:outline-none transition-all bg-slate-50 border-slate-100"
                        value={formData.imapPort} onChange={(e) => setFormData({ ...formData, imapPort: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex space-x-4 pt-8">
                <button
                  type="button" onClick={() => setStep(1)}
                  className="flex-1 h-12 rounded-xl font-bold text-sm border transition-all bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit" disabled={isConnecting}
                  className="flex-[2] bg-slate-900 text-white h-12 rounded-xl font-bold text-sm shadow-lg shadow-slate-200 flex items-center justify-center transition-all hover:bg-slate-800 disabled:opacity-50"
                >
                  {isConnecting ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : 'Connect Account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const InboxesPage: React.FC<{ theme: 'ethereal' | 'glass' }> = ({ theme }) => {
  const isEthereal = theme === 'ethereal';
  const [inboxes, setInboxes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedInboxes, setSelectedInboxes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'emails' | 'domains' | 'smartsender'>('emails');
  const [limit] = useState(10);

  const fetchInboxes = async (p = page, q = searchQuery) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/inboxes', {
        params: { page: p, limit, search: q }
      });
      // Handle both old array format (fallback) and new paginated format
      if (Array.isArray(response.data)) {
        setInboxes(response.data);
        setTotalPages(1);
      } else {
        setInboxes(response.data.data || []);
        setTotalPages(response.data.meta.totalPages || 1);
      }
    } catch (err: any) {
      setInboxes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1); // Reset to page 1 on search
      fetchInboxes(1, searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    fetchInboxes(page, searchQuery);
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this account?')) return;
    try {
      await apiClient.delete(`/inboxes/${id}`);
      fetchInboxes();
    } catch (err) {
      console.error('Termination failed.');
    }
  };

  const toggleStatus = async (inbox: any) => {
    try {
      const newStatus = inbox.status === 'active' ? 'paused' : 'active';
      await apiClient.patch(`/inboxes/${inbox.id}`, { status: newStatus });
      fetchInboxes();
    } catch (err) {
      console.error('Status update failed');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedInboxes(inboxes.map(i => i.id));
    } else {
      setSelectedInboxes([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedInboxes.includes(id)) {
      setSelectedInboxes(selectedInboxes.filter(i => i !== id));
    } else {
      setSelectedInboxes([...selectedInboxes, id]);
    }
  };

  return (
    <div className="space-y-8 pb-20 relative">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-2">
        <div className="flex items-center space-x-10">
          {[
            { id: 'emails', label: `Email Accounts (${inboxes.length})` },
            { id: 'domains', label: 'Domains' },
            { id: 'smartsender', label: 'Orders' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative py-4 text-sm font-semibold transition-all ${activeTab === tab.id ? 'text-slate-900 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2.5 rounded-xl transition-all bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 shadow-sm">
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-slate-200 active:scale-[0.98] flex items-center transition-all hover:bg-slate-800"
          >
            <Plus size={18} className="mr-2" /> Connect Account
          </button>
        </div>
      </div>

      {activeTab === 'emails' ? (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                className="w-full h-11 pl-12 pr-4 rounded-xl text-sm font-medium border focus:outline-none transition-all bg-white border-slate-200 focus:border-emerald-500 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2.5 rounded-xl border bg-white border-slate-200 hover:bg-slate-50 shadow-sm">
                <Filter size={18} className="text-slate-500" />
              </button>
              <button className="p-2.5 rounded-xl border bg-white border-slate-200 hover:bg-slate-50 shadow-sm">
                <Settings size={18} className="text-slate-500" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="w-48 h-4" />
                        <Skeleton className="w-32 h-3" />
                      </div>
                    </div>
                    <Skeleton className="w-24 h-10 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-4 lg:hidden">
                {inboxes.map(inbox => (
                  <div key={inbox.id} className="bg-white p-6 rounded-2xl border border-slate-100 space-y-5 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                          <Mail size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 truncate">{inbox.fromName || 'System Name'}</p>
                          <p className="text-xs text-slate-500 font-medium">{inbox.email}</p>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold">
                        {inbox.warmupAccount?.reputationScore || 100}% Score
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400">Daily Limit</p>
                        <p className="text-sm font-bold text-slate-700">0 / 25</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400">Warmup</p>
                        <p className={`text-xs font-bold ${inbox.warmupEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {inbox.warmupEnabled ? 'ENABLED' : 'PAUSED'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-xs font-semibold text-slate-500 border-b border-slate-100">
                        <th className="px-8 py-5 text-left">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                            checked={selectedInboxes.length === inboxes.length && inboxes.length > 0}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th className="px-4 py-5 text-left">Name</th>
                        <th className="px-4 py-5 text-left">Email Address</th>
                        <th className="px-4 py-5 text-center">Limit/Daily</th>
                        <th className="px-4 py-5 text-center">Warmup</th>
                        <th className="px-8 py-5 text-right">Health Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium">
                      {inboxes.map(inbox => (
                        <tr
                          key={inbox.id}
                          className={`group hover:bg-slate-50/30 transition-all cursor-pointer ${selectedInboxes.includes(inbox.id) ? 'bg-emerald-50/30' : ''}`}
                          onClick={() => handleSelectOne(inbox.id)}
                        >
                          <td className="px-8 py-5 text-left">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                              checked={selectedInboxes.includes(inbox.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectOne(inbox.id);
                              }}
                            />
                          </td>
                          <td className="px-4 py-5">
                            <span className="text-sm font-semibold text-slate-900">{inbox.fromName || 'Sender'}</span>
                          </td>
                          <td className="px-4 py-5">
                            <div className="flex items-center space-x-3">
                              <Mail size={14} className="text-slate-400" />
                              <span className="text-sm text-slate-600">{inbox.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-5 text-center">
                            <span className="text-sm font-medium text-slate-600">0 / {inbox.dailyLimit || 25}</span>
                          </td>
                          <td className="px-4 py-5 text-center">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${inbox.warmupEnabled ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400 bg-slate-50'}`}>
                              {inbox.warmupEnabled ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex justify-end">
                              <div className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold ring-1 ring-emerald-500/10">
                                {inbox.warmupAccount?.reputationScore || 100}%
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bg-slate-50/30 p-4 border-t border-slate-100">
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </div>

              {inboxes.length === 0 && (
                <div className="px-8 py-24 text-center bg-white rounded-2xl border border-slate-100 mt-4 shadow-sm flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Mail size={40} className="text-slate-200" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No accounts found</h3>
                  <p className="text-slate-500 text-sm mt-2 max-w-sm">No email accounts matching your criteria were found in this sector. Try refining your search.</p>
                </div>
              )}
            </>
          )}

          <AnimatePresence>
            {selectedInboxes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[90] bg-slate-900 px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-8"
              >
                <div className="flex items-center space-x-4 pr-8 border-r border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20">
                    {selectedInboxes.length}
                  </div>
                  <p className="text-sm font-semibold text-white">Accounts Selected</p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setIsBulkModalOpen(true)}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-bold hover:bg-slate-50 transition-all shadow-lg shadow-white/5"
                  >
                    <Settings size={16} />
                    <span>Bulk Update</span>
                  </button>
                  <button
                    onClick={() => setSelectedInboxes([])}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-2xl border border-slate-100 p-8 flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-sm">
            <div className="flex items-center mb-6 md:mb-0 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mr-5 shadow-sm">
                <ShieldCheck className="text-emerald-600" size={24} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Reputation Audit Active</h2>
                <p className="text-slate-500 text-sm font-medium max-w-lg mt-0.5">Automated SPF, DKIM, and DMARC verification is performed every 4 hours.</p>
              </div>
            </div>
            <button className="px-6 py-3 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 transition-all shadow-sm flex items-center">
              Re-audit Domains <RefreshCw size={16} className="ml-2" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-24 rounded-2xl border border-slate-100 text-center space-y-6 shadow-sm flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-200 mb-4">
            <ShieldCheck size={48} />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-slate-900">Module Coming Soon</h3>
            <p className="text-slate-500 text-base max-w-sm mx-auto">This module is currently in development. Domain reputation tracking and automated order management are coming soon.</p>
          </div>
        </div>
      )}

      <AddInboxModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchInboxes}
        theme={theme}
      />

      <BulkUpdateModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedIds={selectedInboxes}
        onUpdated={() => {
          fetchInboxes();
          setSelectedInboxes([]);
        }}
        theme={theme}
      />
    </div>
  );
};

export default InboxesPage;