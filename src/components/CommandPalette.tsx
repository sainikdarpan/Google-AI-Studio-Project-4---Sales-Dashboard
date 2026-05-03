import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Terminal, 
  Settings, 
  Table as TableIcon, 
  PieChart, 
  Download, 
  Command,
  ArrowRight,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    { 
      id: 'dash', 
      label: 'Main Dashboard', 
      description: 'Back to overview', 
      icon: <LayoutDashboard size={16} />, 
      action: () => (window.location.hash = '#') 
    },
    { 
      id: 'export', 
      label: 'Export Analytics', 
      description: 'Download current dataset', 
      icon: <Download size={16} />, 
      shortcut: '⌘E',
      action: () => document.getElementById('export-btn')?.click() 
    },
    { 
      id: 'table', 
      label: 'Data Explorer', 
      description: 'Jump to transmission table', 
      icon: <TableIcon size={16} />, 
      action: () => document.getElementById('data-table-container')?.scrollIntoView({ behavior: 'smooth' }) 
    },
    { 
      id: 'revenue', 
      label: 'Revenue Analysis', 
      description: 'View depth charts', 
      icon: <TrendingUp size={16} />, 
      action: () => document.getElementById('revenue-chart')?.scrollIntoView({ behavior: 'smooth' }) 
    },
    { 
      id: 'settings', 
      label: 'User Settings', 
      description: 'Profile and preferences', 
      icon: <Settings size={16} />, 
      action: () => console.log('Settings opened') 
    },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase()) || 
    cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }

    if (!isOpen) return;

    if (e.key === 'Escape') {
      setIsOpen(false);
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      filteredCommands[selectedIndex]?.action();
      setIsOpen(false);
    }
  }, [isOpen, filteredCommands, selectedIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 flex items-start justify-center pt-[20vh] pointer-events-none z-[101] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-xl glass-card border-white/10 shadow-2xl pointer-events-auto overflow-hidden bg-slate-900"
            >
              <div className="flex items-center px-4 py-3 border-b border-white/5 gap-3">
                <Search size={18} className="text-slate-500" />
                <input 
                  autoFocus
                  className="bg-transparent border-none outline-none text-white text-sm w-full font-medium placeholder:text-slate-600"
                  placeholder="Execute command or search nodes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10">
                  <span className="text-[10px] text-slate-500 font-bold">ESC</span>
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((cmd, i) => (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all gap-4 ${
                        i === selectedIndex ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${i === selectedIndex ? 'bg-white/20' : 'bg-white/5'}`}>
                          {cmd.icon}
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-bold ${i === selectedIndex ? 'text-white' : 'text-white/80'}`}>{cmd.label}</p>
                          <p className={`text-[10px] font-medium ${i === selectedIndex ? 'text-white/70' : 'text-slate-500'}`}>{cmd.description}</p>
                        </div>
                      </div>
                      {cmd.shortcut && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${i === selectedIndex ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500'}`}>
                          {cmd.shortcut}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="p-10 text-center">
                    <Terminal size={32} className="mx-auto text-slate-800 mb-4 opacity-30" />
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">No matching system commands</p>
                  </div>
                )}
              </div>

              <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-slate-600 font-bold uppercase">Navigate</span>
                    <div className="flex gap-1">
                      <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] text-slate-500">↑</kbd>
                      <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] text-slate-500">↓</kbd>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-slate-600 font-bold uppercase">Select</span>
                    <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] text-slate-500">ENTER</kbd>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-indigo-400 font-bold italic tracking-tighter">OMNI_OS V2.0</span>
                  <Command size={10} className="text-indigo-500" />
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
