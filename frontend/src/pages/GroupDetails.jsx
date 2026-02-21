import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, UserPlus, CreditCard, ChevronRight, CheckCircle2 } from 'lucide-react';

const GroupDetails = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [group, setGroup] = useState(null);
    const [settlements, setSettlements] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseData, setExpenseData] = useState({ amount: '', description: '' });

    const [showMemberModal, setShowMemberModal] = useState(false);
    const [memberEmail, setMemberEmail] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [groupRes, settlementRes, expenseRes] = await Promise.all([
                    api.get(`/groups/${id}`),
                    api.get(`/settlements/${id}`),
                    api.get(`/expenses/${id}`)
                ]);

                setGroup(groupRes.data);
                setSettlements(settlementRes.data.transactions || []);
                setExpenses(expenseRes.data || []);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch group details", err);
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user]);

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            await api.post('/expenses', {
                groupId: id,
                amount: parseFloat(expenseData.amount),
                description: expenseData.description
            });
            setShowExpenseModal(false);
            setExpenseData({ amount: '', description: '' });
            // Reload logic would go here
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert("Failed to add expense");
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/groups/${id}/members`, { email: memberEmail });
            setShowMemberModal(false);
            setMemberEmail('');
            window.location.reload();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to add member");
        }
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50">

            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft className="h-5 w-5 text-slate-600" />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900">{group?.name}</h1>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

                {/* Core Actions */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                        onClick={() => setShowExpenseModal(true)}
                        className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-md hover:shadow-lg transition-all text-white"
                    >
                        <CreditCard className="h-8 w-8 mb-2" />
                        <span className="font-semibold">Add Expense</span>
                    </button>

                    <button
                        onClick={() => setShowMemberModal(true)}
                        className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-700 hover:text-blue-600"
                    >
                        <UserPlus className="h-8 w-8 mb-2" />
                        <span className="font-semibold">Add Member</span>
                    </button>
                </div>

                {/* Optimized Settlements */}
                <div className="mb-10">
                    <h2 className="text-xl font-bold flex items-center text-slate-900 mb-6">
                        <CheckCircle2 className="h-5 w-5 mr-2 text-emerald-500" />
                        Optimized Settlements
                    </h2>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        {settlements.length === 0 ? (
                            <p className="text-slate-500 text-center py-4">No debts! Everyone is settled up.</p>
                        ) : (
                            <ul className="space-y-4">
                                {settlements.map((s, i) => (
                                    <li key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center flex-1">
                                            <span className="font-medium text-slate-900 truncate">
                                                {s.fromUser === user?.id ? "You" : `User ${s.fromUser.substring(0, 6)}`}
                                            </span>
                                            <ChevronRight className="h-4 w-4 mx-3 text-slate-400 flex-shrink-0" />
                                            <span className="font-medium text-slate-900 truncate">
                                                {s.toUser === user?.id ? "You" : `User ${s.toUser.substring(0, 6)}`}
                                            </span>
                                        </div>
                                        <div className="ml-4 font-bold text-lg text-emerald-600">
                                            ₹{s.amount.toFixed(2)}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Expense History Segment */}
                <div className="mb-10">
                    <h2 className="text-xl font-bold flex items-center text-slate-900 mb-6">
                        <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
                        Recent Expenses
                    </h2>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden">
                        {expenses.length === 0 ? (
                            <p className="text-slate-500 text-center py-4">No expenses recorded yet.</p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {expenses.map((expense) => (
                                    <li key={expense.id} className="py-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-slate-900">{expense.description}</p>
                                            <p className="text-sm text-slate-500">
                                                Paid by {expense.paidBy === user?.id ? "You" : `User ${expense.paidBy.substring(0, 6)}`} on {new Date(expense.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="font-bold text-slate-800">
                                            ₹{expense.amount.toFixed(2)}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

            </main>

            {/* Expense Modal (Simplified structure) */}
            {showExpenseModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Add a new expense</h3>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700">Description</label>
                                <input required type="text" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Dinner" value={expenseData.description} onChange={e => setExpenseData({ ...expenseData, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700">Amount (₹)</label>
                                <input required type="number" step="0.01" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="1000.00" value={expenseData.amount} onChange={e => setExpenseData({ ...expenseData, amount: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-6 py-2 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Member Modal */}
            {showMemberModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Add member by email</h3>
                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700">Email address</label>
                                <input required type="email" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="friend@example.com" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowMemberModal(false)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-6 py-2 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow">Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default GroupDetails;
