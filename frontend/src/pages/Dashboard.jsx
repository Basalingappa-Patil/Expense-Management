import React, { useContext, useEffect, useState, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
    PlusCircle, Users, TrendingUp, TrendingDown, Wallet,
    ChevronRight, X, ArrowUpRight, CreditCard, Banknote,
    Smartphone, BarChart3, Clock
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../utils/api';
import PageTransition from '../components/PageTransition';
import Navbar from '../components/Navbar';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

const COLORS = { indigo: '#6366f1', emerald: '#10b981', cash: '#10b981', upi: '#8b5cf6' };

const MiniTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 text-white px-2.5 py-1.5 rounded-lg shadow-xl text-xs border border-slate-700">
            <p className="text-slate-400">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="font-bold">₹{fmt(p.value)}</p>
            ))}
        </div>
    );
};

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalOwed, setTotalOwed] = useState(0);
    const [totalYouOwe, setTotalYouOwe] = useState(0);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    // Analytics preview data
    const [expenses, setExpenses] = useState([]);
    const [payments, setPayments] = useState([]);
    const [analyticsLoaded, setAnalyticsLoaded] = useState(false);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        try {
            await api.post('/groups', { name: newGroupName });
            setShowCreateGroupModal(false);
            setNewGroupName('');
            fetchDashboardData();
        } catch (err) {
            console.error(err);
            alert("Failed to create group");
        }
    };

    const fetchDashboardData = async () => {
        try {
            const res = await api.get('/groups');
            const fetchedGroups = res.data || [];
            setGroups(fetchedGroups);

            let owed = 0;
            let youOwe = 0;
            await Promise.all(
                fetchedGroups.map(async (group) => {
                    try {
                        const settleRes = await api.get(`/settlements/${group.id}`);
                        const transactions = settleRes.data?.transactions || [];
                        transactions.forEach((t) => {
                            if (t.toUser === user?.id) owed += t.amount;
                            if (t.fromUser === user?.id) youOwe += t.amount;
                        });
                    } catch (err) {
                        console.error(`Failed to fetch settlements for group ${group.id}`, err);
                    }
                })
            );
            setTotalOwed(owed);
            setTotalYouOwe(youOwe);
        } catch (err) {
            console.error("Failed to load dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch analytics preview data
    const fetchAnalyticsPreview = async () => {
        try {
            const res = await api.get('/analytics/dashboard');
            setExpenses(res.data.expenses || []);
            setPayments(res.data.payments || []);
        } catch (err) {
            console.error('Analytics preview fetch error:', err);
        } finally {
            setAnalyticsLoaded(true);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        fetchAnalyticsPreview();
    }, []);

    const netBalance = totalOwed - totalYouOwe;

    /* ─── Mini monthly chart data (last 4 months) ─── */
    const monthlyMini = useMemo(() => {
        const now = new Date();
        const data = [];
        for (let i = 3; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = d.getMonth();
            const y = d.getFullYear();
            const total = expenses
                .filter(e => { const dt = new Date(e.createdAt); return dt.getMonth() === m && dt.getFullYear() === y; })
                .reduce((s, e) => s + e.amount, 0);
            data.push({ name: MONTHS[m], amount: total });
        }
        return data;
    }, [expenses]);

    /* ─── Payment method pie ─── */
    const methodMini = useMemo(() => {
        const cashAmt = payments.filter(p => p.paymentMethod === 'cash').reduce((s, p) => s + p.amount, 0);
        const upiAmt = payments.filter(p => p.paymentMethod === 'upi').reduce((s, p) => s + p.amount, 0);
        const result = [];
        if (cashAmt > 0) result.push({ name: 'Cash', value: cashAmt, color: COLORS.cash });
        if (upiAmt > 0) result.push({ name: 'UPI', value: upiAmt, color: COLORS.upi });
        return result;
    }, [payments]);

    /* ─── Recent activity (last 5) ─── */
    const recentActivity = useMemo(() => {
        const items = [
            ...expenses.map(e => ({ type: 'expense', ...e })),
            ...payments.map(p => ({ type: 'payment', ...p })),
        ];
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return items.slice(0, 5);
    }, [expenses, payments]);

    const containerVar = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
    const itemVar = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

    return (
        <PageTransition>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/30">
                <Navbar />

                <motion.main
                    variants={containerVar} initial="hidden" animate="show"
                    className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
                >
                    {/* ─── Welcome Header ─── */}
                    <motion.div variants={itemVar} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <p className="text-sm text-slate-400 font-medium">Welcome back,</p>
                            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
                                {user?.name} 👋
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">Here's your financial overview</p>
                        </div>
                        <button onClick={() => setShowCreateGroupModal(true)}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/50 transition-all duration-300 w-full sm:w-auto">
                            <PlusCircle className="h-4 w-4" />
                            New Group
                        </button>
                    </motion.div>

                    {/* ─── Balance Cards ─── */}
                    <motion.div variants={itemVar} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Owed To You */}
                        <div className="relative overflow-hidden rounded-2xl p-5 bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300 group">
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Owed To You</span>
                                <div className="p-2 bg-emerald-50 rounded-xl">
                                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-extrabold text-slate-900">₹{fmt(totalOwed)}</p>
                            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3" /> Receivable
                            </p>
                        </div>

                        {/* You Owe */}
                        <div className="relative overflow-hidden rounded-2xl p-5 bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-300 group">
                            <div className="absolute -right-4 -top-4 w-20 h-20 bg-rose-500/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">You Owe</span>
                                <div className="p-2 bg-rose-50 rounded-xl">
                                    <TrendingDown className="h-4 w-4 text-rose-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-extrabold text-slate-900">₹{fmt(totalYouOwe)}</p>
                            <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3 rotate-90" /> Payable
                            </p>
                        </div>

                        {/* Net Balance */}
                        <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${netBalance >= 0
                                ? 'bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 shadow-indigo-200/50'
                                : 'bg-gradient-to-br from-rose-600 to-rose-700 shadow-rose-200/50'
                            }`}>
                            <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/5 rounded-full" />
                            <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white/5 rounded-full" />
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold uppercase tracking-wider text-white/60">Net Balance</span>
                                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                                    <Wallet className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <p className="text-2xl font-extrabold">{netBalance >= 0 ? '+' : ''}₹{fmt(Math.abs(netBalance))}</p>
                            <p className="text-xs mt-1 text-white/50">{netBalance >= 0 ? 'You are owed overall' : 'You owe overall'}</p>
                        </div>
                    </motion.div>

                    {/* ─── Analytics Preview Card ─── */}
                    <motion.div variants={itemVar}>
                        <Link to="/analytics" className="block group">
                            <div className="rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-indigo-200/60 transition-all duration-300 overflow-hidden">
                                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-indigo-500" />
                                        Analytics Overview
                                    </h2>
                                    <span className="text-xs text-indigo-500 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all duration-200">
                                        View Full Analytics
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                                    {/* Mini Trend Chart */}
                                    <div className="px-5 pb-5 pt-2">
                                        <p className="text-xs text-slate-400 font-medium mb-2">Monthly Expenses</p>
                                        {monthlyMini.some(d => d.amount > 0) ? (
                                            <ResponsiveContainer width="100%" height={80}>
                                                <AreaChart data={monthlyMini} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor={COLORS.indigo} stopOpacity={0.2} />
                                                            <stop offset="100%" stopColor={COLORS.indigo} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="name" hide />
                                                    <YAxis hide />
                                                    <Tooltip content={<MiniTooltip />} />
                                                    <Area type="monotone" dataKey="amount" stroke={COLORS.indigo} fill="url(#miniGrad)" strokeWidth={2} dot={false} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-[80px] flex items-center justify-center text-xs text-slate-300">No data yet</div>
                                        )}
                                        <div className="flex justify-between mt-1">
                                            {monthlyMini.map((d, i) => (
                                                <span key={i} className="text-[10px] text-slate-400">{d.name}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Mini Donut */}
                                    <div className="px-5 pb-5 pt-4 lg:pt-2 flex flex-col items-center">
                                        <p className="text-xs text-slate-400 font-medium mb-2 self-start">Payment Methods</p>
                                        {methodMini.length > 0 ? (
                                            <>
                                                <ResponsiveContainer width={90} height={80}>
                                                    <PieChart>
                                                        <Pie data={methodMini} cx="50%" cy="50%" innerRadius={24} outerRadius={38}
                                                            paddingAngle={3} dataKey="value" stroke="none">
                                                            {methodMini.map((entry, i) => (
                                                                <Cell key={i} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="flex items-center gap-4 mt-1">
                                                    {methodMini.map((m, i) => (
                                                        <span key={i} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                                            <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                                                            {m.name} ₹{fmt(m.value)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="h-[100px] flex items-center justify-center text-xs text-slate-300">No payments yet</div>
                                        )}
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="px-5 pb-5 pt-4 lg:pt-2">
                                        <p className="text-xs text-slate-400 font-medium mb-3">Quick Stats</p>
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-2 text-xs text-slate-600">
                                                    <CreditCard className="h-3.5 w-3.5 text-indigo-400" /> Total Expenses
                                                </span>
                                                <span className="text-xs font-bold text-slate-800">₹{fmt(expenses.reduce((s, e) => s + e.amount, 0))}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Banknote className="h-3.5 w-3.5 text-emerald-400" /> Cash Payments
                                                </span>
                                                <span className="text-xs font-bold text-slate-800">₹{fmt(payments.filter(p => p.paymentMethod === 'cash').reduce((s, p) => s + p.amount, 0))}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Smartphone className="h-3.5 w-3.5 text-violet-400" /> UPI Payments
                                                </span>
                                                <span className="text-xs font-bold text-slate-800">₹{fmt(payments.filter(p => p.paymentMethod === 'upi').reduce((s, p) => s + p.amount, 0))}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* ─── Two Column: Groups + Recent Activity ─── */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                        {/* Groups */}
                        <motion.div variants={itemVar} className="lg:col-span-3">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-indigo-500" />
                                    Your Groups
                                </h2>
                                <span className="text-xs text-slate-400 font-medium">{groups.length} group{groups.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="rounded-2xl bg-white border border-slate-200/60 shadow-sm overflow-hidden">
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                                        <p className="text-slate-400 text-sm">Loading groups...</p>
                                    </div>
                                ) : groups.length > 0 ? (
                                    <ul className="divide-y divide-slate-50">
                                        {groups.map((group, i) => (
                                            <motion.li key={group.id}
                                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 + i * 0.05 }}
                                                className="hover:bg-indigo-50/30 transition-colors duration-200"
                                            >
                                                <Link to={`/group/${group.id}`} className="flex items-center justify-between px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100/50 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-sm font-bold text-indigo-600">{group.name.charAt(0).toUpperCase()}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800">{group.name}</p>
                                                            <p className="text-xs text-slate-400 mt-0.5">
                                                                Created {new Date(group.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                                </Link>
                                            </motion.li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="p-10 text-center flex flex-col items-center">
                                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl flex items-center justify-center mb-3 border border-indigo-100/50">
                                            <Users className="h-7 w-7 text-indigo-400" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-800">No Groups Yet</h3>
                                        <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
                                            Create a group to start splitting expenses with your friends.
                                        </p>
                                        <button onClick={() => setShowCreateGroupModal(true)}
                                            className="mt-4 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-200/50 transition-all duration-300 hover:shadow-indigo-300/50">
                                            Create First Group
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Recent Activity */}
                        <motion.div variants={itemVar} className="lg:col-span-2">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-indigo-500" />
                                    Recent Activity
                                </h2>
                                <Link to="/analytics" className="text-xs text-indigo-500 font-semibold hover:text-indigo-600 transition-colors">
                                    See all →
                                </Link>
                            </div>
                            <div className="rounded-2xl bg-white border border-slate-200/60 shadow-sm overflow-hidden">
                                {recentActivity.length > 0 ? (
                                    <ul className="divide-y divide-slate-50">
                                        {recentActivity.map((item, i) => (
                                            <motion.li key={item.id + item.type}
                                                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.15 + i * 0.05 }}
                                                className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === 'expense' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'
                                                        }`}>
                                                        {item.type === 'expense'
                                                            ? <CreditCard className="h-3.5 w-3.5" />
                                                            : item.paymentMethod === 'upi'
                                                                ? <Smartphone className="h-3.5 w-3.5" />
                                                                : <Banknote className="h-3.5 w-3.5" />
                                                        }
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-slate-700 truncate">
                                                            {item.type === 'expense' ? item.description : `${item.payerName} → ${item.receiverName}`}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                                            {item.groupName} · {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-bold flex-shrink-0 ml-2 ${item.type === 'expense' ? 'text-slate-800' : 'text-emerald-600'
                                                    }`}>
                                                    {item.type === 'expense' ? '-' : '+'}₹{fmt(item.amount)}
                                                </span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="p-8 text-center text-slate-400 text-xs">No recent activity</div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </motion.main>

                {/* ─── Create Group Modal ─── */}
                <AnimatePresence>
                    {showCreateGroupModal && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            onClick={() => setShowCreateGroupModal(false)}>
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200/60"
                                onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Create New Group</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Add a group to split expenses</p>
                                    </div>
                                    <button onClick={() => setShowCreateGroupModal(false)}
                                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                                        <X className="h-4 w-4 text-slate-400" />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateGroup}>
                                    <label className="block text-sm font-medium mb-1.5 text-slate-700">Group Name</label>
                                    <input required type="text" className="input-field pl-4 mb-4" placeholder="e.g. Goa Trip"
                                        value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setShowCreateGroupModal(false)}
                                            className="px-4 py-2.5 font-medium text-slate-500 hover:bg-slate-100 rounded-xl text-sm transition-colors">Cancel</button>
                                        <button type="submit"
                                            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-200/50 transition-all duration-300">
                                            Create
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
};

export default Dashboard;
