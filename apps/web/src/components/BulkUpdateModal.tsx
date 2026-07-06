import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Activity, ShieldCheck, Mail, Save, Type, Link, Bold, Italic, Info } from 'lucide-react';
import apiClient from '../utils/api-client';

interface BulkUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedIds: string[];
    onUpdated: () => void;
    theme: 'ethereal' | 'glass';
}

const BulkUpdateModal: React.FC<BulkUpdateModalProps> = ({ isOpen, onClose, selectedIds, onUpdated, theme }) => {
    const isEthereal = theme === 'ethereal';
    const [activeTab, setActiveTab] = useState<'general' | 'warmup' | 'management'>('general');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const [settings, setSettings] = useState({
        dailyLimit: '',
        minDelaySeconds: '',
        signature: '',
        warmupEnabled: undefined as boolean | undefined,
    });

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            // Filter out empty strings to avoid clearing values if intended to skip
            const updateData: any = { inboxIds: selectedIds };
            if (settings.dailyLimit !== '') updateData.dailyLimit = Number(settings.dailyLimit);
            if (settings.minDelaySeconds !== '') updateData.minDelaySeconds = Number(settings.minDelaySeconds) * 60; // UI is in minutes
            if (settings.signature !== '') updateData.signature = settings.signature;
            if (settings.warmupEnabled !== undefined) updateData.warmupEnabled = settings.warmupEnabled;

            await apiClient.post('/inboxes/bulk', updateData);
            onUpdated();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Bulk update protocol failed.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl glass-surface border border-white/10`}
            >
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div>
                        <h2 className={`text-xl font-black font-heading ${isEthereal ? 'text-[#064e3b]' : 'text-white'}`}>Bulk Update</h2>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Leave field empty if no update required</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex border-b border-white/5 bg-white/[0.01]">
                    {([
                        { id: 'general', label: 'General', icon: Settings },
                        { id: 'warmup', label: 'Warm Up', icon: Activity },
                        { id: 'management', label: 'Management', icon: ShieldCheck },
                    ] as const).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-4 flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-[#10b981]' : 'text-slate-500 hover:text-slate-400'}`}
                        >
                            <tab.icon size={14} />
                            <span>{tab.label}</span>
                            {activeTab === tab.id && (
                                <motion.div layoutId="modal-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#10b981]" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold">
                            {error}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {activeTab === 'general' && (
                            <motion.div
                                key="general"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-8"
                            >
                                <div className="space-y-6">
                                    <h3 className={`text-sm font-black uppercase tracking-widest ${isEthereal ? 'text-[#064e3b]' : 'text-slate-300'}`}>SMTP Settings (sending emails)</h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 flex items-center">
                                                Message Per Day <Info size={12} className="ml-1.5 opacity-50" />
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Default (25)"
                                                className={`w-full h-12 px-6 rounded-2xl text-xs font-bold focus:outline-none transition-all ${isEthereal ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5 text-white'}`}
                                                value={settings.dailyLimit}
                                                onChange={(e) => setSettings({ ...settings, dailyLimit: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-500 ml-1 flex items-center">
                                                Minimum time gap (min) <Info size={12} className="ml-1.5 opacity-50" />
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Default (1)"
                                                className={`w-full h-12 px-6 rounded-2xl text-xs font-bold focus:outline-none transition-all ${isEthereal ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5 text-white'}`}
                                                value={settings.minDelaySeconds}
                                                onChange={(e) => setSettings({ ...settings, minDelaySeconds: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Signature</label>
                                        <span className="text-[9px] font-bold text-slate-400">Apply to {selectedIds.length} accounts</span>
                                    </div>
                                    <div className="p-4 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
                                        <div className="flex items-center space-x-4 border-b border-white/5 pb-3">
                                            <button className="text-slate-500 hover:text-white"><Bold size={14} /></button>
                                            <button className="text-slate-500 hover:text-white"><Italic size={14} /></button>
                                            <button className="text-slate-500 hover:text-white"><Link size={14} /></button>
                                            <button className="text-slate-500 hover:text-white"><Type size={14} /></button>
                                        </div>
                                        <textarea
                                            rows={6}
                                            placeholder="Manually enter your email signature or paste from your client..."
                                            className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-300 resize-none min-h-[150px]"
                                            value={settings.signature}
                                            onChange={(e) => setSettings({ ...settings, signature: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'warmup' && (
                            <motion.div
                                key="warmup"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-8 py-10 text-center"
                            >
                                <div className="w-20 h-20 rounded-[2rem] bg-[#10b981]/10 flex items-center justify-center mx-auto text-[#10b981]">
                                    <Activity size={40} className="animate-pulse" />
                                </div>
                                <div className="max-w-xs mx-auto space-y-4">
                                    <h4 className="text-lg font-black font-heading text-white">Warm Up Protocol</h4>
                                    <p className="text-slate-500 text-xs font-medium">Enable or disable automated warming for all selected accounts.</p>

                                    <div className="flex p-1.5 bg-black/20 rounded-2xl border border-white/5">
                                        <button
                                            onClick={() => setSettings({ ...settings, warmupEnabled: true })}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settings.warmupEnabled === true ? 'bg-[#10b981] text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Enable
                                        </button>
                                        <button
                                            onClick={() => setSettings({ ...settings, warmupEnabled: false })}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settings.warmupEnabled === false ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Disable
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'management' && (
                            <motion.div
                                key="management"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-8"
                            >
                                <div className="p-8 rounded-[2.5rem] border border-amber-500/20 bg-amber-500/5 flex items-start space-x-4">
                                    <Info className="text-amber-500 shrink-0 mt-1" size={20} />
                                    <div>
                                        <h4 className="text-sm font-black text-amber-500">Security Note</h4>
                                        <p className="text-xs font-medium text-slate-400 mt-1">Bulk management operations are irreversible. Ensure all selected IDs are intended for update.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <button className="w-full p-6 rounded-2xl border border-white/5 bg-white/5 text-left flex items-center justify-between group hover:bg-white/10 transition-all">
                                        <div>
                                            <p className="text-xs font-black text-white">Reconnect Nodes</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Triggers diagnostic handshake</p>
                                        </div>
                                        <ShieldCheck size={20} className="text-slate-600 group-hover:text-[#10b981] transition-all" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="p-8 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                        {selectedIds.length} Nodes Selected
                    </p>
                    <div className="flex space-x-4">
                        <button
                            onClick={onClose}
                            className="px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-10 py-4 rounded-xl bg-[#6366f1] text-white text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center hover:bg-[#4f46e5] transition-all active:scale-95"
                        >
                            {isSaving ? <Activity size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                            Save All Changes
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default BulkUpdateModal;
