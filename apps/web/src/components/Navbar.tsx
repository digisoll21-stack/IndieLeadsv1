import React from 'react';
import { Bell, Search, ChevronDown, Menu, Sparkles, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavbarProps {
  workspace: { id: string; name: string };
  onWorkspaceChange: (w: { id: string; name: string }) => void;
  onToggleSidebar: () => void;
  theme: 'ethereal' | 'glass';
  onToggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ workspace, onToggleSidebar, theme, onToggleTheme }) => {

  return (
    <header className="h-20 flex items-center justify-between px-4 md:px-8 z-30 sticky top-0 w-full">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-1 flex items-center justify-between px-6 h-16 rounded-2xl border shadow-sm transition-all bg-white/80 backdrop-blur-md border-slate-100 shadow-slate-200/50"
      >
        <div className="flex items-center space-x-4">
          <button onClick={onToggleSidebar} className="p-2 lg:hidden text-slate-600 hover:bg-slate-50 rounded-xl">
            <Menu size={20} />
          </button>
          <div className="flex items-center space-x-3 px-3.5 py-1.5 rounded-xl border cursor-pointer hover:shadow-sm transition-all bg-slate-50/50 border-slate-100 hover:bg-slate-50">
            <span className="w-6 h-6 rounded-lg text-xs flex items-center justify-center font-bold text-white bg-emerald-500 shadow-sm shadow-emerald-500/20">AG</span>
            <span className="text-sm font-semibold text-slate-900">{workspace.name}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
        </div>

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 max-w-lg mx-10 relative hidden md:block group"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors text-slate-400 group-focus-within:text-emerald-500" />
          <input
            type="text"
            placeholder="Search leads or campaigns..."
            className="w-full h-10 pl-11 pr-4 rounded-xl text-sm font-medium focus:outline-none transition-all bg-slate-50/50 border border-slate-100 text-slate-700 focus:bg-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5"
          />
        </motion.div>

        <div className="flex items-center space-x-2">
          <button className="relative p-2.5 rounded-xl transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-px h-6 mx-2 bg-slate-200"></div>
          <div className="flex items-center space-x-3 pl-2 group cursor-pointer">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white bg-slate-900 shadow-sm">AR</div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-bold text-slate-900">Alex Reed</p>
              <p className="text-[11px] font-semibold text-slate-400 tracking-tight">Workspace Owner</p>
            </div>
          </div>
        </div>
      </motion.div>
    </header>
  );
};

export default Navbar;