import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Megaphone,
    Activity,
    LogOut,
    ShieldAlert
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navItems = [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Users', path: '/admin/users', icon: Users },
        { label: 'Campaigns', path: '/admin/campaigns', icon: Megaphone },
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex">
            {/* Admin Sidebar - Darker Theme for "God Mode" */}
            <aside className={`bg-slate-950 border-r border-slate-800 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
                <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                    <ShieldAlert className="text-red-500 w-8 h-8" />
                    {isSidebarOpen && <span className="font-bold text-xl tracking-tight text-white">INDIELEADS <span className="text-red-500 text-xs align-top">ADMIN</span></span>}
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <item.icon size={20} />
                                {isSidebarOpen && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span>Exit God Mode</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-900">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
