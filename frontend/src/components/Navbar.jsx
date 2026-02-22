import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, BarChart3, LogOut, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-50">
            <div className="bg-[#13151f]/95 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">

                        {/* Logo */}
                        <Link to="/dashboard" className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow duration-300">
                                <Activity className="h-4.5 w-4.5 text-white" />
                            </div>
                            <span className="text-base font-bold text-white tracking-tight">SplitTracker</span>
                        </Link>

                        {/* Center Nav Pills */}
                        <div className="hidden sm:flex items-center bg-white/[0.04] rounded-2xl p-1.5 border border-white/[0.04]">
                            {navItems.map(item => {
                                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`relative flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${isActive
                                                ? 'text-white'
                                                : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="nav-pill"
                                                className="absolute inset-0 bg-white/[0.08] rounded-xl border border-white/[0.06]"
                                                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                                            />
                                        )}
                                        <Icon className="h-4 w-4 relative z-10" />
                                        <span className="relative z-10">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span className="text-sm text-slate-400 font-medium">{user?.name}</span>
                            </div>
                            <button onClick={handleLogout}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-rose-400 hover:bg-white/[0.04] transition-all duration-200">
                                <LogOut className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>

                        {/* Mobile Nav */}
                        <div className="flex sm:hidden items-center gap-1">
                            {navItems.map(item => {
                                const isActive = location.pathname === item.path;
                                const Icon = item.icon;
                                return (
                                    <Link key={item.path} to={item.path}
                                        className={`p-2.5 rounded-xl transition-all ${isActive ? 'bg-white/[0.08] text-white' : 'text-slate-500'}`}>
                                        <Icon className="h-5 w-5" />
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
