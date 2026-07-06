import React, { useState } from 'react';
import { Bell, ShieldAlert, AlertCircle, Trash2, CheckCircle2, Zap, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationsPage: React.FC<{ theme: 'ethereal' | 'glass' }> = ({ theme }) => {
  const isEthereal = theme === 'ethereal';

  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Critical: Bounce Spike Detected', message: 'Campaign "Q4 Enterprise Outreach" exceeded 8% bounce threshold. Autopause protocol active.', type: 'critical', time: '12m ago', isRead: false },
    { id: '2', title: 'Node Disconnected', message: 'Credentials for sales@indieleads.ai have expired. Please refresh OAuth tokens.', type: 'warning', time: '2h ago', isRead: false },
    { id: '3', title: 'Spam Complaint Flagged', message: 'ISP feedback loop detected a spam complaint in the Startup Growth sequence.', type: 'critical', time: '4h ago', isRead: true }
  ]);

  const removeNotif = (id: string) => setNotifications(notifications.filter(n => n.id !== id));

  return (
    <div className="space-y-8 fade-in pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black font-heading tracking-tight text-[#064e3b]">Alert Center</h1>
          <p className="text-slate-600 font-medium">Workspace integrity alerts and deliverability notifications.</p>
        </div>
        <button className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all bg-white border-slate-100 text-slate-700">
          <Check size={14} className="inline mr-2" /> Clear Workspace
        </button>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`glass-surface p-6 rounded-[2rem] border-l-[6px] flex items-start gap-6 transition-all ${notif.type === 'critical' ? 'border-l-rose-500' : 'border-l-amber-500'
                } ${notif.isRead ? 'opacity-60' : 'shadow-xl'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notif.type === 'critical' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                {notif.type === 'critical' ? <ShieldAlert size={24} /> : <AlertCircle size={24} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-black text-[#064e3b]">{notif.title}</h3>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{notif.time}</span>
                </div>
                <p className="text-sm font-medium leading-relaxed text-slate-600">
                  {notif.message}
                </p>
                <div className="mt-6 flex items-center space-x-6">
                  <button className="text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center text-[#10b981]">
                    Investigate <Zap size={14} className="ml-2" />
                  </button>
                  <button className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Mark Read</button>
                </div>
              </div>

              <button
                onClick={() => removeNotif(notif.id)}
                className="p-3 rounded-2xl transition-all hover:bg-slate-100 text-slate-400"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {notifications.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 bg-emerald-50 text-emerald-200">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-black font-heading text-[#064e3b]">Integrity Verified</h3>
            <p className="text-slate-500 font-medium">All connected nodes and campaigns are performing within safety parameters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;