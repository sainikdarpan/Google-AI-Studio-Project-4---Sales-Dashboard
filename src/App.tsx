import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, ArrowRight, Download, Filter, Bell, RefreshCw } from 'lucide-react';
import { rawData } from './data';
import { KPISection } from './components/StatsCards';
import { RevenueChart, ProductChart, PaymentChart } from './components/Charts';
import { DataTable } from './components/DataTable';
import { SystemLog } from './components/SystemLog';
import { CommandPalette } from './components/CommandPalette';
import { format } from 'date-fns';
import { Search, Command, Zap } from 'lucide-react';
import { OrderItem } from './types';

export default function App() {
  const [data, setData] = useState<OrderItem[]>(rawData);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const stats = useMemo(() => {
    const totalRevenue = data.reduce((sum, item) => sum + item.price, 0);
    const uniqueOrders = new Set(data.map((item) => item.orderNumber)).size;
    const uniqueProducts = new Set(data.map((item) => item.product)).size;

    // Daily Revenue
    const revenueByDayMap = data.reduce((acc, curr) => {
      const date = curr.date;
      acc[date] = (acc[date] || 0) + curr.price;
      return acc;
    }, {} as Record<string, number>);

    const revenueTrend = (Object.entries(revenueByDayMap) as [string, number][])
      .map(([date, revenue]) => ({
        date: format(new Date(date), 'MMM dd'),
        revenue: revenue as number,
        rawDate: new Date(date)
      }))
      .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

    // Product Sales
    const productSalesMap = data.reduce((acc, curr) => {
      acc[curr.product] = (acc[curr.product] || 0) + curr.price;
      return acc;
    }, {} as Record<string, number>);

    const productSales = (Object.entries(productSalesMap) as [string, number][])
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 8);

    // Payment Distribution
    const paymentMap = data.reduce((acc, curr) => {
      acc[curr.paymentMethod] = (acc[curr.paymentMethod] || 0) + curr.price;
      return acc;
    }, {} as Record<string, number>);

    const paymentData = Object.entries(paymentMap).map(([name, value]) => ({ name, value }));

    return {
      totalRevenue,
      totalOrders: uniqueOrders,
      avgOrderValue: totalRevenue / uniqueOrders,
      uniqueProducts,
      revenueTrend,
      productSales,
      paymentData
    };
  }, [data]);

  // Simulate Real-time data
  useEffect(() => {
    if (!isLive) return;

    const products = [
      "Slim-Fit Denim Jeans", "Technical Performance Joggers", "Classic Fit Chinos",
      "Flannel-Lined Canvas Work Pants", "Double-Pleated Khaki Trousers",
      "Relaxed Fit Corduroy Trousers", "Multi-Pocket Cargo Shorts",
      "Premium Tailored Trousers", "Classic Denim Overalls", "Drawstring Linen Trousers",
      "Tailored Wool Dress Trousers", "Striped Seersucker Trousers"
    ];
    
    const paymentMethods = ["Credit Card", "eWallet", "Cash", "Debit Card"];

    const interval = setInterval(() => {
      const newId = (data.length + 1).toString();
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const randomPrice = Math.floor(Math.random() * 100) + 50;
      const randomPayment = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const today = format(new Date(), 'yyyy-MM-dd');
      const orderNum = `TT-${1100 + data.length}`;

      const newItem: OrderItem = {
        id: newId,
        orderNumber: orderNum,
        product: randomProduct,
        price: randomPrice,
        date: today,
        paymentMethod: randomPayment
      };

      setData(prev => [newItem, ...prev]);
      setLastUpdate(new Date());
    }, 8000); // New data every 8 seconds

    return () => clearInterval(interval);
  }, [isLive, data.length]);

  return (
    <div className="min-h-screen mesh-bg text-slate-200 font-sans relative overflow-hidden">
      <CommandPalette />
      {/* Sidebar - Desktop Only */}
      <aside id="sidebar" className="fixed left-0 top-0 bottom-0 w-64 border-r border-white/5 bg-black/10 backdrop-blur-3xl hidden lg:flex flex-col p-6 z-10 shrink-0">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <LayoutDashboard className="text-white w-4 h-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">OmniView</span>
        </div>

        <button 
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="mb-8 flex items-center justify-between px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-slate-500 hover:text-slate-300 transition-all group"
        >
          <div className="flex items-center gap-3">
            <Search size={14} />
            <span className="text-xs font-medium">Search...</span>
          </div>
          <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
            <Command size={10} />
            <span className="text-[10px] font-bold">K</span>
          </div>
        </button>
        
        <nav className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 text-white border border-white/10">
            <LayoutDashboard size={18} />
            <span className="text-sm font-medium">Overview</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 transition-all text-sm font-medium cursor-pointer">
            <ArrowRight size={18} />
            User Analytics
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 transition-all text-sm font-medium cursor-pointer">
            <Filter size={18} />
            Revenue Streams
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 transition-all text-sm font-medium cursor-pointer">
            <Download size={18} />
            Reports
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="glass-card p-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">PRO ACCOUNT</p>
            <p className="text-sm font-bold text-white">Executive Admin</p>
            <button className="mt-4 w-full py-2 bg-indigo-500 hover:bg-indigo-600 transition-all rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-500/20">
              Go Enterprise
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main id="main-content" className="lg:ml-64 p-8 flex flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold text-white"
            >
              Executive Insights
            </motion.h1>
            <p className="text-slate-400 text-sm">Real-time platform performance overview</p>
          </div>

          <div className="flex items-center gap-3">
            <motion.div 
              key={lastUpdate.getTime()}
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card px-4 py-2 flex items-center gap-2 cursor-pointer"
              onClick={() => setIsLive(!isLive)}
            >
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <span className="text-[10px] font-bold tracking-widest uppercase">{isLive ? 'LIVE FEED' : 'PAUSED'}</span>
            </motion.div>
            <button className="w-10 h-10 glass-card flex items-center justify-center text-slate-400 hover:text-white transition-colors relative group">
              <Bell size={18} />
              <AnimatePresence>
                {data.length > rawData.length && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-slate-900"
                  />
                )}
              </AnimatePresence>
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-2xl text-sm font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">
              <Download size={18} />
              Export
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="max-w-[1600px] w-full mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
            <div className="xl:col-span-3">
              <KPISection 
                totalRevenue={stats.totalRevenue}
                totalOrders={stats.totalOrders}
                avgOrderValue={stats.avgOrderValue}
                uniqueProducts={stats.uniqueProducts}
              />
            </div>
            <div className="xl:col-span-1 hidden xl:block">
              <SystemLog />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <RevenueChart data={stats.revenueTrend} />
            <PaymentChart data={stats.paymentData} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            <div className="xl:col-span-1">
              <ProductChart data={stats.productSales} />
            </div>
            <div className="xl:col-span-2">
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
