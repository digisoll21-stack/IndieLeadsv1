import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Edit2, BarChart2, Plus, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const CampaignCard: React.FC<{
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft';
  leads: number;
  sent: number;
  openRate: string;
  replyRate: string;
  onClick: (id: string) => void;
  theme: 'ethereal' | 'glass';
}> = ({ id, name, status, leads, sent, openRate, replyRate, onClick, theme }) => {
  const isEthereal = theme === 'ethereal';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onClick(id)}
      className="glass-surface p-6 rounded-[2.5rem] transition-all duration-500 group cursor-pointer hover:scale-[1.01] mb-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-1">
            <h3 className={`text-xl font-black font-heading truncate transition-colors ${isEthereal ? 'text-[#064e3b] group-hover:text-[#10b981]' : 'text-white group-hover:text-[#00E5FF]'}`}>{name}</h3>
            <div className={`w-2.5 h-2.5 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse' : status === 'paused' ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{status} sequence</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:mr-10">
          <div>
            <p className="text-slate-500 text-[9px] uppercase font-black tracking-widest mb-1">Leads</p>
            <p className={`text-sm font-black ${isEthereal ? 'text-[#064e3b]' : 'text-slate-200'}`}>{leads.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-500 text-[9px] uppercase font-black tracking-widest mb-1">Sent</p>
            <p className={`text-sm font-black ${isEthereal ? 'text-[#064e3b]' : 'text-slate-200'}`}>{sent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-500 text-[9px] uppercase font-black tracking-widest mb-1">Opens</p>
            <p className={`text-sm font-black ${isEthereal ? 'text-emerald-600' : 'text-[#00E5FF]'}`}>{openRate}</p>
          </div>
          <div>
            <p className="text-slate-500 text-[9px] uppercase font-black tracking-widest mb-1">Replies</p>
            <p className={`text-sm font-black ${isEthereal ? 'text-[#10b981]' : 'text-amber-500'}`}>{replyRate}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <button className={`p-3 rounded-2xl transition-all ${isEthereal ? 'bg-[#10b981]/10 text-[#059669] hover:bg-[#10b981] hover:text-white' : 'bg-white/5 text-slate-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'}`}>
            {status === 'active' ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button className={`p-3 rounded-2xl transition-all ${isEthereal ? 'bg-slate-100 text-slate-500 hover:bg-[#10b981]/10 hover:text-[#10b981]' : 'bg-white/5 text-slate-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'}`} onClick={() => onClick(id)}>
            <Edit2 size={18} />
          </button>
          <button className={`p-3 rounded-2xl transition-all ${isEthereal ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
            <BarChart2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const CampaignsPage: React.FC<{ theme: 'ethereal' | 'glass' }> = ({ theme }) => {
  const navigate = useNavigate();
  const isEthereal = theme === 'ethereal';

  return (
    <div className="space-y-10 fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className={`text-3xl md:text-4xl font-black font-heading tracking-tight ${isEthereal ? 'text-[#064e3b]' : 'text-white'}`}>Campaign Fleet</h1>
          <p className={`${isEthereal ? 'text-slate-600' : 'text-slate-400'} font-medium`}>Managing automated outreach protocols at scale.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`flex p-1.5 rounded-[1.2rem] border ${isEthereal ? 'bg-white/50 border-slate-200 shadow-sm' : 'bg-white/5 border-white/10'}`}>
            <button className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isEthereal ? 'bg-[#10b981] text-white shadow-md' : 'bg-[#00E5FF] text-slate-900 shadow-lg'}`}>All</button>
            <button className="px-5 py-2 text-slate-500 hover:text-slate-700 text-[10px] font-black uppercase tracking-widest transition-colors">Active</button>
            <button className="px-5 py-2 text-slate-500 hover:text-slate-700 text-[10px] font-black uppercase tracking-widest transition-colors">Draft</button>
          </div>
          <button 
            onClick={() => navigate('/campaigns/new')}
            className="btn-primary px-8 py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" /> Launch Campaign
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <CampaignCard theme={theme} id="c1" name="Q4 Enterprise Outreach" status="active" leads={1250} sent={432} openRate="68.4%" replyRate="12.1%" onClick={(id) => navigate(`/campaigns/${id}`)} />
        <CampaignCard theme={theme} id="c2" name="SaaS Founders 50-100 Emp" status="active" leads={840} sent={712} openRate="72.1%" replyRate="15.8%" onClick={(id) => navigate(`/campaigns/${id}`)} />
        <CampaignCard theme={theme} id="c3" name="Inbound Leads Follow-up" status="paused" leads={320} sent={320} openRate="81.0%" replyRate="24.5%" onClick={(id) => navigate(`/campaigns/${id}`)} />
      </div>
    </div>
  );
};

export default CampaignsPage;