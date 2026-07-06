
import React, { useState } from 'react';
import { Globe, RefreshCw, CheckCircle2, AlertTriangle, Link as LinkIcon, Server } from 'lucide-react';

const TrackingDomainPage: React.FC = () => {
    const isEthereal = true;
    const [domain, setDomain] = useState('');
    const [status, setStatus] = useState<'idle' | 'checking' | 'verified' | 'failed'>('idle');

    const handleVerify = () => {
        if (!domain) return;
        setStatus('checking');

        // Simulate API Verification
        setTimeout(() => {
            // Randomly succeed for demo purposes
            setStatus('verified');
        }, 1500);
    };

    return (
        <div className="space-y-8 text-slate-800">
            <div>
                <h2 className="text-xl font-bold font-heading text-slate-900">Custom Tracking Domain</h2>
                <p className="text-slate-500 text-sm mt-1">
                    Improve deliverability by using your own domain for tracking links.
                </p>
            </div>

            {/* Configuration Card */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1 space-y-3 w-full">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Tracking Domain (subdomain)</label>
                        <div className="relative">
                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="link.yourcompany.com"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                className="w-full h-11 pl-11 pr-5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-sm font-medium text-slate-800"
                            />
                        </div>
                        <p className="text-xs text-slate-500 flex gap-2 items-center">
                            <Server size={12} />
                            Create a <strong>CNAME</strong> record pointing to <code>api.indieleads.ai</code>
                        </p>
                    </div>

                    <button
                        onClick={handleVerify}
                        disabled={status === 'checking' || !domain}
                        className={`h-11 px-8 rounded-lg font-bold text-xs uppercase tracking-widest transition-all mt-8 md:mt-0
                    ${status === 'verified'
                                ? 'bg-emerald-500 text-white cursor-default'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }
                `}
                    >
                        {status === 'checking' && <RefreshCw className="animate-spin" size={16} />}
                        {status === 'verified' && <CheckCircle2 size={16} />}
                        {status === 'idle' && 'Verify DNS'}
                        {status === 'checking' && 'Checking...'}
                        {status === 'verified' && 'Verified'}
                        {status === 'failed' && 'Retry'}
                    </button>
                </div>

                {/* Status Display */}
                {status === 'verified' && (
                    <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                        <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
                        <div>
                            <h4 className="font-bold text-green-500 text-sm">Domain Active</h4>
                            <p className="text-xs text-green-600/80 mt-1">
                                All emails sent from this workspace will now rewrite links to <code>{domain}</code>.
                                SSL certificate has been automatically provisioned.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* FAQ / Info */}
            <div className="p-6 rounded-2xl border bg-blue-50/50 border-blue-100">
                <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Globe size={16} />
                    Why use a custom tracking domain?
                </h4>
                <p className="text-xs opacity-70 leading-relaxed mb-4">
                    By default, all IndieLeads users share a generic tracking domain. If another user sends spam, it could potentially hurt the reputation of the shared domain.
                    Using your own subdomain (e.g., <code>link.yourdomain.com</code>) isolates your reputation and improves Google/Outlook deliverability significantly.
                </p>
            </div>
        </div>
    );
};

export default TrackingDomainPage;
