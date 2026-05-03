import React, { useState, useMemo, useEffect } from 'react';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  X,
  Filter,
  GripHorizontal,
  FileJson,
  FileSpreadsheet,
  Download,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  ArrowRight,
  ChevronDown,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OrderItem } from '../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type SortConfig = {
  key: keyof OrderItem | null;
  direction: 'asc' | 'desc';
};

interface Column {
  id: string;
  label: string;
  key: keyof OrderItem;
  align?: string;
}

const DEFAULT_COLUMNS: Column[] = [
  { id: 'orderNumber', label: 'Order ID', key: 'orderNumber' },
  { id: 'product', label: 'Product', key: 'product' },
  { id: 'date', label: 'Date', key: 'date' },
  { id: 'paymentMethod', label: 'Method', key: 'paymentMethod' },
  { id: 'price', label: 'Price', key: 'price', align: 'text-right' }
];

interface SortableHeaderProps {
  key?: React.Key;
  column: Column;
  sortConfig: SortConfig;
  density: 'default' | 'compact';
  requestSort: (key: keyof OrderItem) => void;
  SortIcon: (props: { columnKey: keyof OrderItem }) => React.ReactNode;
}

function SortableHeader({ column, sortConfig, density, requestSort, SortIcon }: SortableHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <th 
      ref={setNodeRef}
      style={style}
      className={`${density === 'compact' ? 'px-6 py-2' : 'px-6 py-4'} text-[10px] font-bold text-slate-500 uppercase tracking-widest transition-colors ${column.align || ''} active:cursor-grabbing group h-full`}
    >
      <div className={`flex items-center gap-2 ${column.align === 'text-right' ? 'justify-end' : ''}`}>
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 -ml-2 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripHorizontal size={12} className="text-slate-600" />
        </div>
        <div 
          className="cursor-pointer flex items-center gap-2 flex-grow"
          onClick={() => requestSort(column.key)}
        >
          {column.label}
          <SortIcon columnKey={column.key} />
        </div>
      </div>
    </th>
  );
}

interface DataTableProps {
  data: OrderItem[];
}

