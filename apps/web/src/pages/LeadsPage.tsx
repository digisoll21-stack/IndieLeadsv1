import React, { useState, useEffect } from 'react';
import { Users, Upload, Download, Search, Filter, CheckCircle2, Zap, ChevronRight, X, FileText, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../utils/api-client';
import Skeleton from '../components/Skeleton';

const FieldMapper: React.FC<{
  headers: string[],
  onComplete: (mapping: Record<string, string>) => void,
  theme: 'ethereal' | 'glass'
}> = ({ headers, onComplete, theme }) => {
  const isEthereal = theme === 'ethereal';
  const systemFields = [
    { key: 'email', label: 'Email Address (Required)', required: true },
    { key: 'firstName', label: 'First Name', required: false },
    { key: 'lastName', label: 'Last Name', required: false },
    { key: 'company', label: 'Company Name', required: false },
  ];

  const [mapping, setMapping] = useState<Record<string, string>>({});

  const autoMap = () => {
    const newMap: Record<string, string> = {};
    headers.forEach(h => {
      const lower = h.toLowerCase();
      if (lower.includes('email')) newMap.email = h;
      if (lower.includes('first')) newMap.firstName = h;
      if (lower.includes('last')) newMap.lastName = h;
      if (lower.includes('company') || lower.includes('org')) newMap.company = h;
    });
    setMapping(newMap);
  };

  useEffect(() => autoMap(), [headers]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {systemFields.map(field => (
          <div key={field.key} className="p-4 rounded-xl border flex items-center justify-between bg-slate-50 border-slate-100 shadow-sm">
            <span className="text-sm font-semibold text-slate-700">{field.label}</span>
            <select
              value={mapping[field.key] || ''}
              onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
              className="text-sm font-medium p-2.5 rounded-xl outline-none border transition-all bg-white border-slate-200 focus:border-emerald-500"
            >
              <option value="">Select Column</option>
              {headers.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        ))}
      </div>
      <button
        onClick={() => onComplete(mapping)}
        disabled={!mapping.email}
        className="w-full bg-slate-900 text-white h-12 rounded-xl font-bold text-sm shadow-lg shadow-slate-200 flex items-center justify-center transition-all hover:bg-slate-800 disabled:opacity-50"
      >
        Complete Import <ArrowRight size={18} className="ml-2" />
      </button>
    </div>
  );
};

const LeadDetailsSidebar: React.FC<{ lead: any, onClose: () => void, theme: 'ethereal' | 'glass' }> = ({ lead, onClose, theme }) => {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isEthereal = theme === 'ethereal';

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const { data } = await apiClient.get(`/leads/${lead.id}/timeline`);
        setTimeline(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTimeline();
  }, [lead.id]);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed top-0 right-0 h-full w-full md:w-[480px] z-[110] shadow-2xl border-l backdrop-blur-xl bg-white/95 border-slate-100"
    >
      <div className="p-8 h-full flex flex-col">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Lead Details</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Activity history and contact information.</p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 bg-slate-50 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 rounded-2xl mb-10 bg-slate-50/50 border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-5 mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm bg-white border border-slate-100 text-slate-900">
              {lead.firstName?.[0] || lead.email[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-lg leading-tight text-slate-900">{lead.email}</p>
              <p className="text-sm text-slate-500 font-medium mt-0.5">{lead.firstName} {lead.lastName}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-400">Company</p>
              <p className="text-sm font-bold text-slate-700">{lead.company || '—'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-400">Status</p>
              <div className={`px-2.5 py-1 rounded-lg text-xs font-bold w-fit ${lead.status === 'replied' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-8 custom-scrollbar">
          <h3 className="text-sm font-bold text-slate-900 mb-6">Activity Timeline</h3>
          {isLoading ? (
            <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" /></div>
          ) : timeline.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
                <FileText size={32} />
              </div>
              <p className="text-sm font-semibold text-slate-400">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-8 relative ml-4 border-l-2 border-slate-100 pl-8 pb-10">
              {timeline.map((event, i) => (
                <div key={i} className="relative">
                  <div className={`absolute -left-[41px] top-1.5 w-4 h-4 rounded-full border-4 border-white ${event.type === 'inbound' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900">{event.type === 'inbound' ? 'Reply Received' : 'Email Sent'}</p>
                      <span className="text-xs font-semibold text-slate-400">{new Date(event.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-slate-500">
                      {event.type === 'inbound' ? `Classified as: ${event.metadata?.classification || 'Interested'}` : `Automated outbound message sent.`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const LeadsPage: React.FC<{ theme: 'ethereal' | 'glass' }> = ({ theme }) => {
  const isEthereal = theme === 'ethereal';
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [importStep, setImportStep] = useState(1);
  const [csvContent, setCsvContent] = useState('');

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [activeLead, setActiveLead] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/leads', { params: { search: searchQuery, status: statusFilter } });
      setLeads(data || []);
    } catch (err) {
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchLeads(), 300);
    return () => clearTimeout(t);
  }, [searchQuery, statusFilter]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setCsvContent(text);
        const firstLine = text.split('\n')[0];
        setCsvHeaders(firstLine.split(',').map(h => h.trim().replace(/"/g, '')));
        setImportStep(2);
      };
      reader.readAsText(file);
    }
  };

  const handleImportComplete = async (mapping: Record<string, string>) => {
    setIsLoading(true);
    try {
      const lines = csvContent.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const records = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const record: any = { customFields: {} };
        Object.entries(mapping).forEach(([systemField, csvHeader]) => {
          const index = headers.indexOf(csvHeader);
          if (index > -1) {
            if (['email', 'firstName', 'lastName', 'company'].includes(systemField)) {
              record[systemField] = values[index];
            } else {
              record.customFields[systemField] = values[index];
            }
          }
        });
        return record;
      }).filter(r => r.email);

      await apiClient.post('/leads/import', { leads: records, tags: ['csv-import'] });
      setIsImportModalOpen(false);
      setImportStep(1);
      fetchLeads();
    } catch (error) {
      alert('Transmission failure during lead ingestion.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedLeadIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedLeadIds.length === leads.length) setSelectedLeadIds([]);
    else setSelectedLeadIds(leads.map(l => l.id));
  };

  const bulkAction = async (action: 'delete' | 'status', value?: string) => {
    if (!selectedLeadIds.length) return;
    setIsLoading(true);
    try {
      if (action === 'delete') {
        await apiClient.post('/leads/bulk-delete', { ids: selectedLeadIds });
      } else {
        await apiClient.post('/leads/bulk-status', { ids: selectedLeadIds, status: value });
      }
      setSelectedLeadIds([]);
      fetchLeads();
    } catch (e) {
      alert('Bulk protocol failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Leads</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your contacts and track real-time engagement.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsImportModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-slate-200 flex items-center transition-all hover:bg-slate-800 active:scale-[0.98]">
            <Upload size={18} className="mr-2" /> Import Leads
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by name, email or company..."
            className="w-full h-11 pl-12 pr-4 rounded-xl text-sm font-medium border shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white border-slate-200 text-slate-900"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 px-4 rounded-xl text-sm font-semibold border cursor-pointer shadow-sm outline-none transition-all bg-white border-slate-200 text-slate-700 hover:border-slate-300"
        >
          <option value="">All Statuses</option>
          <option value="unassigned">Unassigned</option>
          <option value="active">Active</option>
          <option value="replied">Replied</option>
          <option value="paused">Paused</option>
          <option value="bounced">Bounced</option>
        </select>
      </div>

      <AnimatePresence>
        {selectedLeadIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl border shadow-2xl flex items-center space-x-8 bg-slate-900 text-white"
          >
            <div className="flex items-center border-r border-white/20 pr-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-sm mr-4 shadow-lg shadow-emerald-500/20">
                {selectedLeadIds.length}
              </div>
              <span className="text-sm font-semibold">Leads Selected</span>
            </div>

            <div className="flex items-center space-x-6">
              <button
                onClick={() => bulkAction('status', 'paused')}
                className="text-sm font-bold hover:text-emerald-400 transition-colors"
              >Pause</button>
              <button
                onClick={() => bulkAction('delete')}
                className="text-sm font-bold text-rose-400 hover:text-rose-300 transition-colors"
              >Delete</button>
              <button onClick={() => setSelectedLeadIds([])} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl overflow-hidden min-h-[500px] border border-slate-100 shadow-sm shadow-slate-200/50">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-5 h-5 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="w-40 h-4" />
                    <Skeleton className="w-56 h-3" />
                  </div>
                </div>
                <Skeleton className="w-24 h-8 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 lg:hidden p-6">
              {leads.map(lead => (
                <div
                  key={lead.id}
                  className={`p-5 rounded-2xl border transition-all ${selectedLeadIds.includes(lead.id) ? 'border-emerald-500 bg-emerald-50/20 shadow-sm shadow-emerald-500/10' : 'border-slate-100 bg-white'}`}
                  onClick={() => setActiveLead(lead)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-4">
                      <button onClick={(e) => { e.stopPropagation(); toggleSelect(lead.id); }} className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${selectedLeadIds.includes(lead.id) ? 'bg-slate-900 border-slate-900' : 'border-slate-300 bg-white'}`}>
                        {selectedLeadIds.includes(lead.id) && <CheckCircle2 size={12} className="text-white" />}
                      </button>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm bg-slate-50 border border-slate-100 text-slate-900">
                        {lead.firstName?.[0] || lead.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm truncate max-w-[150px] text-slate-900">{lead.email}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{lead.firstName} {lead.lastName}</p>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border-current w-fit shadow-sm ${lead.status === 'replied' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400 pt-4 border-t border-slate-50">
                    <span className="truncate max-w-[120px]">{lead.company || '—'}</span>
                    <span>{lead.lastEventAt ? new Date(lead.lastEventAt).toLocaleDateString() : 'No activity'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-semibold border-b text-slate-500 bg-slate-50/50 border-slate-100">
                    <th className="pl-8 pr-4 py-5">
                      <button onClick={selectAll} className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${selectedLeadIds.length === leads.length && leads.length > 0 ? 'bg-slate-900 border-slate-900' : 'border-slate-300 bg-white'}`}>
                        {selectedLeadIds.length === leads.length && leads.length > 0 && <CheckCircle2 size={12} className="text-white" />}
                      </button>
                    </th>
                    <th className="px-4 py-5">Lead Contact</th>
                    <th className="px-4 py-5 text-center">Status</th>
                    <th className="px-4 py-5">Company</th>
                    <th className="px-4 py-5">Last Activity</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {leads.map(lead => (
                    <tr key={lead.id} className={`group transition-all hover:bg-slate-50/50 cursor-pointer ${selectedLeadIds.includes(lead.id) ? 'bg-emerald-50/30' : ''}`}>
                      <td className="pl-8 pr-4 py-5">
                        <button onClick={(e) => { e.stopPropagation(); toggleSelect(lead.id); }} className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${selectedLeadIds.includes(lead.id) ? 'bg-slate-900 border-slate-900' : 'border-slate-300 bg-white hover:border-slate-400'}`}>
                          {selectedLeadIds.includes(lead.id) && <CheckCircle2 size={12} className="text-white" />}
                        </button>
                      </td>
                      <td className="px-4 py-5" onClick={() => setActiveLead(lead)}>
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm bg-white border border-slate-100 text-slate-900">
                            {lead.firstName?.[0] || lead.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900">{lead.email}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{lead.firstName} {lead.lastName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-center" onClick={() => setActiveLead(lead)}>
                        <div className={`mx-auto px-2.5 py-1 rounded-lg text-xs font-bold w-fit shadow-sm ring-1 ring-inset ${lead.status === 'replied' ? 'bg-emerald-50 text-emerald-600 ring-emerald-500/10' : 'bg-slate-50 text-slate-500 ring-slate-400/10'}`}>
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </div>
                      </td>
                      <td className="px-4 py-5 text-sm font-semibold text-slate-700" onClick={() => setActiveLead(lead)}>{lead.company || '—'}</td>
                      <td className="px-4 py-5 text-xs font-semibold text-slate-500" onClick={() => setActiveLead(lead)}>{lead.lastEventAt ? new Date(lead.lastEventAt).toLocaleDateString() : 'No interactions'}</td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={(e) => { e.stopPropagation(); setActiveLead(lead); }} className="p-2 rounded-xl hover:bg-white hover:shadow-sm hover:border-slate-200 border border-transparent transition-all text-slate-400 hover:text-slate-900"><ChevronRight size={18} /></button>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-40 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                          <Users size={40} />
                        </div>
                        <p className="text-lg font-bold text-slate-900">No leads found</p>
                        <p className="text-slate-500 text-sm mt-2">Start by importing leads from a CSV file.</p>
                        <button onClick={() => setIsImportModalOpen(true)} className="mt-6 bg-slate-100 text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">Import Leads</button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="w-full max-w-xl rounded-3xl overflow-hidden border border-slate-100 shadow-2xl bg-white">
              <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {importStep === 1 ? 'Import Context' : 'Column Mapping'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Upload and configure your lead data.</p>
                </div>
                <button onClick={() => { setIsImportModalOpen(false); setImportStep(1); }} className="p-2 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-xl"><X size={20} /></button>
              </div>
              <div className="p-8">
                {importStep === 1 ? (
                  <label className="block border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all bg-slate-50 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white shadow-sm">
                      <Upload size={28} />
                    </div>
                    <span className="text-base font-bold text-slate-900">Choose CSV File</span>
                    <p className="text-sm text-slate-500 mt-2">Maximum file size: 50MB</p>
                    <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                  </label>
                ) : (
                  <FieldMapper headers={csvHeaders} onComplete={handleImportComplete} theme={theme} />
                )}
              </div>
            </motion.div>
          </div>
        )}

        {activeLead && (
          <>
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[105]" onClick={() => setActiveLead(null)} />
            <LeadDetailsSidebar lead={activeLead} onClose={() => setActiveLead(null)} theme={theme} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeadsPage;
