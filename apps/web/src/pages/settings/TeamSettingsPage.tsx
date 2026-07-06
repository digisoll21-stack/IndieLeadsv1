import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Copy, Check, Mail, Shield, Loader2 } from 'lucide-react';
import apiClient from '../../utils/api-client';

const TeamSettingsPage: React.FC<{ workspace?: { id: string } }> = ({ workspace }) => {
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);

    const fetchMembers = async () => {
        setLoadingMembers(true);
        try {
            const workspaceId = workspace?.id || 'w1';
            const res = await apiClient.get(`/workspaces/${workspaceId}/members`);
            const formatted = res.data.map((m: any) => {
                const name = m.user ? `${m.user.firstName} ${m.user.lastName}`.trim() : 'Pending Invite';
                const email = m.user ? m.user.email : 'Invitation Pending';
                const avatar = m.user ? `${m.user.firstName?.[0] || ''}${m.user.lastName?.[0] || ''}`.toUpperCase() || 'U' : '?';
                const role = m.role === 'admin' || m.role === 'owner' ? 'Owner' : 'Member';
                return {
                    id: m.id,
                    name,
                    email,
                    role,
                    avatar,
                    isPending: !m.userId
                };
            });
            setMembers(formatted);
        } catch (e) {
            console.error('Failed to fetch workspace members', e);
        } finally {
            setLoadingMembers(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [workspace?.id]);

    const generateInvite = async () => {
        setIsLoading(true);
        try {
            const workspaceId = workspace?.id || 'w1';
            const res = await apiClient.post(`/workspaces/${workspaceId}/invites`);
            setInviteLink(res.data.inviteUrl);
            fetchMembers(); // Refresh list to show pending invite
        } catch (e) {
            console.error('Failed to generate invite', e);
        } finally {
            setIsLoading(false);
        }
    };

    const copyLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-8 text-slate-800">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold font-heading text-slate-900">Team Management</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage access to your workspace and billing.</p>
                </div>
                <button
                    onClick={generateInvite}
                    disabled={isLoading || !!inviteLink}
                    className="px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    {inviteLink ? 'Link Generated' : 'Invite Member'}
                </button>
            </div>

            {/* Invite Link Section */}
            {inviteLink && (
                <div className="p-6 rounded-2xl border bg-emerald-50 border-emerald-200">
                    <h4 className="text-sm font-bold mb-2 text-emerald-800">
                        Share this link to invite members
                    </h4>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            readOnly
                            value={inviteLink}
                            className="flex-1 px-4 py-3 rounded-xl font-mono text-sm border focus:outline-none bg-white border-emerald-200 text-emerald-900"
                        />
                        <button
                            onClick={copyLink}
                            className="px-4 rounded-xl flex items-center gap-2 font-bold transition-colors bg-emerald-200 hover:bg-emerald-300 text-emerald-900"
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                    <p className="text-xs mt-2 opacity-60 flex items-center gap-1">
                        <Shield size={12} />
                        Link expires in 7 days. Anyone with this link can join as a Member.
                    </p>
                </div>
            )}

            {/* Members List */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900">
                    <Users size={20} className="text-slate-400" />
                    Active Members
                </h3>

                {loadingMembers ? (
                    <div className="flex justify-center py-8">
                        <Loader2 size={24} className="animate-spin text-slate-400" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {members.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-white hover:border-slate-300 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs bg-slate-50 text-slate-600">
                                        {member.avatar}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900">
                                            {member.name}
                                        </h4>
                                        <p className="text-xs text-slate-500">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {member.isPending && (
                                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                                            Pending
                                        </span>
                                    )}
                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                                        {member.role}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamSettingsPage;
