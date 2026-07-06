import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf,
  LayoutDashboard,
  Megaphone,
  Users,
  Mail,
  Inbox,
  Flame,
  BarChart3,
  Settings,
  History,
  Bell,
  HelpCircle
} from 'lucide-react';

interface SidebarProps {
  workspace: { id: string; name: string };
  onClose: () => void;
  theme: 'ethereal' | 'glass';
}

const Sidebar: React.FC<SidebarProps> = ({ workspace, onClose, theme }) => {
  const location = useLocation();

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Megaphone, label: 'Campaigns', path: '/campaigns' },
    { icon: Users, label: 'Leads', path: '/leads' },
    { icon: Mail, label: 'Smart Inbox', path: '/replies' },
    { icon: Inbox, label: 'Email Accounts', path: '/inboxes' },
    { icon: Flame, label: 'Warmup', path: '/warmup' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: History, label: 'Audit Logs', path: '/audit-logs' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: HelpCircle, label: 'Support', path: '/support' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <motion.aside
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-64 h-full flex flex-col transition-colors duration-300 relative z-50 bg-white border-r border-slate-200"
    >
      <div className="p-6 flex items-center gap-3">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200/50"
        >
          <Leaf size={22} className="text-white fill-current" />
        </motion.div>
        <div>
          <h1 className="font-bold text-xl tracking-tight font-heading text-slate-900">
            IndieLeads
          </h1>
        </div>
      </div>

      <div className="px-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all bg-slate-50 border-slate-200 hover:bg-slate-100/50 text-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-emerald-100 text-emerald-700">
              {workspace.name.substring(0, 1)}
            </div>
            <span className="font-semibold text-sm truncate max-w-[120px]">{workspace.name}</span>
          </div>
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {sidebarItems.map((item, index) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <NavLink
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                  }
              `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : ''}`} />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"
                  />
                )}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="rounded-2xl p-4 border bg-slate-50 border-slate-200">
          <div className="relative z-10">
            <h4 className="text-xs font-semibold mb-1 text-slate-900">
              Basic Plan
            </h4>
            <p className="text-xs font-medium mb-3 text-slate-500">
              2,450 / 5,000 emails
            </p>
            <div className="h-1.5 rounded-full overflow-hidden bg-slate-200">
              <div className="h-full bg-emerald-500 w-[55%] rounded-full"></div>
            </div>
            <button className="mt-4 w-full py-2 text-xs font-semibold rounded-lg transition-colors bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 shadow-sm">
              Manage Sub
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;