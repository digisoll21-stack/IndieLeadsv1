import React, { useEffect, useState } from 'react';
import apiClient from '../../utils/api-client';
import {
    Activity,
    Users,
    Mail,
    Database,
    Server
} from 'lucide-react';

interface SystemHealth {
    queues: Record<string, { waiting: number; active: number; failed: number }>;
    database: {
        users: number;
        emailsSent: number;
    };
}

export const AdminDashboardPage: React.FC = () => {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 5000); // Real-time pulse
        return () => clearInterval(interval);
    }, []);

    const fetchHealth = async () => {
        try {
            const res = await apiClient.get('/admin/system-health');
            setHealth(res.data);
        } catch (err) {
            console.error('Failed to fetch health stats', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-slate-400">Loading mission control...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Mission Control</h1>
                <p className="text-slate-400">Real-time oversight of the IndieLeads platform.</p>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={health?.database.users || 0}
                    icon={Users}
                    color="blue"
                />
                <StatCard
                    title="Emails Sent (Life)"
                    value={health?.database.emailsSent.toLocaleString() || 0}
                    icon={Mail}
                    color="green"
                />
                <StatCard
                    title="Active Jobs"
                    value={health?.queues?.email_sending_queue?.active || 0}
                    icon={Activity}
                    color="amber"
                />
                <StatCard
                    title="Failed Jobs"
                    value={health?.queues?.email_sending_queue?.failed || 0}
                    icon={Server}
                    color="red"
                />
            </div>

            {/* Queue Health */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <Database className="text-purple-400" />
                    Redis Queue Metrics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.entries(health?.queues || {}).map(([queueName, stats]) => (
                        <div key={queueName} className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                            <h3 className="text-slate-400 text-sm font-medium mb-3 uppercase tracking-wider">
                                {queueName.replace(/_/g, ' ')}
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Waiting</span>
                                    <span className="text-slate-200 font-mono">{stats.waiting}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Active</span>
                                    <span className="text-emerald-400 font-mono">{stats.active}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Failed</span>
                                    <span className="text-red-400 font-mono">{stats.failed}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => {
    const colors = {
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    return (
        <div className={`p-6 rounded-xl border ${colors[color]}`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm font-medium opacity-80">{title}</p>
                    <h3 className="text-3xl font-bold mt-1">{value}</h3>
                </div>
                <Icon className="w-8 h-8 opacity-80" />
            </div>
        </div>
    );
};
