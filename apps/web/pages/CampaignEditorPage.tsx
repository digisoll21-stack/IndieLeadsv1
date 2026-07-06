import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Plus, Trash2, Clock, Mail, Zap, 
  Info, ShieldAlert, Sliders, Layout, Users
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

const CampaignEditorPage: React.FC<{ theme: 'ethereal' | 'glass' }> = ({ theme }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEthereal = theme === 'ethereal';
  const primaryColor = isEthereal ? '#10b981' : '#00E5FF';
  
  const [activeTab, setActiveTab] = useState<'sequence' | 'settings' | 'leads'>('sequence');
  const [steps, setSteps] = useState([
    { id: 's1', order: 1, subject: '{Hi|Hello|Hey} {{firstName}}, quick question', body: "I was looking at {{company}}...", delayDays: 0 },
  ]);

  return (
    <div className="space-y-8 fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <button 
            onClick={() => navigate('/campaigns')}
            className={`p-3.5 rounded-2xl transition-all ${isEthereal ? 'bg-white text-slate-500 hover:bg-slate-50 shadow-sm' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-black font-heading ${isEthereal ? 'text-[#064e3b]' : 'text-white'}`}>Enterprise Series 2024</h1>
            <p className="text-slate-500 text-sm font-medium">Protocol ID: GEN-01</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-primary px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95">
            <Save className="w-4 h-4 inline mr-2" /> Synchronize Fleet
          </button>
        </div>
      </div>

      <div className={`flex items-center space-x-2 border-b ${isEthereal ? 'border-slate-100' : 'border-white/5'}`}>
        {[
          { id: 'sequence', label: 'Outbound Flow', icon: Layout },
          { id: 'leads', label: 'Contact List', icon: Users },
          { id: 'settings', label: 'Safety Protocols', icon: ShieldAlert }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center px-8 py-5 text-xs font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab.id ? (isEthereal ? 'text-[#064e3b]' : 'text-[#00E5FF]') : 'text-slate-500'
            }`}
          >
            <tab.icon size={16} className="mr-3" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="tabLine" className={`absolute bottom-0 left-0 right-0 h-1 rounded-t-full ${isEthereal ? 'bg-[#10b981]' : 'bg-[#00E5FF]'}`} />
            )}
          </button>
        ))}
      </div>

      <div className="max-w-5xl mx-auto py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'sequence' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
               <div className={`p-6 rounded-[2rem] border flex items-start space-x-4 ${isEthereal ? 'bg-[#10b981]/5 border-[#10b981]/10' : 'bg-[#00E5FF]/5 border-[#00E5FF]/10'}`}>
                <Info className={`w-5 h-5 shrink-0 mt-1 ${isEthereal ? 'text-[#10b981]' : 'text-[#00E5FF]'}`} />
                <p className={`text-xs font-medium leading-relaxed ${isEthereal ? 'text-slate-600' : 'text-slate-400'}`}>
                  Spintax rotations like <span className="font-mono bg-white/40 px-1.5 py-0.5 rounded text-indigo-500">{"{Hi|Hello}"}</span> are automatically resolved per packet.
                </p>
              </div>

              {steps.map((step, index) => (
                <div key={step.id} className="glass-surface rounded-[2.5rem] overflow-hidden border border-white/5">
                  <div className={`p-8 flex items-center justify-between border-b ${isEthereal ? 'bg-[#10b981]/5 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                    <div className="flex items-center space-x-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black font-heading text-lg ${isEthereal ? 'bg-[#10b981] text-white shadow-lg' : 'bg-[#00E5FF] text-slate-900 shadow-[0_0_15px_rgba(0,229,255,0.4)]'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <h4 className={`text-lg font-black font-heading ${isEthereal ? 'text-[#064e3b]' : 'text-white'}`}>Sequence Step {index + 1}</h4>
                        <span className="text-[10px] font-black uppercase text-slate-500">Protocol Dispatch</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 space-y-6">
                    <input 
                      defaultValue={step.subject}
                      placeholder="Subject Line"
                      className={`w-full h-14 px-6 rounded-2xl text-sm font-bold focus:outline-none transition-all ${isEthereal ? 'bg-white border-slate-200 text-slate-700' : 'bg-black/20 border-white/5 text-white'}`}
                    />
                    <textarea 
                      defaultValue={step.body}
                      rows={6}
                      className={`w-full p-6 rounded-[1.8rem] text-sm font-medium focus:outline-none transition-all resize-none ${isEthereal ? 'bg-white border-slate-200 text-slate-700' : 'bg-black/20 border-white/5 text-slate-300'}`}
                    />
                  </div>
                </div>
              ))}
              
              <button className={`w-full py-8 border-2 border-dashed rounded-[3rem] transition-all ${isEthereal ? 'border-slate-200 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600' : 'border-white/10 text-slate-600 hover:bg-[#00E5FF]/5 hover:text-[#00E5FF]'}`}>
                <Plus className="w-6 h-6 mx-auto mb-2" />
                <span className="text-xs font-black uppercase tracking-widest">Synthesize New Node</span>
              </button>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto space-y-8">
               <div className="glass-surface p-10 rounded-[3rem] space-y-8">
                  <h3 className={`text-xl font-black font-heading flex items-center ${isEthereal ? 'text-[#064e3b]' : 'text-white'}`}>
                    <Zap className={`w-6 h-6 mr-4 ${isEthereal ? 'text-[#10b981]' : 'text-[#00E5FF]'}`} /> Delivery Logic
                  </h3>
                  <div className="space-y-6">
                    {['Stop on Reply', 'Pixel Tracking', 'Custom Schedule'].map((s, i) => (
                      <div key={i} className="flex items-center justify-between">
                         <span className={`font-black text-sm ${isEthereal ? 'text-slate-600' : 'text-slate-300'}`}>{s}</span>
                         <div className={`w-12 h-6 rounded-full relative cursor-pointer p-1 transition-all ${isEthereal ? 'bg-emerald-500' : 'bg-cyan-500'}`}>
                            <div className="w-4 h-4 bg-white rounded-full absolute right-1"></div>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CampaignEditorPage;