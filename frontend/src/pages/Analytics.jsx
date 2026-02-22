import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import {
    ArrowLeft, TrendingUp, TrendingDown, Wallet, CreditCard,
    Banknote, Smartphone, Calendar, Clock, Activity, BarChart3,
    PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import Navbar from '../components/Navbar';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

/* ─── helpers ─── */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

const COLORS = {
    indigo: '#6366f1', violet: '#8b5cf6', emerald: '#10b981',
    amber: '#f59e0b', rose: '#f43f5e', sky: '#0ea5e9',
    cash: '#10b981', upi: '#8b5cf6',
};
const GRADIENTS = {
    indigo: ['#6366f1', '#818cf8'], emerald: ['#10b981', '#34d399'],
    violet: ['#8b5cf6', '#a78bfa'], rose: ['#f43f5e', '#fb7185'],
};

/* ─── format a Date to YYYY-MM-DD for input[type=date] ─── */
const toDateStr = (d) => d.toISOString().split('T')[0];

/* ─── custom tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs border border-slate-700">
            <p className="font-semibold text-slate-300 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-slate-400">{p.name}:</span>
                    <span className="font-bold">₹{fmt(p.value)}</span>
                </p>
            ))}
        </div>
    );
};

/* ─── stat card ─── */
const StatCard = ({ title, value, subtitle, icon: Icon, gradient, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
    >
        <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
            <Icon className="w-full h-full" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{title}</p>
        <p className="text-2xl font-extrabold mt-1">₹{fmt(value)}</p>
        <p className="text-xs text-white/60 mt-1">{subtitle}</p>
    </motion.div>
);

/* ─── chart card wrapper ─── */
const ChartCard = ({ title, icon: Icon, children, delay = 0, className = '' }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4, ease: 'easeOut' }}
        className={`card p-5 ${className}`}
    >
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
            <Icon className="h-4 w-4 text-indigo-500" />
            {title}
        </h3>
        {children}
    </motion.div>
);

/* ═══════════════════════════════════════════════════════════ */

