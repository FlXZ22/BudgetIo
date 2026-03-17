import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon,
  BarChart3,
  Filter,
  Calendar,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Settings,
  User,
  Camera,
  Palette,
  Coins,
  LogOut,
  Image as ImageIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Transaction, Category, IncomeCategory, ExpenseCategory, UserSettings } from './types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from './constants';

export default function App() {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('budgetio_transactions_v3');
    return saved ? JSON.parse(saved) : [];
  });
  const [monthlyLimit, setMonthlyLimit] = useState<number>(() => {
    const saved = localStorage.getItem('budgetio_limit_v3');
    return saved ? Number(saved) : 2000;
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('budgetio_settings_v3');
    return saved ? JSON.parse(saved) : {
      name: 'User',
      status: 'Managing my wealth',
      avatar: '',
      currency: 'USD',
      theme: 'phoenix',
      backgroundOpacity: 20,
      backgroundBlur: 2,
      containerOpacity: 100
    };
  });

  // Theme-aware colors for charts
  const chartColors = useMemo(() => {
    if (settings.theme === 'phoenix') {
      return [
        '#2d3436', // Darker Grey
        '#fd7e14', // Vibrant Orange
        '#636e72', // Medium Grey
        '#ffffff', // Pure White
        '#b2bec3', // Light Grey
        '#1e272e', // Deep Dark
        '#dfe6e9', // Very Light Grey
        '#95a5a6'  // Muted Grey
      ];
    }
    if (settings.theme === 'dark') {
      return [
        '#2d3436',
        '#F5C518',
        '#636e72',
        '#F5F0E8',
        '#b2bec3',
        '#1e272e'
      ];
    }
    if (settings.theme === 'tropical') {
      return [
        '#92c852', // Lime Green
        '#3d4e59', // Dark Blue-Grey
        '#d1d8e0', // Light Grey
        '#211f1f', // Near Black
        '#f5f6f7', // Off-white
        '#78e08f', // Soft Green
        '#60a3bc', // Soft Blue
        '#3c6382'  // Deep Blue
      ];
    }
    if (settings.theme === 'flow') {
      return [
        '#FF7036', // Primary Orange
        '#F09C6B', // Peach
        '#1a1a1a', // Charcoal
        '#6c757d', // Grey
        '#adb5bd', // Light Grey
        '#dee2e6', // Very Light Grey
        '#FF9E7D', // Lighter Orange
        '#343a40'  // Dark Grey
      ];
    }
    // Default theme
    return [
      '#2d3436',
      '#F5C518',
      '#636e72',
      '#0D0D0D',
      '#b2bec3',
      '#dfe6e9'
    ];
  }, [settings.theme]);

  // UI State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [newTx, setNewTx] = useState({ 
    description: '', 
    amount: '', 
    category: 'Food' as Category, 
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0]
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem('budgetio_transactions_v3', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('budgetio_limit_v3', monthlyLimit.toString());
  }, [monthlyLimit]);

  useEffect(() => {
    localStorage.setItem('budgetio_settings_v3', JSON.stringify(settings));
    // Apply theme to document body
    document.documentElement.className = settings.theme;
  }, [settings]);

  // Currency Formatter
  const formatCurrency = (amount: number) => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    const symbol = symbols[settings.currency] || '$';
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculations
  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
    return {
      income,
      expenses,
      balance: income - expenses,
      savingsRate
    };
  }, [transactions]);

  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const expenseByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { income: number, expense: number }> = {};
    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { income: 0, expense: 0 };
      if (t.type === 'income') months[key].income += t.amount;
      else months[key].expense += t.amount;
    });
    
    return Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, data]) => ({
        name,
        income: data.income,
        expense: data.expense
      }))
      .slice(-6); // Last 6 months
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesMonth = filterMonth === 'all' || t.date.startsWith(filterMonth);
        return matchesType && matchesMonth;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, filterMonth]);

  const monthsList = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => months.add(t.date.substring(0, 7)));
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Handlers
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.description || !newTx.amount) return;

    const transaction: Transaction = {
      id: Date.now().toString(),
      description: newTx.description,
      amount: parseFloat(newTx.amount),
      category: newTx.category,
      date: newTx.date,
      type: newTx.type
    };

    setTransactions([transaction, ...transactions]);
    setNewTx({ 
      description: '', 
      amount: '', 
      category: 'Food', 
      type: 'expense',
      date: new Date().toISOString().split('T')[0]
    });
    setIsAddModalOpen(false);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const exportCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const rows = transactions.map(t => [t.date, t.description, t.category, t.type, t.amount]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `budgetio_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const budgetProgress = (currentMonthExpenses / monthlyLimit) * 100;
  const budgetStatus = budgetProgress >= 100 ? 'danger' : budgetProgress >= 80 ? 'warning' : 'safe';

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-0 sm:p-4 md:p-8 font-sans transition-colors duration-300 relative overflow-hidden"
      style={settings.backgroundImage ? {
        backgroundImage: `url(${settings.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : {}}
    >
      {/* Background Overlay if image exists */}
      {settings.backgroundImage && (
        <div 
          className="absolute inset-0 bg-black z-0 transition-all duration-500" 
          style={{ 
            opacity: (settings.backgroundOpacity ?? 20) / 100,
            backdropFilter: `blur(${settings.backgroundBlur ?? 2}px)`
          }} 
        />
      )}

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-[1280px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative min-h-screen sm:min-h-0 transition-all duration-300 z-10"
        style={{ 
          backgroundColor: `color-mix(in srgb, var(--bg-primary), transparent ${100 - (settings.containerOpacity ?? 100)}%)`,
          backdropFilter: (settings.containerOpacity ?? 100) < 100 ? 'blur(12px)' : 'none'
        }}
      >
        
        {/* Header */}
        <header 
          className="px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between border-b border-border-subtle sticky top-0 z-30 transition-all duration-300"
          style={{ 
            backgroundColor: `color-mix(in srgb, var(--bg-primary), transparent ${100 - (settings.containerOpacity ?? 100)}%)`,
            backdropFilter: 'blur(12px)'
          }}
        >
          <div className="flex items-center gap-4 sm:gap-8">
            <div 
              onClick={() => setActiveTab('dashboard')}
              className="px-4 sm:px-5 py-2 border border-border-subtle rounded-full bg-bg-secondary flex items-center justify-center shadow-sm cursor-pointer"
            >
              <span className="text-base sm:text-lg font-display font-semibold tracking-tighter text-text-primary">
                BUDGET <span className="text-accent-main">IO</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {activeTab === 'dashboard' && (
              <>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAddModalOpen(true)}
                  className={cn(
                    "p-2 sm:p-2.5 border transition-all flex items-center justify-center gap-2 px-4 sm:px-6 shadow-lg",
                    settings.theme === 'flow' 
                      ? "flow-gradient border-transparent text-white shadow-orange-500/20 rounded-2xl" 
                      : "bg-accent-main border-accent-main text-[#0D0D0D] shadow-accent-main/20 rounded-full"
                  )}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[12px] sm:text-[13px] font-semibold">Add</span>
                </motion.button>
                <button 
                  onClick={exportCSV}
                  className={cn(
                    "p-2 sm:p-2.5 bg-bg-secondary border border-border-subtle text-text-secondary hover:text-text-primary transition-colors shadow-sm",
                    settings.theme === 'flow' ? "rounded-2xl" : "rounded-full"
                  )}
                  title="Export CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}
            <button 
              onClick={() => setActiveTab(activeTab === 'dashboard' ? 'settings' : 'dashboard')}
              className={cn(
                "p-2 sm:p-2.5 border border-border-subtle transition-all shadow-sm",
                settings.theme === 'flow' ? "rounded-2xl" : "rounded-full",
                activeTab === 'settings' 
                  ? (settings.theme === 'flow' ? "flow-gradient text-white" : "bg-accent-main text-[#0D0D0D]") 
                  : "bg-bg-secondary text-text-secondary hover:text-text-primary"
              )}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 sm:px-8 py-6 sm:py-8 flex-1 flex flex-col gap-6 sm:gap-8 overflow-y-auto sm:max-h-[85vh] custom-scrollbar">
          {activeTab === 'dashboard' ? (
            <>
              {/* Summary Cards */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <SummaryCard 
                  title="Total Balance" 
                  value={totals.balance} 
                  icon={<Wallet className="w-5 h-5" />} 
                  color="dark"
                  delay={0.1}
                  formatCurrency={formatCurrency}
                  theme={settings.theme}
                />
                <SummaryCard 
                  title="Total Income" 
                  value={totals.income} 
                  icon={<TrendingUp className="w-5 h-5" />} 
                  color="yellow"
                  delay={0.2}
                  formatCurrency={formatCurrency}
                  theme={settings.theme}
                />
                <SummaryCard 
                  title="Total Expenses" 
                  value={totals.expenses} 
                  icon={<TrendingDown className="w-5 h-5" />} 
                  color="white"
                  delay={0.3}
                  formatCurrency={formatCurrency}
                  theme={settings.theme}
                />
                <SummaryCard 
                  title="Savings Rate" 
                  value={totals.savingsRate} 
                  isPercent 
                  icon={<ArrowUpRight className="w-5 h-5" />} 
                  color="white"
                  delay={0.4}
                  formatCurrency={formatCurrency}
                  theme={settings.theme}
                />
              </section>

              {/* Budget Progress & Limit Setting */}
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-bg-secondary rounded-[32px] p-6 sm:p-8 shadow-sm border border-border-subtle"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h3 className="text-xl font-display font-semibold mb-1 text-text-primary">Monthly Budget Goal</h3>
                    <p className="text-sm text-text-secondary">Track your spending against your monthly limit</p>
                  </div>
                  <div className="flex items-center gap-4 bg-bg-primary/50 p-4 rounded-2xl border border-border-subtle">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-text-secondary">Monthly Limit</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-display font-semibold text-text-primary">{formatCurrency(monthlyLimit)}</span>
                      </div>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="10000" 
                      step="50"
                      value={monthlyLimit}
                      onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                      className="w-24 sm:w-32 accent-accent-main cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-semibold text-text-primary">
                    <span className="font-display">Spent: {formatCurrency(currentMonthExpenses)}</span>
                    <span className="font-display">{Math.round(budgetProgress)}%</span>
                  </div>
                  <div className="h-3 sm:h-4 bg-bg-primary rounded-full overflow-hidden border border-border-subtle">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(budgetProgress, 100)}%` }}
                      transition={{ duration: 1, ease: "circOut" }}
                      className={cn(
                        "h-full transition-colors duration-500",
                        budgetStatus === 'danger' ? "bg-red-500" : 
                        budgetStatus === 'warning' ? "bg-accent-main" : "bg-text-primary"
                      )}
                    />
                  </div>
                  
                  <AnimatePresence>
                    {budgetStatus !== 'safe' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                          "flex items-center gap-2 p-4 rounded-2xl text-sm font-semibold overflow-hidden",
                          budgetStatus === 'danger' ? "bg-red-50 text-red-600 border border-red-100" : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                        )}
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="leading-tight">
                          {budgetStatus === 'danger' 
                            ? "ALERT: You have exceeded your monthly budget limit!" 
                            : "WARNING: You have reached 80% of your monthly budget limit."}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.section>

              {/* Charts Section */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Breakdown */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-bg-secondary rounded-[32px] p-6 sm:p-8 shadow-sm border border-border-subtle min-h-[400px]"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-display font-semibold flex items-center gap-2 text-text-primary">
                      <PieChartIcon className="w-5 h-5 text-accent-main" />
                      Expenses by Category
                    </h3>
                  </div>
                  <div className="h-[300px] w-full relative">
                    {expenseByCategory.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={8}
                            cornerRadius={10}
                            dataKey="value"
                            animationBegin={200}
                            animationDuration={800}
                            stroke="#ffffff"
                            strokeWidth={2}
                            labelLine={false}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                              const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                              const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                              
                              // Determine if background is light or dark to choose text color
                              const bgColor = chartColors[index % chartColors.length];
                              const hex = bgColor.replace('#', '');
                              const r = parseInt(hex.substring(0, 2), 16);
                              const g = parseInt(hex.substring(2, 4), 16);
                              const b = parseInt(hex.substring(4, 6), 16);
                              const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                              const textColor = luminance > 0.6 ? "#000000" : "#ffffff";

                              return (
                                <text 
                                  x={x} 
                                  y={y} 
                                  fill={percent > 0.05 ? textColor : "transparent"} 
                                  textAnchor="middle" 
                                  dominantBaseline="central"
                                  className="text-[11px] font-bold pointer-events-none"
                                >
                                  {`${(percent * 100).toFixed(0)}%`}
                                </text>
                              );
                            }}
                          >
                            {expenseByCategory.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={chartColors[index % chartColors.length]} 
                                className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '24px', 
                              border: '1px solid var(--border-subtle)', 
                              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                              fontFamily: 'Inter', 
                              backgroundColor: 'var(--bg-secondary)', 
                              color: 'var(--text-primary)',
                              padding: '12px 16px'
                            }}
                            itemStyle={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }}
                            formatter={(value: number) => [formatCurrency(value), 'Amount']}
                            cursor={{ fill: 'transparent' }}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={48} 
                            iconType="circle" 
                            iconSize={8}
                            wrapperStyle={{ 
                              fontSize: '11px', 
                              fontWeight: 700, 
                              color: 'var(--text-primary)',
                              paddingTop: '24px',
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState message="No expense data to display" />
                    )}
                  </div>
                </motion.div>

                {/* Monthly Trend */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-bg-secondary rounded-[32px] p-6 sm:p-8 shadow-sm border border-border-subtle min-h-[400px]"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-display font-semibold flex items-center gap-2 text-text-primary">
                      <BarChart3 className="w-5 h-5 text-accent-main" />
                      Income vs Expenses
                    </h3>
                  </div>
                  <div className="h-[300px] w-full">
                    {monthlyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fontFamily: 'Inter', fill: 'var(--text-secondary)' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fontFamily: 'Inter', fill: 'var(--text-secondary)' }} />
                          <Tooltip 
                            cursor={{ fill: 'var(--bg-primary)' }}
                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontFamily: 'Inter', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }} />
                          <Bar dataKey="income" fill="var(--accent-main)" radius={[6, 6, 0, 0]} name="Income" animationDuration={1000} />
                          <Bar dataKey="expense" fill="var(--text-primary)" radius={[6, 6, 0, 0]} name="Expense" animationDuration={1000} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState message="No monthly data to display" />
                    )}
                  </div>
                </motion.div>
              </section>

              {/* Transactions List */}
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-bg-secondary rounded-[32px] p-6 sm:p-8 shadow-sm border border-border-subtle mb-4 sm:mb-0"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <h3 className="text-xl font-display font-semibold text-text-primary">Recent Transactions</h3>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Type Filter */}
                    <div className="flex bg-bg-primary p-1 rounded-full border border-border-subtle shadow-inner">
                      {(['all', 'income', 'expense'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all",
                            filterType === type ? "bg-bg-secondary shadow-sm text-text-primary" : "text-text-secondary hover:text-text-primary"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    {/* Month Filter */}
                    <div className="relative">
                      <select 
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className={cn(
                          "appearance-none bg-bg-primary border border-border-subtle px-6 py-2 text-[10px] font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-accent-main pr-10 cursor-pointer shadow-inner text-text-primary",
                          settings.theme === 'flow' ? "rounded-2xl" : "rounded-full"
                        )}
                      >
                        <option value="all">All Months</option>
                        {monthsList.map(m => (
                          <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((tx) => (
                        <motion.div 
                          layout="position"
                          transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.5 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          key={tx.id} 
                          className="flex items-center justify-between p-4 bg-bg-primary/40 hover:bg-bg-primary rounded-2xl border border-border-subtle transition-all group"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm",
                              tx.type === 'income' ? "bg-green-100 text-green-600" : "bg-text-primary text-bg-primary"
                            )}>
                              {tx.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-semibold leading-tight text-text-primary truncate">{tx.description}</h4>
                              <div className="flex items-center gap-2 text-[9px] text-text-secondary font-semibold uppercase tracking-wider mt-0.5 truncate">
                                <span className="truncate">{tx.category}</span>
                                <span className="flex-shrink-0">•</span>
                                <span className="flex-shrink-0">{new Date(tx.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0 ml-2 sm:ml-4">
                            <span className={cn(
                              "text-xs sm:text-sm font-display font-semibold whitespace-nowrap",
                              tx.type === 'income' ? "text-green-600" : "text-text-primary"
                            )}>
                              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </span>
                            <button 
                              onClick={() => deleteTransaction(tx.id)}
                              className={cn(
                                "p-2 text-red-500 transition-all",
                                "sm:opacity-0 sm:group-hover:opacity-100", // Hidden on desktop until hover
                                settings.theme === 'flow' ? "rounded-xl hover:bg-red-500/10" : "rounded-full hover:bg-red-50"
                              )}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center text-text-secondary/20">
                        <Filter className="w-12 h-12 mb-4" />
                        <p className="font-semibold uppercase tracking-widest text-[10px]">No transactions found</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.section>
            </>
          ) : (
            <SettingsPage settings={settings} setSettings={setSettings} />
          )}
        </main>
      </motion.div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-[#0D0D0D]/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-bg-secondary rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-display font-semibold text-text-primary">New Entry</h2>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 hover:bg-bg-primary rounded-full transition-colors text-text-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-6">
                {/* Type Selector */}
                <div className={cn(
                  "flex bg-bg-primary p-1 border shadow-inner",
                  settings.theme === 'flow' ? "rounded-2xl" : "rounded-full"
                )}>
                  {(['income', 'expense'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setNewTx({
                          ...newTx,
                          type,
                          category: type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
                        });
                      }}
                      className={cn(
                        "flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-all",
                        settings.theme === 'flow' ? "rounded-xl" : "rounded-full",
                        newTx.type === type ? "bg-bg-secondary shadow-sm text-text-primary" : "text-text-secondary hover:text-text-primary"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-semibold uppercase tracking-widest text-text-secondary ml-1">Description</label>
                    <input 
                      type="text" 
                      value={newTx.description}
                      onChange={e => setNewTx({...newTx, description: e.target.value})}
                      placeholder="e.g. Monthly Rent"
                      className="w-full px-6 py-4 bg-bg-primary rounded-2xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent-main transition-all font-medium shadow-inner text-text-primary"
                      required
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['Work', 'Salary', 'Freelance', 'Food', 'Rent'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setNewTx({...newTx, description: opt})}
                          className={cn(
                            "px-3 py-1 bg-bg-secondary border border-border-subtle text-[10px] font-semibold transition-all shadow-sm text-text-primary",
                            settings.theme === 'flow' ? "rounded-xl hover:bg-accent-main/10" : "rounded-full hover:bg-accent-yellow/20"
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-semibold uppercase tracking-widest text-text-secondary ml-1">Amount ($)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={newTx.amount}
                        onChange={e => setNewTx({...newTx, amount: e.target.value})}
                        placeholder="0.00"
                        className="w-full px-6 py-4 bg-bg-primary rounded-2xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent-main transition-all font-medium shadow-inner text-text-primary"
                        required
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[50, 75, 100].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setNewTx({...newTx, amount: val.toString()})}
                            className="px-3 py-1 bg-bg-secondary hover:bg-accent-main/20 border border-border-subtle rounded-full text-[10px] font-semibold transition-colors shadow-sm text-text-primary"
                          >
                            ${val}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-semibold uppercase tracking-widest text-text-secondary ml-1">Date</label>
                      <input 
                        type="date" 
                        value={newTx.date}
                        onChange={e => setNewTx({...newTx, date: e.target.value})}
                        className="w-full px-6 py-4 bg-bg-primary rounded-2xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent-main transition-all font-medium shadow-inner text-text-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-semibold uppercase tracking-widest text-text-secondary ml-1">Category</label>
                    <div className="relative">
                      <select 
                        value={newTx.category}
                        onChange={e => setNewTx({...newTx, category: e.target.value as Category})}
                        className="w-full px-6 py-4 bg-bg-primary rounded-2xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent-main transition-all font-medium appearance-none shadow-inner cursor-pointer text-text-primary"
                      >
                        {(newTx.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className={cn(
                      "flex-1 py-4 px-6 border font-semibold text-sm transition-all",
                      settings.theme === 'flow' ? "rounded-2xl bg-bg-secondary text-text-primary" : "rounded-full border-border-subtle hover:bg-bg-primary text-text-primary"
                    )}
                  >
                    Cancel
                  </button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className={cn(
                      "flex-1 py-4 px-6 font-semibold text-sm hover:opacity-90 transition-all shadow-xl",
                      settings.theme === 'flow' 
                        ? "flow-gradient text-white rounded-2xl shadow-orange-500/10" 
                        : "bg-text-primary text-bg-primary rounded-full shadow-black/20"
                    )}
                  >
                    Save Entry
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryCard({ title, value, icon, isPercent = false, color, delay, formatCurrency, theme }: { title: string; value: number; icon: React.ReactNode; isPercent?: boolean; color: 'dark' | 'yellow' | 'white'; delay: number; formatCurrency: (v: number) => string; theme: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "p-5 sm:p-6 rounded-[32px] shadow-sm flex flex-col justify-between min-h-[120px] sm:min-h-[140px] border border-border-subtle transition-all",
        color === 'dark' && "bg-text-primary text-bg-primary shadow-lg shadow-black/20",
        color === 'yellow' && "bg-accent-main text-black shadow-lg shadow-accent-main/20",
        color === 'white' && "bg-bg-secondary text-text-primary shadow-sm"
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn(
          "text-[9px] font-semibold uppercase tracking-widest", 
          color === 'dark' ? "text-bg-primary opacity-70" : "text-text-secondary"
        )}>
          {title}
        </span>
        <div className={cn(
          "p-2 rounded-xl", 
          color === 'dark' ? "bg-bg-primary/20 text-bg-primary" : "bg-bg-primary/50 text-text-primary"
        )}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <h2 className={cn(
          "text-xl sm:text-2xl lg:text-3xl font-display font-semibold tracking-tight leading-none transition-all duration-500 truncate",
          color === 'dark' ? "text-bg-primary" : "text-text-primary",
          theme === 'flow' && color !== 'white' && "text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]"
        )}>
          {isPercent ? `${value}%` : formatCurrency(value)}
        </h2>
      </div>
    </motion.div>
  );
}

const PRESET_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1000', // Blue gradient
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1000', // Colorful gradient
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000', // Dark abstract
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000', // Mountains
];

function SettingsPage({ settings, setSettings }: { settings: UserSettings; setSettings: (s: UserSettings) => void }) {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, backgroundImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto w-full space-y-8 pb-20"
    >
      <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <div className="relative group">
          <div className="w-24 h-24 rounded-[32px] bg-accent-main flex items-center justify-center overflow-hidden border-4 border-bg-secondary shadow-xl">
            {settings.avatar ? (
              <img src={settings.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-10 h-10 text-[#0D0D0D]" />
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 p-2 bg-text-primary text-bg-primary rounded-xl shadow-lg cursor-pointer hover:scale-110 transition-transform">
            <Camera className="w-4 h-4" />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
        </div>
        <div>
          <h2 className="text-2xl font-display font-semibold text-text-primary truncate max-w-[280px]">{settings.name || 'User'}</h2>
          <p className="text-text-secondary text-sm line-clamp-2">{settings.status || 'No status set'}</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Profile Section */}
        <div className="bg-bg-secondary p-6 sm:p-8 rounded-[32px] border border-border-subtle shadow-sm space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-text-secondary flex items-center gap-2">
            <User className="w-4 h-4" /> Profile Customization
          </h3>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-semibold uppercase tracking-widest text-text-secondary ml-1">Display Name</label>
              <input 
                type="text" 
                value={settings.name}
                onChange={e => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-6 py-4 bg-bg-primary rounded-2xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent-main transition-all font-medium text-text-primary"
                placeholder="Your Name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-semibold uppercase tracking-widest text-text-secondary ml-1">Status Message</label>
              <input 
                type="text" 
                value={settings.status}
                onChange={e => setSettings({ ...settings, status: e.target.value })}
                className="w-full px-6 py-4 bg-bg-primary rounded-2xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent-main transition-all font-medium text-text-primary"
                placeholder="What's on your mind?"
              />
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-bg-secondary p-6 sm:p-8 rounded-[32px] border border-border-subtle shadow-sm space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-text-secondary flex items-center gap-2">
            <Palette className="w-4 h-4" /> Preferences
          </h3>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[9px] font-semibold uppercase tracking-widest text-text-secondary ml-1">Visual Theme</label>
              <div className="flex flex-wrap gap-2">
                {(['light', 'dark', 'phoenix', 'tropical', 'flow'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setSettings({ ...settings, theme: t })}
                    className={cn(
                      "flex-1 min-w-[80px] py-3 rounded-2xl border border-border-subtle text-[10px] font-semibold uppercase tracking-wider transition-all",
                      settings.theme === t ? (t === 'flow' ? "flow-gradient text-white" : "bg-accent-main text-[#0D0D0D]") : "bg-bg-primary text-text-secondary hover:bg-border-subtle"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-semibold uppercase tracking-widest text-text-secondary ml-1">Currency</label>
              <div className="flex gap-2">
                {(['USD', 'EUR', 'GBP'] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setSettings({ ...settings, currency: c })}
                    className={cn(
                      "flex-1 py-3 rounded-2xl border border-border-subtle text-[10px] font-semibold uppercase tracking-wider transition-all",
                      settings.currency === c 
                        ? (settings.theme === 'flow' ? "flow-gradient text-white" : "bg-accent-main text-[#0D0D0D]") 
                        : "bg-bg-primary text-text-secondary hover:bg-border-subtle"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Background Customization Section */}
        <div className="bg-bg-secondary p-6 sm:p-8 rounded-[32px] border border-border-subtle shadow-sm space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-text-secondary flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Background Customization
          </h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[9px] font-semibold uppercase tracking-widest text-text-secondary ml-1">Preset Backgrounds</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRESET_BACKGROUNDS.map((bg, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSettings({ ...settings, backgroundImage: bg })}
                    className={cn(
                      "aspect-video rounded-xl border-2 transition-all overflow-hidden",
                      settings.backgroundImage === bg ? "border-accent-main scale-105 shadow-lg" : "border-transparent hover:border-border-subtle"
                    )}
                  >
                    <img src={bg} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-2">
              <div className="w-full sm:w-48 h-24 rounded-2xl bg-bg-primary border border-border-subtle overflow-hidden relative group">
                {settings.backgroundImage ? (
                  <img src={settings.backgroundImage} alt="Background Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-secondary/30">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-[10px] text-white font-bold uppercase tracking-widest">Preview</p>
                </div>
              </div>
              <div className="flex-1 space-y-3 w-full">
                <p className="text-xs text-text-secondary leading-relaxed">
                  Personalize your workspace with a custom background image. This will be applied across the entire application.
                </p>
                <div className="flex flex-wrap gap-2">
                  <label className="flex-1 min-w-[120px] py-3 px-4 bg-text-primary text-bg-primary rounded-2xl text-[10px] font-bold uppercase tracking-widest text-center cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/10">
                    Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundUpload} />
                  </label>
                  <button
                    onClick={() => setSettings({ 
                      ...settings, 
                      backgroundImage: undefined,
                      backgroundOpacity: 20,
                      backgroundBlur: 2,
                      containerOpacity: 100
                    })}
                    className="flex-1 min-w-[120px] py-3 px-4 bg-bg-primary border border-border-subtle text-text-primary rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-bg-secondary transition-all"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            </div>

            {settings.backgroundImage && (
              <div className="grid sm:grid-cols-2 gap-8 pt-6 border-t border-border-subtle">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-semibold uppercase tracking-widest text-text-secondary ml-1">Overlay Opacity</label>
                    <span className="text-[10px] font-mono font-bold text-accent-main bg-accent-main/10 px-2 py-0.5 rounded-md">{settings.backgroundOpacity ?? 20}%</span>
                  </div>
                  <div className="relative h-6 flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={settings.backgroundOpacity ?? 20}
                      onChange={(e) => setSettings({ ...settings, backgroundOpacity: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-bg-primary rounded-lg appearance-none cursor-pointer accent-accent-main hover:h-2 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-semibold uppercase tracking-widest text-text-secondary ml-1">Background Blur</label>
                    <span className="text-[10px] font-mono font-bold text-accent-main bg-accent-main/10 px-2 py-0.5 rounded-md">{settings.backgroundBlur ?? 2}px</span>
                  </div>
                  <div className="relative h-6 flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="20" 
                      value={settings.backgroundBlur ?? 2}
                      onChange={(e) => setSettings({ ...settings, backgroundBlur: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-bg-primary rounded-lg appearance-none cursor-pointer accent-accent-main hover:h-2 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-4 sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-semibold uppercase tracking-widest text-text-secondary ml-1">Section Transparency</label>
                    <span className="text-[10px] font-mono font-bold text-accent-main bg-accent-main/10 px-2 py-0.5 rounded-md">{settings.containerOpacity ?? 100}%</span>
                  </div>
                  <div className="relative h-6 flex items-center">
                    <input 
                      type="range" 
                      min="20" 
                      max="100" 
                      value={settings.containerOpacity ?? 100}
                      onChange={(e) => setSettings({ ...settings, containerOpacity: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-bg-primary rounded-lg appearance-none cursor-pointer accent-accent-main hover:h-2 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-bg-secondary p-6 sm:p-8 rounded-[32px] border border-red-500/20 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-red-500 flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Account
          </h3>
          <div className="space-y-3">
            {!isConfirmingClear ? (
              <button 
                onClick={() => setIsConfirmingClear(true)}
                className="w-full py-4 px-6 rounded-2xl bg-bg-primary border border-red-500/20 text-red-500 font-semibold text-xs uppercase tracking-widest hover:bg-red-500/10 transition-all shadow-sm"
              >
                Clear All Application Data
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="flex-1 py-4 px-6 rounded-2xl bg-red-600 text-white font-semibold text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                >
                  Yes, Clear Everything
                </button>
                <button 
                  onClick={() => setIsConfirmingClear(false)}
                  className="flex-1 py-4 px-6 rounded-2xl bg-bg-primary border border-border-subtle text-text-primary font-semibold text-xs uppercase tracking-widest hover:bg-bg-secondary transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-text-secondary/20">
      <PieChartIcon className="w-12 h-12 mb-4" />
      <p className="font-semibold uppercase tracking-widest text-[10px]">{message}</p>
    </div>
  );
}
