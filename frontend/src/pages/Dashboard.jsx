import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, PlusCircle, Users, Activity, TrendingUp, TrendingDown, Wallet, ChevronRight, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../utils/api';
import PageTransition from '../components/PageTransition';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    const totalOwed = 0;
    const totalYouOwe = 0;

    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        try {
            await api.post('/groups', { name: newGroupName });
            setShowCreateGroupModal(false);
            setNewGroupName('');
            const res = await api.get('/groups');
            setGroups(res.data || []);
        } catch (err) {
            console.error(err);
            alert("Failed to create group");
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await api.get('/groups');
                setGroups(res.data || []);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const netBalance = totalOwed - totalYouOwe;

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-100">

                {/* Navbar */}
                <nav className="bg-white border-b border-slate-200/60 shadow-sm sticky top-0 z-10">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-14">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-200">
                                    <Activity className="h-4 w-4 text-white" />
                                </div>
                                <span className="text-base font-bold text-slate-900">SplitTracker</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-slate-500 hidden sm:block">
                                    Hi, <span className="font-medium text-slate-700">{user?.name}</span>
                                </span>
                                <button onClick={handleLogout}
                                    className="flex items-center px-3 py-1.5 border border-slate-200 text-sm font-medium rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200">
                                    <LogOut className="h-3.5 w-3.5 mr-1.5" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
                            <p className="text-slate-500 text-sm mt-0.5">Your expenses and balances at a glance.</p>
                        </div>
                        <button onClick={() => setShowCreateGroupModal(true)}
                            className="btn-primary flex items-center justify-center text-sm py-2.5 w-full sm:w-auto">
                            <PlusCircle className="h-4 w-4 mr-1.5" />
                            New Group
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="card p-5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Owed To You</span>
                                <div className="p-1.5 bg-emerald-50 rounded-lg">
                                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">₹{totalOwed.toFixed(2)}</p>
                        </div>

                        <div className="card p-5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">You Owe</span>
                                <div className="p-1.5 bg-rose-50 rounded-lg">
                                    <TrendingDown className="h-4 w-4 text-rose-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">₹{totalYouOwe.toFixed(2)}</p>
                        </div>

                        <div className={`rounded-xl p-5 shadow-sm text-white ${netBalance >= 0 ? 'bg-indigo-600 shadow-indigo-200' : 'bg-rose-600 shadow-rose-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Net Balance</span>
                                <div className="p-1.5 bg-white/15 rounded-lg">
                                    <Wallet className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold">{netBalance >= 0 ? '+' : ''}₹{netBalance.toFixed(2)}</p>
                            <p className="text-xs mt-0.5 text-white/60">{netBalance >= 0 ? 'You are owed in total' : 'You owe in total'}</p>
                        </div>
                    </div>

                    {/* Groups */}
                    <div>
                        <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center">
                            <Users className="h-4 w-4 mr-1.5 text-slate-400" />
                            Your Groups
                        </h2>

                        <div className="card overflow-hidden">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400 text-sm">Loading groups...</div>
                            ) : groups.length > 0 ? (
                                <ul className="divide-y divide-slate-100">
                                    {groups.map((group) => (
                                        <li key={group.id} className="hover:bg-slate-50 transition-colors duration-150">
                                            <Link to={`/group/${group.id}`} className="flex items-center justify-between px-5 py-3.5">
                                                <div>
                                                    <p className="text-sm font-medium text-indigo-600">{group.name}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">Created {new Date(group.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-slate-300" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-10 text-center flex flex-col items-center">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                        <Users className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-900">No Groups Yet</h3>
                                    <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
                                        Create a group to start splitting expenses with your friends.
                                    </p>
                                    <button onClick={() => setShowCreateGroupModal(true)}
                                        className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-sm transition-colors duration-200">
                                        Create First Group
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Modal */}
                <AnimatePresence>
                    {showCreateGroupModal && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
                            onClick={() => setShowCreateGroupModal(false)}>
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-bold text-slate-900">Create New Group</h3>
                                    <button onClick={() => setShowCreateGroupModal(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                        <X className="h-4 w-4 text-slate-400" />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateGroup}>
                                    <label className="block text-sm font-medium mb-1.5 text-slate-700">Group Name</label>
                                    <input required type="text" className="input-field pl-4 mb-4" placeholder="e.g. Goa Trip"
                                        value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setShowCreateGroupModal(false)}
                                            className="px-4 py-2 font-medium text-slate-500 hover:bg-slate-100 rounded-lg text-sm transition-colors">Cancel</button>
                                        <button type="submit" className="btn-primary text-sm py-2">Create</button>
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
