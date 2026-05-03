import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Activity, ShieldCheck, Database, Cpu } from 'lucide-react';
import { format } from 'date-fns';

interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  icon: React.ReactNode;
}

const LOG_MESSAGES: { message: string; type: LogEntry['type']; icon: React.ReactNode }[] = [
  { message: "Encrypted transmission decoded from node JS-452", type: 'info', icon: <Database size={10} /> },
  { message: "Database sync completed successfully", type: 'success', icon: <ShieldCheck size={10} /> },
  { message: "Heuristic anomaly detected in revenue stream", type: 'warning', icon: <Activity size={10} /> },
  { message: "Neural processor load balanced to 42%", type: 'system', icon: <Cpu size={10} /> },
  { message: "New executive insight generated", type: 'info', icon: <Terminal size={10} /> },
  { message: "Payment gateway latency: 14ms", type: 'success', icon: <ShieldCheck size={10} /> },
  { message: "Batch export process initiated by UID:883", type: 'system', icon: <Database size={10} /> },
  { message: "SSL certificate handshake verified", type: 'success', icon: <ShieldCheck size={10} /> },
];

export function SystemLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial logs
    const initialLogs: LogEntry[] = Array.from({ length: 5 }).map((_, i) => {
      const msg = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
      return {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(Date.now() - (5-i) * 10000),
        ...msg
      };
    });
    setLogs(initialLogs);

    // Periodic new logs
    const interval = setInterval(() => {
      const msg = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];
      setLogs(prev => {
        const next = [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            ...msg
          }
        ];
        if (next.length > 20) return next.slice(next.length - 20);
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-emerald-400';
      case 'warning': return 'text-amber-400';
      case 'error': return 'text-rose-400';
      case 'system': return 'text-indigo-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden border-indigo-500/10">
      <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-indigo-400" />
          <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">System_Log</h3>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[8px] text-slate-500 font-mono">LIVE_STREAMing</span>
        </div>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-2 font-mono scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -5, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2 group"
            >
              <div className={`mt-1 transition-colors ${getTypeColor(log.type)}`}>
                {log.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[8px] text-slate-600 font-bold uppercase">{log.type}</span>
                  <span className="text-[8px] text-slate-700 whitespace-nowrap">[{format(log.timestamp, 'HH:mm:ss')}]</span>
                </div>
                <p className={`text-[9px] leading-relaxed break-words group-hover:text-white transition-colors ${getTypeColor(log.type)} opacity-80`}>
                  {log.message}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="px-4 py-1.5 bg-black/40 border-t border-white/5 flex items-center justify-between">
        <span className="text-[8px] text-slate-600">KERNEL_V2.0.48</span>
        <span className="text-[8px] text-slate-600">UPTIME: 14d 02h 45m</span>
      </div>
    </div>
  );
}