export function DataTable({ data }: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState<Partial<Record<keyof OrderItem, string>>>({});
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [density, setDensity] = useState<'default' | 'compact'>('default');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [detailedItem, setDetailedItem] = useState<OrderItem | null>(null);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const [columns, setColumns] = useState<Column[]>(() => {
    const saved = localStorage.getItem('dashboard_column_order');
    if (saved) {
      try {
        const order = JSON.parse(saved) as string[];
        return order.map(id => DEFAULT_COLUMNS.find(c => c.id === id)!).filter(Boolean);
      } catch (e) {
        return DEFAULT_COLUMNS;
      }
    }
    return DEFAULT_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem('dashboard_column_order', JSON.stringify(columns.map(c => c.id)));
  }, [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleColumn = (columnId: string) => {
    setColumns(prev => {
      const isVisible = prev.some(c => c.id === columnId);
      if (isVisible) {
        if (prev.length <= 1) return prev; // Keep at least one column
        return prev.filter(c => c.id !== columnId);
      } else {
        const colToAdd = DEFAULT_COLUMNS.find(c => c.id === columnId)!;
        // Insert back to original relative position if possible or just push
        const originalIndex = DEFAULT_COLUMNS.findIndex(c => c.id === columnId);
        const newCols = [...prev];
        let inserted = false;
        for (let i = 0; i < newCols.length; i++) {
          const currentOrigIndex = DEFAULT_COLUMNS.findIndex(c => c.id === newCols[i].id);
          if (originalIndex < currentOrigIndex) {
            newCols.splice(i, 0, colToAdd);
            inserted = true;
            break;
          }
        }
        if (!inserted) newCols.push(colToAdd);
        return newCols;
      }
    });
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply Filters
    Object.keys(filters).forEach((key) => {
      const filterValue = filters[key as keyof OrderItem]?.toLowerCase();
      if (filterValue) {
        result = result.filter((item) => 
          String(item[key as keyof OrderItem]).toLowerCase().includes(filterValue)
        );
      }
    });

    // Apply Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, sortConfig, filters]);

  const viewData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(start, start + pageSize);
  }, [filteredAndSortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, pageSize]);

  const toggleSelection = (id: string, event: React.MouseEvent | React.ChangeEvent) => {
    const newSelected = new Set(selectedRows);
    const isShift = 'nativeEvent' in event && (event as React.MouseEvent).shiftKey;
    
    if (isShift && lastSelectedId) {
      const lastIndex = viewData.findIndex(item => item.id === lastSelectedId);
      const currentIndex = viewData.findIndex(item => item.id === id);
      
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        for (let i = start; i <= end; i++) {
          newSelected.add(viewData[i].id);
        }
      } else {
        newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
      }
    } else {
      newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
    }
    
    setSelectedRows(newSelected);
    setLastSelectedId(id);
  };

  const toggleAll = () => {
    if (selectedRows.size >= viewData.length && viewData.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(viewData.map(item => item.id)));
    }
  };

  const requestSort = (key: keyof OrderItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key: keyof OrderItem, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(filteredAndSortedData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_export_${format(new Date(), 'yyyy-MM-dd')}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToExcel = () => {
    // Basic Excel export using HTML table format
    const headers = columns.map(c => `<th>${c.label}</th>`).join('');
    const rows = filteredAndSortedData.map(item => 
      `<tr>${columns.map(c => `<td>${item[c.key]}</td>`).join('')}</tr>`
    ).join('');
    
    const excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sales Data</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
        <body><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body>
      </html>
    `;
    
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_export_${format(new Date(), 'yyyy-MM-dd')}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const headers = columns.map(c => c.label).join(',');
    const rows = filteredAndSortedData.map(item => 
      columns.map(c => `"${String(item[c.key]).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof OrderItem }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={10} className="opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />;
  };

  const renderFilterCell = (column: Column) => {
    const commonClass = "w-full bg-black/20 border border-white/10 rounded-md py-1 px-2 text-[10px] text-white focus:outline-none focus:border-indigo-500/50 transition-colors";
    
    switch (column.key) {
      case 'orderNumber':
        return (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600" size={10} />
            <input 
              className={commonClass + " pl-6"}
              placeholder="ID..."
              value={filters.orderNumber || ''}
              onChange={(e) => handleFilterChange('orderNumber', e.target.value)}
            />
          </div>
        );
      case 'paymentMethod':
        return (
          <select 
            className={commonClass + " appearance-none cursor-pointer"}
            value={filters.paymentMethod || ''}
            onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
          >
            <option value="" className="bg-slate-900">All Channels</option>
            <option value="Credit Card" className="bg-slate-900">Credit Card</option>
            <option value="Debit Card" className="bg-slate-900">Debit Card</option>
            <option value="eWallet" className="bg-slate-900">eWallet</option>
            <option value="Cash" className="bg-slate-900">Cash</option>
          </select>
        );
      case 'price':
        return (
          <input 
            className={commonClass + " text-right"}
            placeholder="Min value"
            value={filters.price || ''}
            onChange={(e) => handleFilterChange('price', e.target.value)}
          />
        );
      default:
        return (
          <input 
            className={commonClass}
            placeholder={`Search ${column.label.toLowerCase()}...`}
            value={filters[column.key] || ''}
            onChange={(e) => handleFilterChange(column.key, e.target.value)}
          />
        );
    }
  };

  const renderDataCell = (item: OrderItem, column: Column) => {
    const densityClass = density === 'compact' ? 'px-6 py-2' : 'px-6 py-3.5';
    
    switch (column.key) {
      case 'orderNumber':
        return (
          <td className={`${densityClass} text-[10px] font-mono text-slate-500 group-hover:text-indigo-400 transition-colors uppercase`}>
            {item.orderNumber}
          </td>
        );
      case 'product':
        return (
          <td className={`${density === 'compact' ? 'px-6 py-2 text-[11px]' : 'px-6 py-3.5 text-xs'} text-white font-medium`}>
            {item.product}
          </td>
        );
      case 'paymentMethod':
        return (
          <td className={`${densityClass} text-right md:text-left`}>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded bg-white/5 border border-white/5 ${density === 'compact' ? 'text-[8px]' : 'text-[9px]'} font-bold text-slate-400 uppercase tracking-tighter`}>
              {item.paymentMethod}
            </span>
          </td>
        );
      case 'price':
        return (
          <td className={`${density === 'compact' ? 'px-6 py-2 text-[11px]' : 'px-6 py-3.5 text-xs'} text-white font-bold text-right tabular-nums`}>
            {formatCurrency(item.price)}
          </td>
        );
      default:
        return (
          <td className={`${density === 'compact' ? 'px-6 py-2 text-[10px]' : 'px-6 py-3.5 text-[11px]'} text-slate-400 text-left`}>
            {String(item[column.key])}
          </td>
        );
    }
  };

  return (
    <div id="data-table-container" className="glass-card flex flex-col overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/5">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Recent Transmissions</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            {filteredAndSortedData.length} records found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all border ${showExportMenu ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-slate-400 hover:text-white border-white/5'}`}
              title="Export Data"
            >
              <Download size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Export</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showExportMenu && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 glass-card border-white/10 shadow-2xl z-50 overflow-hidden bg-slate-900/95 backdrop-blur-xl"
                  >
                    <div className="p-1">
                      <button 
                        onClick={exportToCSV}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-all group"
                      >
                        <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
                          <Download size={14} />
                        </div>
                        <span className="font-medium tracking-tight">Export as CSV</span>
                      </button>
                      <button 
                        onClick={exportToJSON}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-all group"
                      >
                        <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20 transition-colors">
                          <FileJson size={14} />
                        </div>
                        <span className="font-medium tracking-tight">Export as JSON</span>
                      </button>
                      <button 
                        onClick={exportToExcel}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-all group"
                      >
                        <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500/20 transition-colors">
                          <FileSpreadsheet size={14} />
                        </div>
                        <span className="font-medium tracking-tight">Export as Excel</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/10 mr-2">
            <button 
              onClick={() => setDensity('default')}
              className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${density === 'default' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              STD
            </button>
            <button 
              onClick={() => setDensity('compact')}
              className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${density === 'compact' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              CPT
            </button>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowColumnToggle(!showColumnToggle)}
              className={`p-2 rounded-lg transition-all ${showColumnToggle ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-slate-400 hover:text-white'}`}
              title="Toggle Columns"
            >
              <Layout size={14} />
            </button>
            <AnimatePresence>
              {showColumnToggle && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowColumnToggle(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 glass-card border-white/10 shadow-2xl z-50 overflow-hidden bg-slate-900/95 backdrop-blur-xl"
                  >
                    <div className="p-3 border-b border-white/5 bg-white/5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Columns</p>
                    </div>
                    <div className="p-2 space-y-1">
                      {DEFAULT_COLUMNS.map(col => {
                        const isVisible = columns.some(c => c.id === col.id);
                        return (
                          <button
                            key={col.id}
                            onClick={() => toggleColumn(col.id)}
                            className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-all group"
                          >
                            <span className="font-medium tracking-tight">{col.label}</span>
                            <div className={`w-3.5 h-3.5 rounded border transition-all flex items-center justify-center ${isVisible ? 'bg-indigo-500 border-indigo-500' : 'border-white/20 bg-transparent'}`}>
                              {isVisible && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-all ${showFilters ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-slate-400 hover:text-white'}`}
          >
            <Filter size={14} />
          </button>
          {Object.keys(filters).length > 0 && (
            <button 
              onClick={clearFilters}
              className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all"
              title="Clear all filters"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="w-3 h-3 rounded bg-white/5 border-white/10 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    checked={viewData.length > 0 && selectedRows.size === viewData.length}
                    onChange={toggleAll}
                  />
                </th>
                <SortableContext
                  items={columns.map(c => c.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {columns.map((column) => (
                    <SortableHeader 
                      key={column.id}
                      column={column}
                      sortConfig={sortConfig}
                      density={density}
                      requestSort={requestSort}
                      SortIcon={SortIcon}
                    />
                  ))}
                  <th className={`${density === 'compact' ? 'px-6 py-2' : 'px-6 py-4'} text-[10px] font-bold text-slate-500 uppercase tracking-widest transition-colors text-right`}>
                    Actions
                  </th>
                </SortableContext>
              </tr>
              {showFilters && (
                <tr className="bg-white/2 border-b border-white/5 animate-in slide-in-from-top-1 duration-200">
                  <td className="px-6 py-2"></td>
                  {columns.map((column) => (
                    <td key={`filter-${column.id}`} className={`${density === 'compact' ? 'px-4 py-1.5' : 'px-4 py-2'}`}>
                      {renderFilterCell(column)}
                    </td>
                  ))}
                  <td className="px-6 py-2"></td>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-white/5">
              {viewData.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  {viewData.map((item, i) => {
                    const isSelected = selectedRows.has(item.id);
                    return (
                      <motion.tr 
                        key={item.id} 
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0)',
                        }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        whileHover={{ backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.07)' }}
                        onClick={(e) => toggleSelection(item.id, e)}
                        className={`${isSelected ? 'border-l-indigo-400' : 'border-l-transparent'} border-l-2 hover:border-l-indigo-500 transition-all duration-200 group cursor-pointer`}
                      >
                        <td className="px-6 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            className="w-3 h-3 rounded bg-white/5 border-white/10 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            checked={isSelected}
                            onChange={(e) => toggleSelection(item.id, e)}
                          />
                        </td>
                        {columns.map((column) => (
                          <React.Fragment key={`${item.id}-${column.id}`}>
                            {renderDataCell(item, column)}
                          </React.Fragment>
                        ))}
                        <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setDetailedItem(item)}
                              className="p-1 px-1.5 rounded bg-white/5 border border-white/5 text-slate-400 hover:text-indigo-400 transition-colors"
                              title="View Details"
                            >
                              <Eye size={12} />
                            </button>
                            <button 
                              onClick={() => setEditingItem(item)}
                              className="p-1 px-1.5 rounded bg-white/5 border border-white/5 text-slate-400 hover:text-amber-400 transition-colors" 
                              title="Edit Entry"
                            >
                              <Pencil size={12} />
                            </button>
                            <button 
                              className="p-1 px-1.5 rounded bg-white/5 border border-white/5 text-slate-400 hover:text-rose-400 transition-colors" 
                              title="Delete Entry"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${item.orderNumber}?`)) {
                                  // In a real app, this would call an onDelete prop
                                  console.log('Deleting:', item.id);
                                }
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <tr>
                  <td colSpan={columns.length + 2} className="px-6 py-16 text-center">
                    <Search size={24} className="mx-auto text-slate-700 mb-3 opacity-30" />
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">No matching encrypted transmissions</p>
                    <button 
                      onClick={clearFilters}
                      className="mt-3 text-indigo-400 text-[9px] font-bold uppercase tracking-widest hover:text-indigo-300 transition-colors decoration-dotted underline underline-offset-4"
                    >
                      Clear Filter Stack
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </DndContext>
      </div>
      <div className="px-6 py-3 bg-white/5 border-t border-white/5 flex flex-col md:flex-row justify-between items-center bg-black/10 gap-4">
        <div className="flex items-center gap-4">
          <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredAndSortedData.length)} of {filteredAndSortedData.length} nodes
          </p>
          <div className="h-1 w-20 bg-white/5 rounded-full overflow-hidden hidden sm:block">
            <div 
              className="h-full bg-indigo-500 transition-all duration-700 ease-out" 
              style={{ width: `${Math.min((currentPage / totalPages) * 100, 100)}%` }}
            />
          </div>
          {selectedRows.size > 0 && (
            <p className="text-[9px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold animate-in fade-in zoom-in duration-200">
              {selectedRows.size} SELECTED
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Page Size</label>
            <select 
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-black/20 border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-white focus:outline-none focus:border-indigo-500/50"
            >
              {[10, 25, 50, 100].map(size => (
                <option key={size} value={size} className="bg-slate-900">{size}</option>
              ))}
            </select>
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-1 px-2 rounded hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[9px] font-bold uppercase tracking-widest flex items-center gap-1"
            >
              Prev
            </button>
            <div className="px-2 text-[9px] text-white font-mono flex items-center gap-1">
              <span className="text-indigo-400 font-bold">{currentPage}</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">{totalPages || 1}</span>
            </div>
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-1 px-2 rounded hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[9px] font-bold uppercase tracking-widest flex items-center gap-1"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      <AnimatePresence>
        {detailedItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailedItem(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-lg glass-card border-white/10 shadow-2xl pointer-events-auto overflow-hidden bg-slate-950"
              >
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/20">
                      <Eye size={18} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Transmission_Details</h3>
                      <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest">ID: {detailedItem.orderNumber}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setDetailedItem(null)}
                    className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 grid grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Asset_Ident</p>
                    <p className="text-sm font-bold text-white">{detailedItem.product}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">TIMESTAMP</p>
                    <p className="text-sm font-bold text-white">{detailedItem.date}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">VALUATION</p>
                    <p className="text-lg font-mono font-bold text-indigo-400">{formatCurrency(detailedItem.price)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">TX_PROTOCOL</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-bold text-indigo-300 uppercase">
                      {detailedItem.paymentMethod}
                    </span>
                  </div>
                </div>

                <div className="mx-6 p-4 rounded-xl bg-black/40 border border-white/5 mb-6">
                  <p className="text-[10px] font-mono text-slate-500 leading-relaxed italic opacity-70">
                    // RAW_PAYLOAD: Encrypted packet detected. Heuristic signatures indicate a valid commercial exchange. 
                    Integrity check: PASSED. Source verified at primary data node.
                  </p>
                </div>

                <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex items-center justify-end gap-3">
                  <button 
                    onClick={() => setDetailedItem(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                  <button className="flex items-center gap-2 px-6 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">
                    Download Manifest
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Entry Modal */}
      <AnimatePresence>
        {editingItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingItem(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-lg glass-card border-amber-500/20 shadow-2xl pointer-events-auto overflow-hidden bg-slate-950"
              >
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/20">
                      <Pencil size={18} className="text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Edit_Transmission</h3>
                      <p className="text-[10px] text-amber-400 font-mono uppercase tracking-widest">ID: {editingItem.orderNumber}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setEditingItem(null)}
                    className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Asset_Name</label>
                    <input 
                      type="text" 
                      defaultValue={editingItem.product}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Valuation</label>
                      <input 
                        type="number" 
                        defaultValue={editingItem.price}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Protocol</label>
                      <select 
                        defaultValue={editingItem.paymentMethod}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                      >
                        <option>Credit Card</option>
                        <option>Debit Card</option>
                        <option>eWallet</option>
                        <option>Cash</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex items-center justify-end gap-3">
                  <button 
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    className="px-6 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                    onClick={() => {
                        alert('Updates would be committed here in a live system.');
                        setEditingItem(null);
                    }}
                  >
                    Commit Changes
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
