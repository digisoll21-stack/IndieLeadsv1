import React, { useEffect, useState } from 'react';
import apiClient from '../../utils/api-client';
import {
    PauseCircle,
    PlayCircle,
    AlertTriangle
} from 'lucide-react';

interface Campaign {
    id: string;
    name: string;
    status: string;
    workspace: { name: string };
    _count: { leads: number };
    createdAt: string;
}

export const AdminCampaignsPage: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const res = await apiClient.get('/admin/campaigns');
            setCampaigns(res.data);
        } catch (err) {
            console.error('Failed to fetch campaigns', err);
        } finally {
            setLoading(false);
        }
    };

    const killSwitch = async (campaignId: string) => {
        const confirmKill = prompt(
            "🚧 KILL SWITCH ACIVATION 🚧\n\nThis will IMMEDIATELY stop all emails for this campaign.\nType 'PAUSE' to confirm:"
        );

        if (confirmKill !== 'PAUSE') return;

        try {
            await apiClient.post(`/admin/campaigns/${campaignId}/pause`);
            setCampaigns(campaigns.map(c => c.id === campaignId ? { ...c, status: 'PAUSED' } : c));
            alert('Campaign successfully killed.');
        } catch (err) {
            alert('Failed to pause campaign.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="text-amber-500" />
                        Active Campaigns Override
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Global view of all running campaigns. Use the "Kill Switch" only in emergencies.
                    </p>
                </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-400 text-sm font-medium uppercase border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-4">Campaign Name</th>
                            <th className="px-6 py-4">Workspace</th>
                            <th className="px-6 py-4">Leads</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Emergency Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {campaigns.map((campaign) => (
                            <tr key={campaign.id} className="hover:bg-slate-900/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">
                                    {campaign.name}
                                </td>
                                <td className="px-6 py-4 text-slate-400">
                                    {campaign.workspace.name}
                                </td>
                                <td className="px-6 py-4 text-slate-400 font-mono">
                                    {campaign._count.leads}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide border ${campaign.status === 'active'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        }`}>
                                        {campaign.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {campaign.status === 'active' && (
                                        <button
                                            onClick={() => killSwitch(campaign.id)}
                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ml-auto transition-all"
                                        >
                                            <PauseCircle size={14} />
                                            KILL SWITCH
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