const Analytics = () => {
    const { user } = useContext(AuthContext);
    const [expenses, setExpenses] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    // ─── Filter state ───
    const [period, setPeriod] = useState('all'); // week | month | all | custom
    const now = new Date();
    const [dateFrom, setDateFrom] = useState(toDateStr(new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())));
    const [dateTo, setDateTo] = useState(toDateStr(now));

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/analytics/dashboard');
                setExpenses(res.data.expenses || []);
                setPayments(res.data.payments || []);
            } catch (err) {
                console.error('Analytics fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    /* ─── compute cutoff dates from period ─── */
    const getDateRange = useCallback(() => {
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        if (period === 'week') {
            const start = new Date(end);
            start.setDate(start.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            return { start, end };
        }
        if (period === 'month') {
            const start = new Date(end);
            start.setMonth(start.getMonth() - 1);
            start.setHours(0, 0, 0, 0);
            return { start, end };
        }
        if (period === 'custom') {
            const start = new Date(dateFrom + 'T00:00:00');
            const customEnd = new Date(dateTo + 'T23:59:59.999');
            return { start, end: customEnd };
        }
        // 'all' — return extreme range
        return { start: new Date(2000, 0, 1), end };
    }, [period, dateFrom, dateTo]);

    /* ─── filtered data ─── */
    const filteredExpenses = useMemo(() => {
        const { start, end } = getDateRange();
        return expenses.filter(e => {
            const d = new Date(e.createdAt);
            return d >= start && d <= end;
        });
    }, [expenses, getDateRange]);

    const filteredPayments = useMemo(() => {
        const { start, end } = getDateRange();
        return payments.filter(p => {
            const d = new Date(p.createdAt);
            return d >= start && d <= end;
        });
    }, [payments, getDateRange]);

    /* ─── KPI stats ─── */
    const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const totalPaymentsMade = filteredPayments.filter(p => p.payerId === user?.id).reduce((s, p) => s + p.amount, 0);
    const totalPaymentsReceived = filteredPayments.filter(p => p.receiverId === user?.id).reduce((s, p) => s + p.amount, 0);
    const verifiedPayments = filteredPayments.filter(p => p.status === 'verified');
    const cashPayments = filteredPayments.filter(p => p.paymentMethod === 'cash');
    const upiPayments = filteredPayments.filter(p => p.paymentMethod === 'upi');

    /* ─── monthly area chart data (last 6 months, always) ─── */
    const monthlyData = useMemo(() => {
        const data = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const month = d.getMonth();
            const year = d.getFullYear();
            const label = `${MONTHS[month]} '${year.toString().slice(2)}`;

            const expTotal = expenses
                .filter(e => { const dt = new Date(e.createdAt); return dt.getMonth() === month && dt.getFullYear() === year; })
                .reduce((s, e) => s + e.amount, 0);

            const payTotal = payments
                .filter(p => { const dt = new Date(p.createdAt); return dt.getMonth() === month && dt.getFullYear() === year; })
                .reduce((s, p) => s + p.amount, 0);

            data.push({ name: label, expenses: expTotal, payments: payTotal });
        }
        return data;
    }, [expenses, payments]);

    /* ─── weekly bar chart data (last 7 days) ─── */
    const weeklyData = useMemo(() => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
            const label = i === 0 ? 'Today' : i === 1 ? 'Yest.' : DAYS[d.getDay()];

            const total = expenses
                .filter(e => { const dt = new Date(e.createdAt); return dt >= dayStart && dt < dayEnd; })
                .reduce((s, e) => s + e.amount, 0);

            data.push({ name: label, amount: total });
        }
        return data;
    }, [expenses]);

    /* ─── payment method pie data ─── */
    const methodData = useMemo(() => {
        const cashAmt = filteredPayments.filter(p => p.paymentMethod === 'cash').reduce((s, p) => s + p.amount, 0);
        const upiAmt = filteredPayments.filter(p => p.paymentMethod === 'upi').reduce((s, p) => s + p.amount, 0);
        const result = [];
        if (cashAmt > 0) result.push({ name: 'Cash', value: cashAmt, color: COLORS.cash });
        if (upiAmt > 0) result.push({ name: 'UPI', value: upiAmt, color: COLORS.upi });
        return result;
    }, [filteredPayments]);

    /* ─── recent activity ─── */
    const recentActivity = useMemo(() => {
        const items = [
            ...filteredExpenses.map(e => ({ type: 'expense', ...e })),
            ...filteredPayments.map(p => ({ type: 'payment', ...p })),
        ];
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return items.slice(0, 12);
    }, [filteredExpenses, filteredPayments]);

    /* ─── handle preset period click ─── */
    const handlePeriod = (key) => {
        setPeriod(key);
    };

    /* ═══ RENDER ═══ */
    if (loading) {
        return (
            <PageTransition>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/30 flex justify-center items-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-slate-400 text-sm">Loading analytics...</p>
                    </div>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/30">
                <Navbar />

                {/* ─── Filter Bar ─── */}
                <div className="bg-white border-b border-slate-200/60 shadow-sm px-4 py-3 sm:px-6">
                    <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                            {[
                                { key: 'week', label: '7 Days' },
                                { key: 'month', label: '30 Days' },
                                { key: 'all', label: 'All Time' },
                                { key: 'custom', label: 'Custom' },
                            ].map(tab => (
                                <button key={tab.key}
                                    onClick={() => handlePeriod(tab.key)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${period === tab.key
                                        ? 'bg-white text-indigo-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {period === 'custom' && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                    <label className="text-xs font-medium text-slate-500">From</label>
                                    <input type="date" value={dateFrom} max={dateTo}
                                        onChange={e => setDateFrom(e.target.value)}
                                        className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <label className="text-xs font-medium text-slate-500">To</label>
                                    <input type="date" value={dateTo} min={dateFrom} max={toDateStr(new Date())}
                                        onChange={e => setDateTo(e.target.value)}
                                        className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all" />
                                </div>
                            </motion.div>
                        )}

                        <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
                            <Filter className="h-3 w-3" />
                            {period === 'week' && 'Last 7 days'}
                            {period === 'month' && 'Last 30 days'}
                            {period === 'all' && 'All time'}
                            {period === 'custom' && `${dateFrom} → ${dateTo}`}
                            <span className="text-slate-300">·</span>
                            <span className="font-medium text-indigo-500">{filteredExpenses.length + filteredPayments.length} records</span>
                        </div>
                    </div>
                </div>

                <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

                    {/* ─── KPI Cards ─── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="Total Expenses" value={totalExpenses}
                            subtitle={`${filteredExpenses.length} transaction${filteredExpenses.length !== 1 ? 's' : ''}`}
                            icon={CreditCard} gradient={GRADIENTS.indigo} delay={0} />
                        <StatCard title="Paid by You" value={totalPaymentsMade}
                            subtitle={`${filteredPayments.filter(p => p.payerId === user?.id).length} payment${filteredPayments.filter(p => p.payerId === user?.id).length !== 1 ? 's' : ''}`}
                            icon={TrendingDown} gradient={GRADIENTS.rose} delay={0.1} />
                        <StatCard title="Received" value={totalPaymentsReceived}
                            subtitle={`${filteredPayments.filter(p => p.receiverId === user?.id).length} payment${filteredPayments.filter(p => p.receiverId === user?.id).length !== 1 ? 's' : ''}`}
                            icon={TrendingUp} gradient={GRADIENTS.emerald} delay={0.2} />
                        <StatCard title="Verified" value={verifiedPayments.reduce((s, p) => s + p.amount, 0)}
                            subtitle={`${verifiedPayments.length} confirmed`}
                            icon={Wallet} gradient={GRADIENTS.violet} delay={0.3} />
                    </div>

                    {/* ─── Row: Monthly Overview + Payment Methods ─── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <ChartCard title="Monthly Overview" icon={Activity} delay={0.2} className="lg:col-span-2">
                            {monthlyData.some(d => d.expenses > 0 || d.payments > 0) ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={COLORS.indigo} stopOpacity={0.3} />
                                                <stop offset="100%" stopColor={COLORS.indigo} stopOpacity={0.02} />
                                            </linearGradient>
                                            <linearGradient id="gradPayment" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={COLORS.emerald} stopOpacity={0.3} />
                                                <stop offset="100%" stopColor={COLORS.emerald} stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${fmt(v)}`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                                        <Area type="monotone" dataKey="expenses" name="Expenses" stroke={COLORS.indigo} fill="url(#gradExpense)" strokeWidth={2.5} dot={{ r: 4, fill: COLORS.indigo, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                        <Area type="monotone" dataKey="payments" name="Payments" stroke={COLORS.emerald} fill="url(#gradPayment)" strokeWidth={2.5} dot={{ r: 4, fill: COLORS.emerald, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">No data for this period</div>
                            )}
                        </ChartCard>

                        <ChartCard title="Payment Methods" icon={PieChartIcon} delay={0.3}>
                            {methodData.length > 0 ? (
                                <div className="flex flex-col items-center">
                                    <ResponsiveContainer width="100%" height={180}>
                                        <PieChart>
                                            <Pie data={methodData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                                                paddingAngle={4} dataKey="value" stroke="none">
                                                {methodData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val) => `₹${fmt(val)}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex items-center justify-center gap-5 mt-2">
                                        {methodData.map((m, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs">
                                                <span className="w-3 h-3 rounded-full" style={{ background: m.color }} />
                                                <span className="text-slate-600 font-medium">{m.name}</span>
                                                <span className="text-slate-400 font-bold">₹{fmt(m.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No payment data yet</div>
                            )}
                        </ChartCard>
                    </div>

                    {/* ─── Row: Weekly Spending + Expense vs Payment Comparison ─── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ChartCard title="Weekly Spending" icon={Calendar} delay={0.35}>
                            {weeklyData.some(d => d.amount > 0) ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${fmt(v)}`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="amount" name="Spent" radius={[6, 6, 0, 0]} maxBarSize={36}>
                                            {weeklyData.map((entry, i) => (
                                                <Cell key={i} fill={i === weeklyData.length - 1 ? COLORS.indigo : '#c7d2fe'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No expenses this week</div>
                            )}
                        </ChartCard>

                        <ChartCard title="Expenses vs Payments" icon={BarChart3} delay={0.4}>
                            {monthlyData.some(d => d.expenses > 0 || d.payments > 0) ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${fmt(v)}`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                                        <Bar dataKey="expenses" name="Expenses" fill={COLORS.indigo} radius={[4, 4, 0, 0]} maxBarSize={28} />
                                        <Bar dataKey="payments" name="Payments" fill={COLORS.emerald} radius={[4, 4, 0, 0]} maxBarSize={28} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No data for this period</div>
                            )}
                        </ChartCard>
                    </div>

                    {/* ─── Cash / UPI Stats ─── */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                            className="card p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                                <Banknote className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cash Payments</p>
                                <p className="text-xl font-extrabold text-slate-900">₹{fmt(cashPayments.reduce((s, p) => s + p.amount, 0))}</p>
                                <p className="text-xs text-slate-400">{cashPayments.length} transaction{cashPayments.length !== 1 ? 's' : ''}</p>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                            className="card p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                                <Smartphone className="h-6 w-6 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">UPI Payments</p>
                                <p className="text-xl font-extrabold text-slate-900">₹{fmt(upiPayments.reduce((s, p) => s + p.amount, 0))}</p>
                                <p className="text-xs text-slate-400">{upiPayments.length} transaction{upiPayments.length !== 1 ? 's' : ''}</p>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                            className="card p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                                <Activity className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Groups</p>
                                <p className="text-xl font-extrabold text-slate-900">
                                    {new Set([...filteredExpenses.map(e => e.groupId), ...filteredPayments.map(p => p.groupId)]).size}
                                </p>
                                <p className="text-xs text-slate-400">Groups with transactions</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* ─── Recent Activity Timeline ─── */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
                            <Clock className="h-4 w-4 text-indigo-500" />
                            Recent Activity
                        </h3>
                        <div className="card overflow-hidden">
                            {recentActivity.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">No activity for this period</div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {recentActivity.map((item, i) => (
                                        <motion.li key={item.id + item.type}
                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.55 + i * 0.03 }}
                                            className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'expense'
                                                    ? 'bg-indigo-50 text-indigo-600'
                                                    : item.status === 'verified'
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : 'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {item.type === 'expense'
                                                        ? <CreditCard className="h-4 w-4" />
                                                        : item.paymentMethod === 'upi'
                                                            ? <Smartphone className="h-4 w-4" />
                                                            : <Banknote className="h-4 w-4" />
                                                    }
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">
                                                        {item.type === 'expense'
                                                            ? item.description
                                                            : `${item.payerName} → ${item.receiverName}`
                                                        }
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                                                        <span className={`font-medium px-1.5 py-0.5 rounded ${item.type === 'expense'
                                                            ? 'bg-indigo-50 text-indigo-600'
                                                            : item.status === 'verified'
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : 'bg-amber-50 text-amber-600'
                                                            }`}>
                                                            {item.type === 'expense' ? 'Expense' : item.status === 'verified' ? 'Confirmed' : 'Pending'}
                                                        </span>
                                                        <span>{item.groupName}</span>
                                                        <span>·</span>
                                                        <span>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-bold flex-shrink-0 ml-3 ${item.type === 'expense' ? 'text-slate-900' : 'text-emerald-600'
                                                }`}>
                                                {item.type === 'expense' ? '-' : '+'}₹{fmt(item.amount)}
                                            </span>
                                        </motion.li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </motion.div>

                </main>
            </div>
        </PageTransition>
    );
};

export default Analytics;
