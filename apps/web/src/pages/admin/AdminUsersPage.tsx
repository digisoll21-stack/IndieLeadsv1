import React, { useEffect, useState } from 'react';
import apiClient from '../../utils/api-client';
import {
    Search,
    Ban,
    UserCheck,
    Key,
    MoreVertical
} from 'lucide-react';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'USER' | 'SUPER_ADMIN';
    isBanned: boolean;
    createdAt: string;
    _count: { memberships: number };
}

export const AdminUsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await apiClient.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleBan = async (userId: string) => {
        if (!confirm('Are you sure you want to change the ban status of this user?')) return;
        try {
            await apiClient.post(`/admin/users/${userId}/ban`);
            setUsers(users.map(u => u.id === userId ? { ...u, isBanned: !u.isBanned } : u));
        } catch (err) {
            alert('Failed to ban user');
        }
    };

    const impersonate = async (userId: string) => {
        if (!confirm('You are about to log in as this user. Proceed?')) return;
        try {
            // Logic for impersonation would go here - usually returns a token
            alert('Impersonation token logic not yet connected to auth flow.');
        } catch (err) {
            alert('Failed to impersonate');
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.firstName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">User Management</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-blue-500 w-64"
                    />
                </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-400 text-sm font-medium uppercase border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-900/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="text-white font-medium">{user.firstName} {user.lastName}</div>
                                        <div className="text-slate-500 text-sm">{user.email}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {user.isBanned ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                            Banned
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            Active
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-mono px-2 py-1 rounded border ${user.role === 'SUPER_ADMIN'
                                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                            : 'bg-slate-800 text-slate-400 border-slate-700'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-400 text-sm">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => impersonate(user.id)}
                                            title="Impersonate"
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            <Key size={16} />
                                        </button>
                                        {user.role !== 'SUPER_ADMIN' && (
                                            <button
                                                onClick={() => toggleBan(user.id)}
                                                title={user.isBanned ? "Unban" : "Ban"}
                                                className={`p-2 rounded-lg transition-colors ${user.isBanned
                                                        ? 'text-emerald-400 hover:bg-emerald-500/10'
                                                        : 'text-red-400 hover:bg-red-500/10'
                                                    }`}
                                            >
                                                {user.isBanned ? <UserCheck size={16} /> : <Ban size={16} />}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
