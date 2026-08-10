import React, { useState, useEffect } from 'react';
import { Mail, Send, X, Loader2, Sparkles, User, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../utils/api-client';
import { toast } from 'react-hot-toast';

interface Inbox {
  id: string;
  email: string;
  fromName?: string;
  status: string;
}

interface Stakeholder {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
}

interface DirectEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  stakeholder: Stakeholder | null;
  theme?: 'ethereal' | 'glass';
}

export const DirectEmailModal: React.FC<DirectEmailModalProps> = ({
  isOpen,
  onClose,
  stakeholder,
  theme = 'ethereal',
}) => {
  const [inboxes, setInboxes] = useState<Inbox[]>([]);
  const [selectedInboxId, setSelectedInboxId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchInboxes();
      if (stakeholder) {
        setSubject(`Quick question regarding ${stakeholder.company || 'your team'}`);
        setBody(
          `Hi ${stakeholder.firstName || 'there'},\n\nI was reviewing ${stakeholder.company || 'your company'} and wanted to reach out regarding how we help teams like yours scale outbound delivery.\n\nWould you have 10 minutes for a brief chat this week?\n\nBest regards,`
        );
      }
    }
  }, [isOpen, stakeholder]);

  const fetchInboxes = async () => {
    try {
      const { data } = await apiClient.get('/inboxes');
      const activeInboxes = (data || []).filter((i: Inbox) => i.status === 'active');
      setInboxes(activeInboxes);
      if (activeInboxes.length > 0) {
        setSelectedInboxId(activeInboxes[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch inboxes');
    }
  };

  const handleSend = async () => {
    if (!stakeholder) return;
    if (!selectedInboxId) {
      toast.error('Please select an active sender inbox');
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and Body are required');
      return;
    }

    setIsSending(true);
    try {
      await apiClient.post(`/companies/stakeholders/${stakeholder.id}/send-direct`, {
        inboxId: selectedInboxId,
        subject,
        body,
      });

      toast.success(`1-to-1 cold email sent to ${stakeholder.email}!`);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send direct email');
    } finally {
      setIsSending(false);
    }
  };

  const handleAiEnhance = async () => {
    setIsGeneratingAi(true);
    try {
      // Simulate quick AI tone enhancement
      await new Promise((res) => setTimeout(res, 800));
      setBody((prev) =>
        prev
          .replace('wanted to reach out regarding', 'noticed your recent growth and wanted to share')
          .concat('\n\nP.S. Happy to share a quick 2-minute video overview if easier!')
      );
      toast.success('AI refined email tone for maximum response rate!');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  if (!isOpen || !stakeholder) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Direct 1-to-1 Cold Email</h3>
                <p className="text-xs text-slate-400">
                  Targeting <span className="text-indigo-300 font-medium">{stakeholder.firstName} {stakeholder.lastName}</span> ({stakeholder.email})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4">
            {/* Sender Inbox Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                From Inbox
              </label>
              <select
                value={selectedInboxId}
                onChange={(e) => setSelectedInboxId(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {inboxes.map((inbox) => (
                  <option key={inbox.id} value={inbox.id}>
                    {inbox.fromName ? `${inbox.fromName} (${inbox.email})` : inbox.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="Subject line..."
              />
            </div>

            {/* Email Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Email Content
                </label>
                <button
                  type="button"
                  onClick={handleAiEnhance}
                  disabled={isGeneratingAi}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  {isGeneratingAi ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  AI Refine Tone
                </button>
              </div>
              <textarea
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-xs leading-relaxed"
                placeholder="Write your email body..."
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              Direct send bypasses sequence queue timers
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send 1-to-1 Email
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DirectEmailModal;
