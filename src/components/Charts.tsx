import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  Brush,
  ReferenceArea
} from 'recharts';
import { formatCurrency } from '../lib/utils';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  id: string;
  onReset?: () => void;
}

const ChartContainer = ({ title, subtitle, children, id, onReset }: ChartContainerProps) => (
  <div id={id} className="glass-card p-6 flex flex-col gap-4 h-[400px] relative group">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {onReset && (
        <button 
          onClick={onReset}
          className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold text-slate-400 hover:text-white"
        >
          RESET ZOOM
        </button>
      )}
    </div>
    <div className="flex-1 w-full min-h-[300px] relative overflow-hidden">
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);

export function RevenueChart({ data }: { data: any[] }) {
  const [zoomState, setZoomState] = useState<{
    refAreaLeft: string | number | null;
    refAreaRight: string | number | null;
    left: string | number | null;
    right: string | number | null;
  }>({
    refAreaLeft: null,
    refAreaRight: null,
    left: null,
    right: null,
  });

  const zoom = () => {
    let { refAreaLeft, refAreaRight } = zoomState;

    if (refAreaLeft === refAreaRight || refAreaRight === null) {
      setZoomState((prev) => ({ ...prev, refAreaLeft: null, refAreaRight: null }));
      return;
    }

    // xAxis domain search
    if (refAreaLeft && refAreaRight) {
      if (refAreaLeft > refAreaRight) [refAreaLeft, refAreaRight] = [refAreaRight, refAreaLeft];
      setZoomState({
        refAreaLeft: null,
        refAreaRight: null,
        left: refAreaLeft,
        right: refAreaRight,
      });
    }
  };

  const zoomOut = () => {
    setZoomState({
      refAreaLeft: null,
      refAreaRight: null,
      left: null,
      right: null,
    });
  };

  return (
    <ChartContainer 
      id="chart-revenue-trend" 
      title="Growth Velocity" 
      subtitle="Drag to zoom | Scrub to pan"
      onReset={zoomState.left || zoomState.right ? zoomOut : undefined}
    >
      <AreaChart 
        data={data}
        onMouseDown={(e: any) => e && setZoomState((prev) => ({ ...prev, refAreaLeft: e.activeLabel }))}
        onMouseMove={(e: any) => e && zoomState.refAreaLeft && setZoomState((prev) => ({ ...prev, refAreaRight: e.activeLabel }))}
        onMouseUp={zoom}
      >
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#64748b', fontSize: 10 }} 
          dy={10}
          domain={[zoomState.left || 'auto', zoomState.right || 'auto']}
          type="category"
          allowDataOverflow
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#64748b', fontSize: 10 }} 
          tickFormatter={(val) => `$${val}`}
          allowDataOverflow
        />
        <Tooltip 
          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
          itemStyle={{ color: '#f8fafc' }}
          labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '12px' }}
          formatter={(value: number) => [formatCurrency(value), 'Revenue']}
        />
        <Area 
          type="monotone" 
          dataKey="revenue" 
          stroke="#6366f1" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorRevenue)" 
          animationDuration={300}
        />
        {zoomState.refAreaLeft && zoomState.refAreaRight ? (
          <ReferenceArea x1={zoomState.refAreaLeft} x2={zoomState.refAreaRight} fillOpacity={0.3} fill="rgba(99, 102, 241, 0.2)" />
        ) : null}
        <Brush 
          dataKey="date" 
          height={30} 
          stroke="#6366f1" 
          fill="rgba(15, 23, 42, 0.5)"
          travellerWidth={10}
          gap={1}
          style={{ fontSize: '10px' }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function ProductChart({ data }: { data: any[] }) {
  return (
    <ChartContainer id="chart-product-performance" title="Performance Segments">
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
        <XAxis type="number" hide />
        <YAxis 
          type="category" 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#94a3b8', fontSize: 10 }} 
          width={100}
        />
        <Tooltip 
          cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
          itemStyle={{ color: '#f8fafc' }}
          labelStyle={{ color: '#64748b', fontSize: '12px' }}
          formatter={(value: number) => [formatCurrency(value), 'Sales']}
        />
        <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} />
      </BarChart>
    </ChartContainer>
  );
}

export function PaymentChart({ data }: { data: any[] }) {
  return (
    <ChartContainer id="chart-payment-distribution" title="Payment Channels">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={65}
          outerRadius={95}
          paddingAngle={8}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
          itemStyle={{ color: '#f8fafc' }}
          formatter={(value: number) => [formatCurrency(value), 'Total']}
        />
        <Legend 
          verticalAlign="bottom" 
          align="center" 
          iconType="circle"
          wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#94a3b8' }}
        />
      </PieChart>
    </ChartContainer>
  );
}
