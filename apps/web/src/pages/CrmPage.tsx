import React, { useState, useEffect } from 'react';
import {
  Building2, Users, DollarSign, Plus, Search, Filter, Mail,
  Phone, Linkedin, ChevronRight, X, ExternalLink, Calendar,
  MessageSquare, Loader2, Briefcase, CheckCircle2, TrendingUp,
  LayoutGrid, List, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../utils/api-client';
import { toast } from 'react-hot-toast';
import DirectEmailModal from '../components/crm/DirectEmailModal';

interface Stakeholder {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  phone?: string;
  linkedinUrl?: string;
  status?: string;
}

interface CompanyNote {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface Company {
  id: string;
  name: string;
  domain?: string;
  website?: string;
  industry?: string;
  employeeCount?: number;
  dealStage: 'prospect' | 'contacted' | 'discovery' | 'proposal' | 'closed_won' | 'closed_lost';
  dealValue?: number;
  updatedAt: string;
  stakeholders?: Stakeholder[];
  notes?: CompanyNote[];
}

const STAGES = [
  { id: 'prospect', label: 'Prospect', color: 'border-blue-500/50 bg-blue-500/10 text-blue-400' },
  { id: 'contacted', label: 'Contacted', color: 'border-purple-500/50 bg-purple-500/10 text-purple-400' },
  { id: 'discovery', label: 'Discovery', color: 'border-amber-500/50 bg-amber-500/10 text-amber-400' },
  { id: 'proposal', label: 'Proposal', color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' },
  { id: 'closed_won', label: 'Closed Won', color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'border-rose-500/50 bg-rose-500/10 text-rose-400' },
];

export const CrmPage: React.FC<{ theme?: 'ethereal' | 'glass' }> = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isAddStakeholderOpen, setIsAddStakeholderOpen] = useState(false);
  const [emailModalStakeholder, setEmailModalStakeholder] = useState<Stakeholder | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Form states
  const [companyForm, setCompanyForm] = useState({
    name: '',
    domain: '',
    website: '',
    industry: 'Software & Technology',
    employeeCount: 50,
    dealStage: 'prospect',
    dealValue: 5000,
  });

  const [stakeholderForm, setStakeholderForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    title: '',
    phone: '',
    linkedinUrl: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/companies');
      setCompanies(data || []);
    } catch (err) {
      toast.error('Failed to load CRM company accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanyDetails = async (companyId: string) => {
    try {
      const { data } = await apiClient.get(`/companies/${companyId}`);
      setSelectedCompany(data);
    } catch (err) {
      toast.error('Failed to load company details');
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name.trim()) return;

    try {
      await apiClient.post('/companies', companyForm);
      toast.success(`Company ${companyForm.name} added to CRM`);
      setIsAddCompanyOpen(false);
      setCompanyForm({
        name: '',
        domain: '',
        website: '',
        industry: 'Software & Technology',
        employeeCount: 50,
        dealStage: 'prospect',
        dealValue: 5000,
      });
      fetchCompanies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create company');
    }
  };

  const handleStageChange = async (companyId: string, newStage: string) => {
    try {
      await apiClient.patch(`/companies/${companyId}/stage`, { dealStage: newStage });
      toast.success('Updated deal stage');
      fetchCompanies();
      if (selectedCompany && selectedCompany.id === companyId) {
        setSelectedCompany({ ...selectedCompany, dealStage: newStage as any });
      }
    } catch (err) {
      toast.error('Failed to update deal stage');
    }
  };

  const handleAddStakeholder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !stakeholderForm.email.trim()) return;

    try {
      await apiClient.post(`/companies/${selectedCompany.id}/stakeholders`, stakeholderForm);
      toast.success(`Added stakeholder ${stakeholderForm.firstName || stakeholderForm.email}`);
      setIsAddStakeholderOpen(false);
      setStakeholderForm({ email: '', firstName: '', lastName: '', title: '', phone: '', linkedinUrl: '' });
      fetchCompanyDetails(selectedCompany.id);
      fetchCompanies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add stakeholder');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !newNoteContent.trim()) return;

    setIsSubmittingNote(true);
    try {
      await apiClient.post(`/companies/${selectedCompany.id}/notes`, {
        content: newNoteContent,
        authorName: 'Sales Rep',
      });
      toast.success('Added note');
      setNewNoteContent('');
      fetchCompanyDetails(selectedCompany.id);
    } catch (err) {
      toast.error('Failed to add note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.industry && c.industry.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.domain && c.domain.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPipelineValue = companies.reduce((sum, c) => sum + (c.dealValue || 0), 0);
  const totalStakeholders = companies.reduce((sum, c) => sum + (c.stakeholders?.length || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-indigo-400" />
            Account-Based CRM
          </h1>
          <p className="text-sm text-slate-400">
            Manage enterprise target accounts, nested stakeholders, and 1-to-1 cold outreach.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban Pipeline
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Account Directory
            </button>
          </div>

          <button
            onClick={() => setIsAddCompanyOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Company
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Target Companies</p>
            <h3 className="text-2xl font-bold text-white mt-1">{companies.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Active Stakeholders</p>
            <h3 className="text-2xl font-bold text-white mt-1">{totalStakeholders}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Pipeline Value</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">${totalPipelineValue.toLocaleString()}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by company name, industry, or domain..."
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Main CRM View */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageCompanies = filteredCompanies.filter((c) => c.dealStage === stage.id);
            const stageValue = stageCompanies.reduce((sum, c) => sum + (c.dealValue || 0), 0);

            return (
              <div
                key={stage.id}
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3 flex flex-col min-h-[500px]"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${stage.color}`}>
                      {stage.label}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">({stageCompanies.length})</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 font-mono">${stageValue.toLocaleString()}</span>
                </div>

                {/* Company Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {stageCompanies.map((company) => (
                    <motion.div
                      key={company.id}
                      onClick={() => fetchCompanyDetails(company.id)}
                      whileHover={{ scale: 1.02 }}
                      className="p-3.5 bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/50 rounded-xl cursor-pointer shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-sm text-white group-hover:text-indigo-400 transition-colors">
                          {company.name}
                        </h4>
                        <span className="text-xs font-semibold text-emerald-400 font-mono">
                          ${company.dealValue ? company.dealValue.toLocaleString() : 0}
                        </span>
                      </div>

                      {company.industry && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {company.industry}
                        </p>
                      )}

                      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-indigo-300">
                          <Users className="w-3 h-3 text-indigo-400" />
                          {company.stakeholders?.length || 0} Stakeholders
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                  {stageCompanies.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-600 border border-dashed border-slate-800/60 rounded-xl">
                      No companies
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5 font-medium">Company Account</th>
                <th className="px-6 py-3.5 font-medium">Industry</th>
                <th className="px-6 py-3.5 font-medium">Deal Stage</th>
                <th className="px-6 py-3.5 font-medium">Deal Value</th>
                <th className="px-6 py-3.5 font-medium">Stakeholders</th>
                <th className="px-6 py-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCompanies.map((company) => (
                <tr
                  key={company.id}
                  onClick={() => fetchCompanyDetails(company.id)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-semibold text-white">
                    {company.name}
                    {company.domain && (
                      <span className="block text-xs text-slate-400 font-normal">{company.domain}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-300">{company.industry || '—'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        STAGES.find((s) => s.id === company.dealStage)?.color || 'border-slate-700 bg-slate-800 text-slate-300'
                      }`}
                    >
                      {STAGES.find((s) => s.id === company.dealStage)?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold text-emerald-400">
                    ${company.dealValue ? company.dealValue.toLocaleString() : 0}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-indigo-400" />
                      {company.stakeholders?.length || 0} Contacts
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 justify-end ml-auto">
                      View Account
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* COMPANY DETAIL SLIDE-OVER DRAWER */}
      <AnimatePresence>
        {selectedCompany && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedCompany.name}</h2>
                    {selectedCompany.website && (
                      <a
                        href={selectedCompany.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-1"
                      >
                        {selectedCompany.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Account Details & Stage Controls */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Deal Stage
                    </label>
                    <select
                      value={selectedCompany.dealStage}
                      onChange={(e) => handleStageChange(selectedCompany.id, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      {STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Deal Value ($)
                    </label>
                    <div className="text-lg font-bold text-emerald-400 font-mono">
                      ${selectedCompany.dealValue ? selectedCompany.dealValue.toLocaleString() : 0}
                    </div>
                  </div>
                </div>

                {/* Stakeholders Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-400" />
                      Company Stakeholders ({selectedCompany.stakeholders?.length || 0})
                    </h3>
                    <button
                      onClick={() => setIsAddStakeholderOpen(true)}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Stakeholder
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {selectedCompany.stakeholders?.map((sh) => (
                      <div
                        key={sh.id}
                        className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div>
                          <h4 className="font-semibold text-sm text-white">
                            {sh.firstName} {sh.lastName || ''}
                          </h4>
                          <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            {sh.title && <span className="text-indigo-300 font-medium">{sh.title}</span>}
                            <span>{sh.email}</span>
                          </p>
                        </div>

                        <button
                          onClick={() => setEmailModalStakeholder(sh)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 rounded-lg transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          1-to-1 Email
                        </button>
                      </div>
                    ))}
                    {(!selectedCompany.stakeholders || selectedCompany.stakeholders.length === 0) && (
                      <div className="p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        No stakeholders added yet. Click "Add Stakeholder" to append executives.
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Notes Timeline */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    Internal Sales Notes
                  </h3>

                  <form onSubmit={handleAddNote} className="space-y-2">
                    <textarea
                      rows={2}
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Add an update note about this account..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingNote}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors ml-auto block"
                    >
                      {isSubmittingNote ? 'Saving...' : 'Add Note'}
                    </button>
                  </form>

                  <div className="space-y-2 mt-3">
                    {selectedCompany.notes?.map((n) => (
                      <div key={n.id} className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-semibold text-indigo-300">{n.authorName}</span>
                          <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-300">{n.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD COMPANY MODAL */}
      <AnimatePresence>
        {isAddCompanyOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  Add Target Company
                </h3>
                <button onClick={() => setIsAddCompanyOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCompany} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                    placeholder="e.g. Acme Corporation"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Domain</label>
                    <input
                      type="text"
                      value={companyForm.domain}
                      onChange={(e) => setCompanyForm({ ...companyForm, domain: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                      placeholder="acme.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Deal Value ($)</label>
                    <input
                      type="number"
                      value={companyForm.dealValue}
                      onChange={(e) => setCompanyForm({ ...companyForm, dealValue: parseFloat(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Industry</label>
                  <input
                    type="text"
                    value={companyForm.industry}
                    onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddCompanyOpen(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD STAKEHOLDER MODAL */}
      <AnimatePresence>
        {isAddStakeholderOpen && selectedCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Add Stakeholder to {selectedCompany.name}
                </h3>
                <button onClick={() => setIsAddStakeholderOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddStakeholder} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">First Name</label>
                    <input
                      type="text"
                      value={stakeholderForm.firstName}
                      onChange={(e) => setStakeholderForm({ ...stakeholderForm, firstName: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={stakeholderForm.lastName}
                      onChange={(e) => setStakeholderForm({ ...stakeholderForm, lastName: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={stakeholderForm.email}
                    onChange={(e) => setStakeholderForm({ ...stakeholderForm, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                    placeholder="john@acme.com"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Job Title / Role</label>
                  <input
                    type="text"
                    value={stakeholderForm.title}
                    onChange={(e) => setStakeholderForm({ ...stakeholderForm, title: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                    placeholder="VP of Sales"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddStakeholderOpen(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20"
                  >
                    Add Stakeholder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1-TO-1 DIRECT COLD EMAIL MODAL */}
      <DirectEmailModal
        isOpen={!!emailModalStakeholder}
        onClose={() => setEmailModalStakeholder(null)}
        stakeholder={emailModalStakeholder}
      />
    </div>
  );
};

export default CrmPage;
