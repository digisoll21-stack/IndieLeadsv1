
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, MailX, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import apiClient from '../utils/api-client';

const UnsubscribePage: React.FC = () => {
  const { leadId } = useParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const performUnsub = async () => {
      try {
        await apiClient.post(`/leads/${leadId}/status`, { status: 'unsubscribed' });
        setStatus('success');
      } catch (err) {
        setStatus('error');
      }
    };
    if (leadId) performUnsub();
  }, [leadId]);

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-white font-sans">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center space-y-8 bg-white/5 p-12 rounded-[3rem] border border-white/10">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-cyan-400" />
            <h1 className="text-2xl font-black tracking-tight">Processing Request...</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <MailX size={40} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">You're Unsubscribed</h1>
            <p className="text-slate-400 font-medium">Your email has been removed from all sequences in this workspace. We won't contact you again.</p>
            <ShieldCheck size={14} className="mr-2" /> Powered by IndieLeads Protection
          </>
        )}
        {status === 'error' && (
          <p className="text-rose-500 font-bold">Protocol error. Please try again later or contact the sender directly.</p>
        )}
      </motion.div>
    </div>
  );
};

export default UnsubscribePage;
