import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Wallet, Mail, Lock, Activity } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageTransition>
            <div className="min-h-screen flex items-center justify-center bg-[#0f1117] p-4 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-violet-600/5 rounded-full blur-3xl" />

                <div className="w-full max-w-sm relative z-10">
                    <div className="card p-7">
                        {/* Header */}
                        <div className="flex flex-col items-center mb-7">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/20">
                                <Activity className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Welcome Back</h2>
                            <p className="text-slate-400 mt-1 text-sm">Sign in to your SplitTracker account</p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input type="email" required className="input-field"
                                        style={{ paddingLeft: '2.5rem' }}
                                        placeholder="you@example.com"
                                        value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <input type="password" required className="input-field"
                                        style={{ paddingLeft: '2.5rem' }}
                                        placeholder="••••••••"
                                        value={password} onChange={(e) => setPassword(e.target.value)} />
                                </div>
                            </div>

                            <button type="submit" disabled={isLoading}
                                className="w-full btn-primary disabled:opacity-50 flex justify-center items-center">
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : "Sign In"}
                            </button>
                        </form>

                        <div className="mt-5 pt-5 border-t border-white/[0.06] text-center">
                            <p className="text-sm text-slate-500">
                                Don't have an account?{' '}
                                <Link to="/signup" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                                    Create one
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default Login;
