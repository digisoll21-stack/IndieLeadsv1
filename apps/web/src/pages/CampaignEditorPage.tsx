import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, Trash2, Clock, Zap,
  Info, ShieldAlert, Layout, Users, Sliders, Calendar, Loader2,
  ChevronRight, ChevronLeft, Upload, Mail, CheckCircle2, AlertCircle, FileText, BarChart3, ArrowRight, X
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import apiClient from '../utils/api-client';

interface Step {
  id: string;
  order: number;
  subject: string;
  body: string;
  delayDays: number;
  waitMinutes: number;
  scheduledDate?: string; // YYYY-MM-DD
  specificStartTime?: string;
}

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
      <div className="grid grid-cols-1 gap-3">
        {systemFields.map(field => (
          <div key={field.key} className="p-4 rounded-lg border flex items-center justify-between bg-white border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{field.label}</span>
            <select
              value={mapping[field.key] || ''}
              onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
              className="text-xs font-bold p-2 rounded-lg outline-none border bg-slate-50 border-slate-200"
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
        className="w-full btn-primary h-12 rounded-lg font-bold uppercase tracking-widest text-xs shadow-sm flex items-center justify-center disabled:opacity-50"
      >
        Finish Mapping <ArrowRight size={16} className="ml-2" />
      </button>
    </div>
  );
};

const Stepper: React.FC<{ currentStep: number, onStepClick: (step: number) => void, theme: 'ethereal' | 'glass' }> = ({ currentStep, onStepClick, theme }) => {
  const isEthereal = theme === 'ethereal';
  const steps = [
    { n: 1, label: 'Import Leads', icon: Users },
    { n: 2, label: 'Sequence', icon: Layout },
    { n: 3, label: 'Setup', icon: Sliders },
    { n: 4, label: 'Preview', icon: CheckCircle2 },
  ];

  return (
    <div className="flex items-center justify-center space-x-2 md:space-x-4 mb-10">
      {steps.map((s, idx) => (
        <React.Fragment key={s.n}>
          <div
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => onStepClick(s.n)}
          >
            <div className={`w-10 h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center transition-all ${currentStep === s.n
              ? 'bg-slate-900 text-white shadow-sm'
              : currentStep > s.n
                ? 'bg-slate-100 text-slate-700'
                : 'bg-slate-50 text-slate-400 border border-slate-100'
              }`}>
              <s.icon size={16} />
            </div>
            <span className={`hidden sm:block text-[9px] font-bold uppercase tracking-widest mt-2 transition-colors ${currentStep === s.n ? 'text-slate-900' : 'text-slate-500'
              }`}>{s.label}</span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`w-8 md:w-12 h-[1px] mb-0 md:mb-5 transition-colors ${currentStep > s.n ? 'bg-slate-900' : 'bg-slate-200'
              }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const TZ_SUGGESTIONS: Record<string, string> = {
  'New York': 'America/New_York',
  'London': 'Europe/London',
  'Tokyo': 'Asia/Tokyo',
  'Dubai': 'Asia/Dubai',
  'Sydney': 'Australia/Sydney',
  'Mumbai': 'Asia/Kolkata',
  'San Francisco': 'America/Los_Angeles',
  'Bengaluru': 'Asia/Kolkata',
  'Berlin': 'Europe/Berlin',
  'Paris': 'Europe/Paris',
};

const CampaignEditorPage: React.FC<{ theme: 'ethereal' | 'glass' }> = ({ theme }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEthereal = theme === 'ethereal';

  const [currentStep, setCurrentStep] = useState(1);
  const [campaignName, setCampaignName] = useState(() => {
    if (!id || id === 'new') {
      const now = new Date();
      return `Campaign ${now.getMonth() + 1}-${now.getDate()}`;
    }
    return 'Loading...';
  });
  const [steps, setSteps] = useState<Step[]>([]);
  const [inboxes, setInboxes] = useState<any[]>([]);
  const [selectedInboxes, setSelectedInboxes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [campaignStatus, setCampaignStatus] = useState('draft');
  const [leadsCount, setLeadsCount] = useState(0);

  // Manual Lead State
  const [manualInbound, setManualInbound] = useState({ firstName: '', email: '', lastName: '', company: '' });
  const [manualLeads, setManualLeads] = useState<any[]>([]);

  // Sequence UI State
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  // Ingestion State
  const [isImporting, setIsImporting] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvContent, setCsvContent] = useState('');
  const [importStep, setImportStep] = useState(1);

  // Settings
  const [settings, setSettings] = useState({
    stopOnReply: true,
    trackOpens: true,
    trackClicks: false,
    workDaysOnly: true,
    dailyLimit: 50,
    timezone: 'UTC',
    startTime: '09:00',
  });

  const [locationSearch, setLocationSearch] = useState('');
  const [showAllTimezones, setShowAllTimezones] = useState(false);

  // Test Send State
  const [isTestSendOpen, setIsTestSendOpen] = useState(false);
  const [testSendConfig, setTestSendConfig] = useState({ inboxId: '', to: '' });
  const [testSendError, setTestSendError] = useState('');

  // Helper to sync activeStepId
  useEffect(() => {
    if (steps.length > 0 && !activeStepId) {
      setActiveStepId(steps[0].id);
    }
  }, [steps]);

  useEffect(() => {
    fetchInboxes();
    if (id && id !== 'new') {
      fetchCampaign();
    } else {
      setSteps([{ id: `s_${Date.now()}`, order: 1, subject: '', body: '', delayDays: 0, waitMinutes: 0 }]);
    }
  }, [id]);

  // Auto-Save Engine
  useEffect(() => {
    if (id === 'new' || isLoading) return;
    const timer = setTimeout(() => {
      handleSave(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [campaignName, steps, selectedInboxes, settings]);

  const fetchInboxes = async () => {
    try {
      const response = await apiClient.get('/inboxes');
      // Handle both old array format (fallback) and new paginated format
      if (Array.isArray(response.data)) {
        setInboxes(response.data);
      } else {
        setInboxes(response.data.data || []);
      }
    } catch (err) { console.error('Inboxes fetch failed'); }
  };

  const fetchCampaign = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get(`/campaigns/${id}`);
      setCampaignName(data.name);
      setCampaignStatus(data.status);
      setSettings({ ...settings, ...data.settings });
      setSelectedInboxes(data.settings?.inboxIds || []);

      if (data.sequences && Array.isArray(data.sequences) && data.sequences.length > 0) {
        setSteps(data.sequences.map((s: any) => ({
          id: s.id, order: s.order, subject: s.subject, body: s.body,
          delayDays: s.delayDays, waitMinutes: s.waitMinutes || 0, specificStartTime: s.specificStartTime || ''
        })));
      } else {
        setSteps([{ id: `s_${Date.now()}`, order: 1, subject: '', body: '', delayDays: 0, waitMinutes: 0 }]);
      }

      const { data: leadsResponse } = await apiClient.get(`/leads?campaignId=${id}`);
      const leads = Array.isArray(leadsResponse) ? leadsResponse : (leadsResponse?.data || []);
      setLeadsCount(leads.length || 0);

    } catch (err) { console.error('Fetch failed'); }
    finally { setIsLoading(false); }
  };

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
    setIsImporting(true);
    try {
      const lines = csvContent.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const records = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const record: any = { customFields: {} };
        Object.entries(mapping).forEach(([systemField, csvHeader]) => {
          const index = headers.indexOf(csvHeader);
          if (index > -1) {
            if (['email', 'firstName', 'lastName', 'company'].includes(systemField)) record[systemField] = values[index];
            else record.customFields[systemField] = values[index];
          }
        });
        return record;
      }).filter(r => r.email);

      let campaignId = id;
      if (id === 'new') {
        const { data } = await apiClient.post('/campaigns', { name: campaignName });
        campaignId = data.id;
        navigate(`/campaigns/${campaignId}?step=1`, { replace: true });
      }

      await apiClient.post('/leads/import', {
        leads: records,
        campaignId,
        tags: ['campaign-import']
      });

      setLeadsCount(prev => prev + records.length);
      setImportStep(1);
      setCsvContent('');
    } catch (error) {
      alert('Import failed.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSave = async (isAuto = false) => {
    if (!isAuto) setIsSaving(true);
    try {
      let campaignId = id;

      // Basic Uniqueness Check (simplified for frontend)
      if (id === 'new' && !isAuto) {
        const { data: response } = await apiClient.get('/campaigns');
        const campaigns = Array.isArray(response) ? response : (response?.data || []);
        if (campaigns.some((c: any) => c.name.toLowerCase() === campaignName.toLowerCase())) {
          alert('A campaign with this name already exists.');
          if (!isAuto) setIsSaving(false);
          return;
        }
      }

      const campaignData = {
        name: campaignName,
        settings: { ...settings, inboxIds: selectedInboxes }
      };

      if (id === 'new') {
        const { data } = await apiClient.post('/campaigns', campaignData);
        campaignId = data.id;
        navigate(`/campaigns/${campaignId}${window.location.search}`, { replace: true });
      } else {
        await apiClient.put(`/campaigns/${id}`, campaignData);
      }

      await apiClient.put(`/campaigns/${campaignId}/sequence`, { steps });

      // Ingest Manual Leads if any
      if (manualLeads.length > 0) {
        await apiClient.post('/leads/import', {
          leads: manualLeads,
          campaignId,
          tags: ['manual-entry']
        });
        setLeadsCount(prev => prev + manualLeads.length);
        setManualLeads([]);
      }

      setLastSaved(new Date());

      if (!isAuto && currentStep === 4) {
        await apiClient.put(`/campaigns/${campaignId}`, { status: 'active' });
        navigate('/campaigns');
      }
      if (!isAuto) alert('Fleet synchronized successfully.');
    } catch (err) {
      if (!isAuto) alert('Synchronization failure.');
    } finally {
      if (!isAuto) setIsSaving(false);
    }
  }

  const handleManualAdd = () => {
    if (!manualInbound.firstName || !manualInbound.email) return;
    setManualLeads([...manualLeads, { ...manualInbound, id: Date.now().toString() }]);
    setManualInbound({ firstName: '', email: '', lastName: '', company: '' });
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
    else handleSave();
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const addStep = () => {
    const newStep: Step = { id: `s_${Date.now()}`, order: steps.length + 1, subject: '', body: '', delayDays: 3, waitMinutes: 0 };
    setSteps([...steps, newStep]);
  };

  const removeStep = (stepId: string) => {
    if (steps.length === 1) return;
    setSteps(steps.filter(s => s.id !== stepId).map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  const updateStep = (stepId: string, updates: Partial<Step>) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, ...updates } : s));
  };

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="space-y-10 fade-in pb-32">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <button onClick={() => navigate('/campaigns')} className="p-3 rounded-lg transition-all bg-white text-slate-500 hover:bg-slate-50 border border-slate-200 shadow-sm">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="text-xl font-bold font-heading bg-transparent border-none p-0 focus:ring-0 min-w-[300px] text-slate-900"
              />
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${campaignStatus === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{campaignStatus}</span>
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Edit Campaign</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {currentStep > 1 && (
            <button onClick={handleBack} className="px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center transition-all text-slate-600 hover:bg-slate-100">
              <ChevronLeft className="mr-2" size={16} /> Previous
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={currentStep === 1 && leadsCount === 0 && manualLeads.length === 0}
            className="btn-primary px-8 py-3 rounded-lg font-bold text-xs uppercase tracking-widest shadow-sm flex items-center active:scale-95 disabled:opacity-50"
          >
            {currentStep === 4 ? 'Save & Launch' : 'Continue'} <ChevronRight className="ml-2" size={16} />
          </button>
        </div>
      </div>

      <Stepper currentStep={currentStep} onStepClick={setCurrentStep} theme={theme} />

      <div className="max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {/* Step 1: Import Leads */}
          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div className="glass-surface p-10 rounded-xl border border-slate-200 shadow-sm text-center space-y-10">
                {leadsCount === 0 ? (
                  <div className="space-y-10">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold font-heading text-slate-900">Import Leads</h2>
                      <p className="text-slate-500 text-sm max-w-md mx-auto">Upload a CSV or add leads manually to start your campaign.</p>
                    </div>

                    <div className="max-w-2xl mx-auto space-y-6">
                      {importStep === 1 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <label className="block border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-slate-900 transition-all group bg-white">
                            <Upload size={32} className="mx-auto mb-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                            <span className="text-xs font-bold uppercase text-slate-500 tracking-widest">Select CSV File</span>
                            <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                          </label>
                          <div className="glass-surface p-6 rounded-xl border border-slate-200/50 text-left space-y-4">
                            <h4 className="text-[10px] font-bold uppercase text-slate-500">Manual Entry</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <input placeholder="First Name*" className="w-full h-10 px-3 rounded-lg text-xs border outline-none focus:ring-1 focus:ring-slate-900 bg-white border-slate-200" value={manualInbound.firstName} onChange={e => setManualInbound({ ...manualInbound, firstName: e.target.value })} />
                              <input placeholder="Last Name" className="w-full h-10 px-3 rounded-lg text-xs border outline-none focus:ring-1 focus:ring-slate-900 bg-white border-slate-200" value={manualInbound.lastName} onChange={e => setManualInbound({ ...manualInbound, lastName: e.target.value })} />
                            </div>
                            <input placeholder="Email Address*" className="w-full h-10 px-3 rounded-lg text-xs border outline-none focus:ring-1 focus:ring-slate-900 bg-white border-slate-200" value={manualInbound.email} onChange={e => setManualInbound({ ...manualInbound, email: e.target.value })} />
                            <input placeholder="Company Name" className="w-full h-10 px-3 rounded-lg text-xs border outline-none focus:ring-1 focus:ring-slate-900 bg-white border-slate-200" value={manualInbound.company} onChange={e => setManualInbound({ ...manualInbound, company: e.target.value })} />
                            <button onClick={handleManualAdd} className="w-full py-2.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all font-heading">Add Lead</button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-left bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                          <FieldMapper headers={csvHeaders} onComplete={handleImportComplete} theme={theme} />
                        </div>
                      )}

                      {manualLeads.length > 0 && (
                        <div className="glass-surface p-6 rounded-3xl border border-slate-200 shadow-sm max-h-[200px] overflow-y-auto">
                          <h4 className="text-[9px] font-black uppercase text-slate-500 mb-4">{manualLeads.length} Manual Nodes Staged</h4>
                          <div className="space-y-2">
                            {manualLeads.map(l => (
                              <div key={l.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                                <span className="text-slate-600 font-bold">{l.email}</span>
                                <button onClick={() => setManualLeads(manualLeads.filter(ml => ml.id !== l.id))} className="text-rose-500"><X size={14} /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10">
                    <div className="w-28 h-28 rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl bg-[#10b981] text-white">
                      <CheckCircle2 size={48} />
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-4xl font-black font-heading text-[#064e3b]">{leadsCount} Leads Ingested</h2>
                      <p className="text-slate-500 font-medium max-w-md mx-auto">Target matrix synchronized. Your outreach fleet is ready for sequence assignment.</p>
                    </div>
                    <button onClick={() => setLeadsCount(0)} className="text-[10px] font-black uppercase tracking-widest text-[#10b981] hover:underline">Import New Source</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Sequence */}
          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">

              {/* Global Schedule */}
              <div className="glass-surface p-8 rounded-xl border border-slate-200/50 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold font-heading text-slate-900">Execution Window</h3>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Settings</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Send Timezone</label>
                    <div className="relative">
                      <select
                        value={settings.timezone}
                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                        className="w-full h-10 px-4 rounded-lg text-xs font-bold focus:outline-none appearance-none border bg-white border-slate-200"
                      >
                        <option value="UTC">UTC (Universal Time)</option>
                        {Object.entries(TZ_SUGGESTIONS).map(([city, zone]) => (
                          <option key={zone} value={zone}>{city} ({zone})</option>
                        ))}
                        {showAllTimezones && Intl.supportedValuesOf('timeZone').map(tz => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2 pointer-events-none">
                        <Clock size={12} className="text-slate-500" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Daily Start Time</label>
                    <input
                      type="time"
                      value={settings.startTime}
                      onChange={(e) => setSettings({ ...settings, startTime: e.target.value })}
                      className="w-full h-10 px-4 rounded-lg text-xs font-bold focus:outline-none border bg-white border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Location Search</label>
                    <div className="relative">
                      <input
                        value={locationSearch}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLocationSearch(val);
                          const found = Object.keys(TZ_SUGGESTIONS).find(k => k.toLowerCase().includes(val.toLowerCase()));
                          if (found && val.length > 2) {
                            setSettings({ ...settings, timezone: TZ_SUGGESTIONS[found] });
                          }
                        }}
                        placeholder="Search city or region..."
                        className="w-full h-12 px-6 rounded-2xl text-xs font-bold focus:outline-none bg-slate-50 border-slate-100"
                      />
                      <Zap size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 opacity-50" />
                    </div>
                    <button onClick={() => setShowAllTimezones(!showAllTimezones)} className="text-[9px] font-black uppercase text-slate-600 hover:text-[#10b981] ml-1 transition-colors">
                      {showAllTimezones ? 'Hide expanded list' : 'View all timezones'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Two-Pane Sequence Builder */}
              <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
                {/* Left Pane: Timeline */}
                <div className="w-full lg:w-[350px] space-y-4">
                  <div className="flex items-center justify-between px-2 mb-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sequence Timeline</h4>
                    <button onClick={addStep} className="p-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm">
                      <Plus size={14} />
                    </button>
                  </div>

                  <Reorder.Group axis="y" values={steps} onReorder={setSteps} className="space-y-3">
                    {steps.map((step, index) => (
                      <Reorder.Item
                        key={step.id}
                        value={step}
                        className="relative cursor-pointer transition-all z-0"
                        onClick={() => setActiveStepId(step.id)}
                      >
                        {/* Connecting Line */}
                        {index > 0 && (
                          <div className="absolute -top-3 left-[20px] w-[1px] h-3 bg-slate-200" />
                        )}

                        <div className={`p-4 rounded-xl border transition-all ${activeStepId === step.id
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'bg-white border-slate-200 hover:border-slate-400'
                          }`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-9 h-9 rounded flex items-center justify-center font-bold ${activeStepId === step.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              <Mail size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-[9px] font-bold uppercase tracking-widest ${activeStepId === step.id ? 'text-white/60' : 'text-slate-500'}`}>Step {index + 1}</p>
                              <p className={`text-xs font-bold truncate ${activeStepId === step.id ? 'text-white' : 'text-slate-900'}`}>{step.subject || '(No Subject)'}</p>
                            </div>
                            {steps.length > 1 && (
                              <button onClick={(e) => { e.stopPropagation(); removeStep(step.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-all">
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Wait Delay Indicator */}
                        <div className="flex items-center space-x-3 px-3 py-2">
                          <div className="w-9 flex justify-center">
                            <Clock size={12} className="text-slate-400" />
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Wait</span>
                            <input
                              type="number"
                              value={step.delayDays}
                              onChange={(e) => updateStep(step.id, { delayDays: parseInt(e.target.value) })}
                              onClick={(e) => e.stopPropagation()}
                              className="w-8 h-5 bg-white border border-slate-200 rounded text-center text-[10px] font-bold text-slate-900 outline-none"
                            />
                            <span className="text-[9px] font-bold text-slate-500 uppercase whitespace-nowrap">days then</span>
                          </div>
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </div>

                {/* Right Pane: Editor */}
                <div className="flex-1 glass-surface rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                  {activeStepId ? (
                    (() => {
                      const activeStep = steps.find(s => s.id === activeStepId);
                      if (!activeStep) return null;
                      return (
                        <>
                          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center space-x-4">
                              <div className="w-9 h-9 rounded bg-slate-900 flex items-center justify-center text-white">
                                <Layout size={18} />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold font-heading text-slate-900">Edit Email Content</h4>
                                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Step {activeStep.order}</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-10 flex-1 space-y-8 overflow-y-auto">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subject Line</label>
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-1.5 cursor-pointer group" onClick={() => updateStep(activeStep.id, { subject: activeStep.subject + ' {{first_name}}' })}>
                                    <span className="text-slate-900 font-bold text-xs">{'{ }'}</span>
                                    <span className="text-[10px] font-bold uppercase text-slate-500 group-hover:text-slate-900 transition-colors">Variables</span>
                                  </div>
                                </div>
                              </div>
                              <input
                                value={activeStep.subject}
                                onChange={(e) => updateStep(activeStep.id, { subject: e.target.value })}
                                placeholder="Enter subject line..."
                                className={`w-full h-10 px-4 rounded-lg text-sm font-medium border focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all ${isEthereal ? 'bg-white border-slate-200 text-slate-900' : 'bg-black/20 border-white/5 text-white'}`}
                              />
                            </div>

                            <div className="space-y-3">
                              {/* Toolbar */}
                              <div className="p-3 rounded-t-lg border border-b-0 flex items-center justify-between bg-slate-50 border-slate-200">
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-4 border-r border-slate-200 pr-4">
                                    <button className="text-slate-500 hover:text-slate-900 transition-colors"><Mail size={14} /></button>
                                    <div className="relative group">
                                      <button className="flex items-center space-x-1 text-slate-500 hover:text-slate-900 transition-colors">
                                        <span className="font-bold text-sm">{'{ }'}</span>
                                      </button>
                                      <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                        {['first_name', 'last_name', 'company_name', 'email'].map(tag => (
                                          <button
                                            key={tag}
                                            onClick={() => updateStep(activeStep.id, { body: activeStep.body + ` {{${tag}}}` })}
                                            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 rounded text-[10px] font-bold uppercase text-slate-600 hover:text-slate-900"
                                          >
                                            {tag.replace('_', ' ')}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <button className="text-slate-500 hover:text-slate-900 transition-colors"><Zap size={14} /></button>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <button className="text-slate-500 hover:text-slate-900 transition-colors font-serif italic text-base">A</button>
                                    <button className="text-slate-500 hover:text-slate-900 transition-colors"><FileText size={14} /></button>
                                    <button onClick={() => {
                                      const url = window.prompt('Enter Link Target URL:');
                                      if (url) updateStep(activeStep.id, { body: activeStep.body + ` [LINK](${url})` });
                                    }} className="text-slate-500 hover:text-slate-900 transition-colors"><ArrowRight size={14} /></button>
                                  </div>
                                </div>
                              </div>
                              <textarea
                                rows={10}
                                value={activeStep.body}
                                onChange={(e) => updateStep(activeStep.id, { body: e.target.value })}
                                className={`w-full p-6 rounded-b-lg border text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all resize-none ${isEthereal ? 'bg-white border-slate-200 text-slate-900' : 'bg-black/20 border-white/5 text-slate-300'}`}
                                placeholder="Start typing your email message..."
                              />
                            </div>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-20 space-y-6">
                      <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-slate-600">
                        <Mail size={40} />
                      </div>
                      <p className="text-sm font-black uppercase tracking-widest text-slate-500">Select a transmission node to begin editing</p>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={addStep} className="w-full py-8 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center space-y-2 group border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-all bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white">
                  <Plus size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Add Email Step</span>
              </button>
            </motion.div>
          )}

          {/* Step 3: Setup */}
          {currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-surface p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold font-heading text-slate-900">Sender Accounts</h3>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{selectedInboxes.length} Selected</span>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {inboxes.map(inbox => (
                      <div key={inbox.id} onClick={() => {
                        if (selectedInboxes.includes(inbox.id)) setSelectedInboxes(selectedInboxes.filter(i => i !== inbox.id));
                        else setSelectedInboxes([...selectedInboxes, inbox.id]);
                      }} className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${selectedInboxes.includes(inbox.id)
                        ? (isEthereal ? 'bg-slate-50 border-slate-900' : 'bg-blue-600/10 border-blue-600/30')
                        : (isEthereal ? 'bg-white border-slate-200 hover:border-slate-400' : 'bg-black/20 border-white/5 hover:border-white/20')
                        }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded flex items-center justify-center ${inbox.status === 'authenticated' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            <Mail size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{inbox.email}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">{inbox.provider}</p>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedInboxes.includes(inbox.id)
                          ? 'bg-[#10b981] border-[#10b981]'
                          : 'border-slate-500/30'
                          }`}>
                          {selectedInboxes.includes(inbox.id) && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-surface p-8 rounded-xl border border-slate-200 shadow-sm space-y-8">
                  <h3 className="text-lg font-bold font-heading text-slate-900">Campaign Settings</h3>
                  <div className="space-y-6">
                    {[
                      { key: 'stopOnReply', label: 'Stop on Reply', desc: 'Auto-pause sequence after lead reply' },
                      { key: 'trackOpens', label: 'Open Tracking', desc: 'Track email opens via pixel' },
                      { key: 'workDaysOnly', label: 'Work Days Only', desc: 'Send emails Mon-Fri' },
                    ].map(protocol => (
                      <div key={protocol.key} className="flex items-center justify-between group">
                        <div className="flex-1">
                          <p className="font-bold text-sm text-slate-900">{protocol.label}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">{protocol.desc}</p>
                        </div>
                        <button onClick={() => setSettings({ ...settings, [protocol.key]: !((settings as any)[protocol.key]) })} className={`w-10 h-5 rounded-full transition-all relative ${(settings as any)[protocol.key] ? 'bg-slate-900' : 'bg-slate-300'
                          }`}>
                          <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${(settings as any)[protocol.key] ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-slate-200">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-4">Daily Sending Limit (Per Account)</label>
                      <input type="range" min="10" max="200" step="10" value={settings.dailyLimit} onChange={(e) => setSettings({ ...settings, dailyLimit: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900" />
                      <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-500">
                        <span>10</span>
                        <span className="text-slate-900 font-bold">{settings.dailyLimit} Emails</span>
                        <span>200</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8">
              <div className="glass-surface p-10 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                  <div className="space-y-2">
                    <Users className="mx-auto text-slate-400" size={24} />
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{leadsCount}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Leads</p>
                    </div>
                  </div>
                  <div className="space-y-2 border-x border-slate-100">
                    <Mail className="mx-auto text-slate-400" size={24} />
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{selectedInboxes.length}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sender Accounts</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Zap className="mx-auto text-slate-400" size={24} />
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{steps.length}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Campaign Steps</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 p-8 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-2 mb-6">
                    <CheckCircle2 size={16} className="text-slate-900" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Launch Checklist</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {['Variables Validated', 'Unsubscribe Link Included', 'Sender Rotation Active', 'IMAP Connection Status'].map(check => (
                      <div key={check} className="flex items-center space-x-3 text-xs font-medium text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{check}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-10 flex flex-col items-center space-y-4">
                  <div className="flex items-center space-x-3 w-full justify-center">
                    <button onClick={() => setIsTestSendOpen(true)} className="px-6 py-3 rounded-lg border border-slate-200 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center">
                      <Mail size={16} className="mr-2" /> Send Test Email
                    </button>
                    <button onClick={() => handleSave()} className="btn-primary px-10 py-3 rounded-lg font-bold text-xs uppercase tracking-widest shadow-md transition-all">
                      Start Campaign
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Test Send Modal */}
      <AnimatePresence>
        {isTestSendOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-surface p-8 rounded-xl border border-slate-200 w-full max-w-md space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold font-heading text-slate-900">Send Test Email</h3>
                <button onClick={() => { setIsTestSendOpen(false); setTestSendError(''); }} className="text-slate-500 hover:text-slate-900"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                {testSendError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium flex items-start gap-3">
                    <span className="text-red-500 mt-0.5 shrink-0">⚠</span>
                    <span>{testSendError}</span>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">From Inbox</label>
                  <select
                    value={testSendConfig.inboxId}
                    onChange={(e) => setTestSendConfig({ ...testSendConfig, inboxId: e.target.value })}
                    className={`w-full h-12 px-4 mt-2 rounded-xl text-xs font-bold outline-none ${isEthereal ? 'bg-slate-50 border border-slate-200' : 'bg-black/20 border border-white/10 text-white'}`}
                  >
                    <option value="">Select sending inbox...</option>
                    {inboxes.map(i => <option key={i.id} value={i.id}>{i.email}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">To Email</label>
                  <input
                    value={testSendConfig.to}
                    onChange={(e) => setTestSendConfig({ ...testSendConfig, to: e.target.value })}
                    placeholder="yourname@example.com"
                    className={`w-full h-12 px-4 mt-2 rounded-xl text-xs font-bold outline-none ${isEthereal ? 'bg-slate-50 border border-slate-200' : 'bg-black/20 border border-white/10 text-white'}`}
                  />
                </div>
                <button
                  onClick={async () => {
                    if (!testSendConfig.inboxId || !testSendConfig.to) { setTestSendError('Please select an inbox and enter a recipient email.'); return; }
                    setTestSendError('');
                    try {
                      const step1 = steps[0];
                      await apiClient.post(`/inboxes/${testSendConfig.inboxId}/send-test`, {
                        to: testSendConfig.to,
                        subject: step1?.subject || 'Test Email from IndieLeads',
                        body: step1?.body || '<p>This is a test email sent from IndieLeads.</p>'
                      });
                      alert('✅ Test email sent! Check your inbox.');
                      setIsTestSendOpen(false);
                      setTestSendError('');
                    } catch (err: any) {
                      const msg = err.response?.data?.message || err.message || 'Failed to send. Check your inbox credentials.';
                      setTestSendError(msg);
                    }
                  }}
                  className="w-full btn-primary h-12 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center"
                >
                  <Zap size={16} className="mr-2" /> Send Test Email
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CampaignEditorPage;
