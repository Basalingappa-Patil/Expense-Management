import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, PlusCircle, Users, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../utils/api';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    // Stats
    const [totalOwed, setTotalOwed] = useState(0); // People owe user
    const [totalYouOwe, setTotalYouOwe] = useState(0); // User owes people

    useEffect(() => {
        // In a full app, we would fetch cross-group totals here.
        // For now we'll fetch the user's groups to display them.
        const fetchDashboardData = async () => {
            try {
                const res = await api.get('/groups');
                setGroups(res.data || []);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
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
        <div className="min-h-screen bg-slate-50">

            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Activity className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                                    SplitTracker
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-600 font-medium hidden sm:block">
                                Hello, {user?.name}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center px-4 py-2 border border-slate-200 text-sm font-medium rounded-lg text-slate-600 bg-white hover:bg-slate-50 hover:text-red-600 transition-colors"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Welcome & Action Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                        <p className="text-slate-500 mt-1">Overview of your shared expenses and balances.</p>
                    </div>
                    <button className="flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md transition-colors w-full md:w-auto">
                        <PlusCircle className="h-5 w-5 mr-2" />
                        New Group
                    </button>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Owed To You</h3>
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-emerald-600" />
                            </div>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-slate-800">₹{totalOwed.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total You Owe</h3>
                            <div className="p-2 bg-rose-50 rounded-lg">
                                <TrendingDown className="h-5 w-5 text-rose-600" />
                            </div>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-slate-800">₹{totalYouOwe.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className={`rounded-2xl shadow-sm border p-6 flex flex-col justify-between hover:shadow-md transition-all ${netBalance >= 0 ? 'bg-gradient-to-br from-indigo-500 to-blue-600 border-transparent text-white' : 'bg-gradient-to-br from-rose-500 to-red-600 border-transparent text-white'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-sm font-semibold uppercase tracking-wider ${netBalance >= 0 ? 'text-indigo-100' : 'text-rose-100'}`}>Net Balance</h3>
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Wallet className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">
                                {netBalance >= 0 ? '+' : ''}₹{netBalance.toFixed(2)}
                            </p>
                            <p className={`text-sm mt-1 ${netBalance >= 0 ? 'text-indigo-100' : 'text-rose-100'}`}>
                                {netBalance >= 0 ? 'You are owed in total' : 'You owe in total'}
                            </p>
                        </div>
                    </div>

                </div>

                {/* Groups List Section */}
                <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-slate-500" />
                        Your Groups
                    </h2>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">Loading your groups...</div>
                        ) : groups.length > 0 ? (
                            <ul className="divide-y divide-slate-100">
                                {groups.map((group) => (
                                    <li key={group.id} className="hover:bg-slate-50 transition-colors">
                                        <Link to={`/group/${group.id}`} className="block px-6 py-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-blue-600 truncate">{group.name}</p>
                                                    <p className="text-sm text-slate-500 mt-1">Created on {new Date(group.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <ChevronRight className="h-5 w-5 text-slate-400" />
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-12 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <Users className="h-8 w-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">No Groups Yet</h3>
                                <p className="mt-1 text-slate-500 max-w-sm mx-auto">
                                    Create a group to start splitting expenses with friends, family, or roommates.
                                </p>
                                <button className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors">
                                    Create First Group
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
};

export default Dashboard;
