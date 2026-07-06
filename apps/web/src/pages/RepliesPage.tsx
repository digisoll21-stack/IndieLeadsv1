import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Mail, Reply, Smile, Frown,
  Trash2, Archive, Star, Clock, Send, MoreVertical,
  Plus, Loader2, Users, AlertCircle, Inbox, User, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../utils/api-client';
import Skeleton from '../components/Skeleton';
import { toast } from 'react-hot-toast';

interface ReplyLog {
  id: string;
  subject: string;
  body: string;
  classification: 'interested' | 'not_interested' | 'unsubscribe' | 'neutral' | 'out_of_office';
  receivedAt: string;
  lead: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

const MasterInboxPage: React.FC<{ theme: 'ethereal' | 'glass' }> = ({ theme }) => {
  const isEthereal = theme === 'ethereal';
  const [replies, setReplies] = useState<ReplyLog[]>([]);
  const [selectedReply, setSelectedReply] = useState<ReplyLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchReplies();
  }, []);

  const fetchReplies = async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/replies');
      setReplies(data || []);
      // On desktop, select the first reply by default if available
      if (window.innerWidth >= 1024 && data && data.length > 0) {
        setSelectedReply(data[0]);
      }
    } catch (err) {
      console.error('Replies fetch failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectReply = (reply: ReplyLog) => {
    setSelectedReply(reply);
    setResponseText('');
    if (window.innerWidth < 1024) {
      setShowDetailOnMobile(true);
    }
  };

  const handleDispatch = async () => {
    if (!selectedReply || !responseText.trim()) return;

    setIsSending(true);
    try {
      await apiClient.post(`/replies/${selectedReply.id}/send`, {
        body: responseText
      });
      toast.success('Reply dispatched successfully');
      setResponseText('');
    } catch (err) {
      console.error('Dispatch failed', err);
      toast.error('Failed to dispatch reply');
    } finally {
      setIsSending(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'interested': return <Smile className="text-emerald-500" size={16} />;
      case 'not_interested': return <Frown className="text-rose-500" size={16} />;
      case 'unsubscribe': return <AlertCircle className="text-amber-500" size={16} />;
      default: return <Clock className="text-slate-400" size={16} />;
    }
  };

  const filteredReplies = replies.filter(r =>
    r.lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-8 fade-in">
      {/* Inbox List Section */}
      <div className={`w-full lg:w-[450px] flex flex-col glass-surface rounded-[2.5rem] border border-white/5 overflow-hidden ${showDetailOnMobile ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-6 lg:p-8 border-b border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className={`text-xl lg:text-2xl font-black font-heading ${isEthereal ? 'text-[#064e3b]' : 'text-white'}`}>Master Inbox</h1>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isEthereal ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#00E5FF]/10 text-[#00E5FF]'}`}>
              {replies.length} Messages
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              placeholder="Scan communications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full h-12 pl-12 pr-6 rounded-2xl text-xs font-bold focus:outline-none transition-all ${isEthereal ? 'bg-slate-50 border-slate-100 placeholder:text-slate-400' : 'bg-black/20 border-white/5 placeholder:text-slate-600'}`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-8 h-4 rounded-full" />
                  </div>
                  <Skeleton className="w-full h-3" />
                  <Skeleton className="w-2/3 h-3" />
                </div>
              ))}
            </div>
          ) : filteredReplies.length > 0 ? (
            filteredReplies.map((reply) => (
              <div
                key={reply.id}
                onClick={() => handleSelectReply(reply)}
                className={`p-6 lg:p-8 cursor-pointer transition-all border-b border-white/5 relative group ${selectedReply?.id === reply.id
                  ? (isEthereal ? 'bg-[#10b981]/5' : 'bg-[#00E5FF]/5')
                  : (isEthereal ? 'hover:bg-slate-50/50' : 'hover:bg-white/[0.02]')
                  }`}
              >
                {selectedReply?.id === reply.id && (
                  <motion.div layoutId="inboxActive" className={`absolute left-0 top-0 bottom-0 w-1 ${isEthereal ? 'bg-[#10b981]' : 'bg-[#00E5FF]'}`} />
                )}

                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${isEthereal ? 'bg-white shadow-sm text-[#064e3b]' : 'bg-white/5 text-slate-400'}`}>
                      {reply.lead.firstName?.[0] || reply.lead.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className={`text-sm font-black truncate w-32 md:w-40 ${isEthereal ? 'text-[#064e3b]' : 'text-slate-200'}`}>
                        {reply.lead.firstName || reply.lead.email.split('@')[0]}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{new Date(reply.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="shrink-0">{getSentimentIcon(reply.classification)}</div>
                </div>
                <p className={`text-xs font-black truncate mb-2 ${isEthereal ? 'text-slate-700' : 'text-slate-300'}`}>{reply.subject}</p>
                <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">{reply.body}</p>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center space-y-4">
              <Inbox size={48} className="text-slate-400 opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Workspace is silent.</p>
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className={`flex-1 flex flex-col glass-surface rounded-[2.5rem] border border-white/5 overflow-hidden ${!showDetailOnMobile && 'hidden lg:flex'}`}>
        {selectedReply ? (
          <div className="flex flex-col h-full">
            <div className={`p-6 lg:p-8 border-b border-white/5 flex items-center justify-between ${isEthereal ? 'bg-slate-50/50' : 'bg-white/[0.02]'}`}>
              <div className="flex items-center space-x-4 lg:space-x-6">
                <button
                  onClick={() => setShowDetailOnMobile(false)}
                  className="lg:hidden p-2 -ml-2 text-slate-500"
                >
                  <ChevronRight size={24} className="rotate-180" />
                </button>
                <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center font-black text-base lg:text-xl shadow-xl transition-all ${isEthereal ? 'bg-[#10b981] text-white' : 'bg-[#00E5FF] text-slate-900'}`}>
                  {selectedReply.lead.firstName?.[0] || selectedReply.lead.email[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className={`text-base lg:text-xl font-black font-heading truncate ${isEthereal ? 'text-[#064e3b]' : 'text-white'}`}>
                    {selectedReply.lead.firstName} {selectedReply.lead.lastName}
                  </h2>
                  <div className="flex items-center space-x-2 mt-0.5 lg:mt-1">
                    <span className="text-[10px] lg:text-xs font-bold text-slate-500 truncate max-w-[120px] md:max-w-none">{selectedReply.lead.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 lg:space-x-3">
                <button className={`p-2.5 lg:p-3 rounded-xl lg:rounded-2xl transition-all ${isEthereal ? 'bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-500 shadow-sm' : 'bg-white/5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500'}`}>
                  <Trash2 size={18} />
                </button>
                <div className="hidden sm:flex space-x-2">
                  <button className={`p-2.5 lg:p-3 rounded-xl lg:rounded-2xl transition-all ${isEthereal ? 'bg-white text-slate-500 hover:bg-[#10b981]/10 hover:text-[#10b981] shadow-sm' : 'bg-white/5 text-slate-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'}`}>
                    <Archive size={18} />
                  </button>
                  <button className={`p-2.5 lg:p-3 rounded-xl lg:rounded-2xl transition-all ${isEthereal ? 'bg-white text-slate-500 hover:bg-[#10b981]/10 hover:text-[#10b981] shadow-sm' : 'bg-white/5 text-slate-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'}`}>
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 lg:p-8 border-b border-white/5 bg-black/5">
              <div className="flex items-center space-x-3 mb-2">
                <Clock size={14} className="text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Payload • {new Date(selectedReply.receivedAt).toLocaleString()}</span>
              </div>
              <h3 className={`text-base lg:text-lg font-black ${isEthereal ? 'text-[#064e3b]' : 'text-slate-200'}`}>{selectedReply.subject}</h3>
            </div>

            <div className="flex-1 p-6 lg:p-10 overflow-y-auto leading-relaxed text-sm font-medium custom-scrollbar whitespace-pre-wrap">
              <div className={`p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] border ${isEthereal ? 'bg-white/80 border-slate-100 text-slate-700' : 'bg-white/5 border-white/5 text-slate-300'}`}>
                {selectedReply.body}
              </div>
            </div>

            <div className="p-4 lg:p-8 border-t border-white/5">
              <div className={`p-3 lg:p-4 rounded-[1.5rem] lg:rounded-[2rem] flex flex-col border transition-all focus-within:ring-2 ${isEthereal ? 'bg-white border-slate-200 ring-emerald-100' : 'bg-black/20 border-white/5 ring-cyan-500/20'
                }`}>
                <textarea
                  placeholder={`Respond to ${selectedReply.lead.firstName || 'lead'}...`}
                  rows={2}
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  disabled={isSending}
                  className="w-full bg-transparent border-none p-3 lg:p-4 text-sm font-medium focus:ring-0 resize-none placeholder:text-slate-500 disabled:opacity-50"
                ></textarea>
                <div className="flex items-center justify-between p-2 lg:p-4 pt-0 lg:pt-2">
                  <div className="flex items-center space-x-3 lg:space-x-4">
                    <button className="text-slate-500 hover:text-[#10b981] transition-colors"><Plus size={18} /></button>
                    <button className="text-slate-500 hover:text-[#10b981] transition-colors"><Smile size={18} /></button>
                  </div>
                  <button
                    onClick={handleDispatch}
                    disabled={isSending || !responseText.trim()}
                    className="btn-primary px-6 lg:px-8 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest flex items-center shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-2" />}
                    Dispatch
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-10 lg:p-20 text-center space-y-6">
            <div className={`w-16 h-16 lg:w-24 lg:h-24 rounded-[2rem] lg:rounded-[2.5rem] flex items-center justify-center ${isEthereal ? 'bg-emerald-50 text-[#10b981]' : 'bg-cyan-500/5 text-cyan-400'}`}>
              <Mail size={32} />
            </div>
            <div className="space-y-2">
              <h2 className={`text-xl lg:text-2xl font-black font-heading ${isEthereal ? 'text-[#064e3b]' : 'text-white'}`}>Select a Transmission</h2>
              <p className="text-sm lg:text-base text-slate-500 font-medium max-w-sm">Scan your master inbox and engage with interested lead payloads.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterInboxPage;