import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface MiniStatProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
}

function MiniStat({ label, value, icon, trend }: MiniStatProps) {
  return (
    <div className="flex items-center gap-3 px-4 xl:px-6 first:pl-2 last:pr-2 border-r border-white/5 last:border-r-0">
      <div className="hidden sm:flex p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[8px] xl:text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-sm xl:text-base font-bold text-white tracking-tight whitespace-nowrap">{value}</span>
          {trend && (
            <span className={`hidden sm:flex items-center text-[9px] font-bold ${trend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.positive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
              {trend.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function KPISection({ 
  totalRevenue, 
  totalOrders, 
  avgOrderValue, 
  uniqueProducts 
}: { 
  totalRevenue: number; 
  totalOrders: number; 
  avgOrderValue: number; 
  uniqueProducts: number 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-2.5 sm:p-4 flex flex-row items-center border-indigo-500/10 bg-slate-900/40 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000 translate-x-[-100%] animate-shimmer"></div>
      
      <div className="flex flex-1 items-center justify-between overflow-x-auto custom-scrollbar-hide">
        <MiniStat
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="w-4 h-4" />}
          trend={{ value: "12.5%", positive: true }}
        />
        <MiniStat
          label="Total Orders"
          value={totalOrders}
          icon={<ShoppingBag className="w-4 h-4" />}
          trend={{ value: "5.2%", positive: true }}
        />
        <MiniStat
          label="Avg. Order Value"
          value={formatCurrency(avgOrderValue)}
          icon={<TrendingUp className="w-4 h-4" />}
          trend={{ value: "2.1%", positive: false }}
        />
        <MiniStat
          label="Unique Items"
          value={uniqueProducts}
          icon={<Package className="w-4 h-4" />}
        />
      </div>
    </motion.div>
  );
}
