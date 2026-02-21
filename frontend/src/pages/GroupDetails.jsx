import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, UserPlus, CreditCard, ChevronRight, CheckCircle2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';

const ModalWrapper = ({ show, onClose, children }) => (
    <AnimatePresence>
        {show && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
                    {children}
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

const GroupDetails = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [group, setGroup] = useState(null);
    const [settlements, setSettlements] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseData, setExpenseData] = useState({ amount: '', description: '' });
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [memberEmail, setMemberEmail] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [groupRes, settlementRes, expenseRes, paymentRes] = await Promise.all([
                    api.get(`/groups/${id}`),
                    api.get(`/settlements/${id}`),
                    api.get(`/expenses/${id}`),
                    api.get(`/payments/${id}`)
                ]);
                setGroup(groupRes.data);
                setSettlements(settlementRes.data.transactions || []);
                setExpenses(expenseRes.data || []);
                setPayments(paymentRes.data || []);
            } catch (err) {
                console.error("Failed to fetch group details", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user]);

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            await api.post('/expenses', { groupId: id, amount: parseFloat(expenseData.amount), description: expenseData.description });
            setShowExpenseModal(false);
            setExpenseData({ amount: '', description: '' });
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

    const getMemberName = (memberId) => {
        if (!memberId) return "Unknown User";
        if (!group || !group.members) return `User ${String(memberId).substring(0, 6)}`;
        const member = group.members.find(m => m.id === memberId);
        if (memberId === user?.id) return "You";
        return member ? member.name : `User ${String(memberId).substring(0, 6)}`;
    };

    const handleMarkAsPaid = async (receiverId, amount) => {
        if (!window.confirm(`Mark ₹${amount.toFixed(2)} as paid?`)) return;
        try {
            await api.post('/payments', { groupId: id, receiverId, amount });
            window.location.reload();
        } catch (err) {
            alert("Failed to initiate payment");
        }
    };

    const handleVerifyPayment = async (paymentId) => {
        try {
            await api.post('/payments/verify', { paymentId });
            window.location.reload();
        } catch (err) {
            alert("Failed to verify payment");
        }
    };

    if (loading) {
        return (
            <PageTransition>
                <div className="min-h-screen bg-slate-100 flex justify-center items-center">
                    <p className="text-slate-400 text-sm">Loading group details...</p>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-100">

                {/* Header */}
                <div className="bg-white border-b border-slate-200/60 shadow-sm sticky top-0 z-10 px-4 py-3 sm:px-6">
                    <div className="max-w-4xl mx-auto flex items-center gap-3">
                        <Link to="/dashboard" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors duration-150">
                            <ArrowLeft className="h-5 w-5 text-slate-500" />
                        </Link>
                        <h1 className="text-base font-bold text-slate-900">{group?.name}</h1>
                    </div>
                </div>

                <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

                    {/* Group Members */}
                    <div className="mb-6">
                        <h2 className="text-base font-bold flex items-center text-slate-900 mb-3">
                            <span className="bg-indigo-100 p-1.5 rounded-lg mr-2">
                                <UserPlus className="h-4 w-4 text-indigo-600" />
                            </span>
                            Group Members
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {group?.members?.map((m) => (
                                <span key={m.id} className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 shadow-sm flex items-center">
                                    <div className="h-5 w-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mr-2 text-xs font-bold">
                                        {(m.id === user?.id ? "Y" : m.name.charAt(0).toUpperCase())}
                                    </div>
                                    {m.id === user?.id ? "You" : m.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button onClick={() => setShowExpenseModal(true)}
                            className="flex flex-col items-center justify-center p-5 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 text-white transition-all duration-200">
                            <CreditCard className="h-6 w-6 mb-1.5" />
                            <span className="font-semibold text-sm">Add Expense</span>
                        </button>
                        <button onClick={() => setShowMemberModal(true)}
                            className="flex flex-col items-center justify-center p-5 card text-slate-600 hover:text-indigo-600 transition-all duration-200">
                            <UserPlus className="h-6 w-6 mb-1.5" />
                            <span className="font-semibold text-sm">Add Member</span>
                        </button>
                    </div>

                    {/* Settlements */}
                    <div className="mb-6">
                        <h2 className="text-base font-bold flex items-center text-slate-900 mb-3">
                            <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-500" />
                            Settlements
                        </h2>
                        <div className="card p-4">
                            {settlements.length === 0 ? (
                                <p className="text-slate-400 text-center py-3 text-sm">No debts! Everyone is settled up. 🎉</p>
                            ) : (
                                <ul className="space-y-4">
                                    {settlements.map((s, i) => (
                                        <li key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-lg gap-3">
                                            <div className="flex items-center flex-1 text-sm">
                                                <span className="font-medium text-slate-700">{getMemberName(s.fromUser)}</span>
                                                <ChevronRight className="h-3.5 w-3.5 mx-2 text-slate-300" />
                                                <span className="font-medium text-slate-700">{getMemberName(s.toUser)}</span>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-4">
                                                <span className="font-bold text-emerald-600 text-sm">₹{s.amount.toFixed(2)}</span>
                                                {user?.id === s.fromUser && (
                                                    <button onClick={() => handleMarkAsPaid(s.toUser, s.amount)}
                                                        className="px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-semibold rounded-md transition-colors">
                                                        Mark as Paid
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Payments History */}
                    <div className="mb-6">
                        <h2 className="text-base font-bold flex items-center text-slate-900 mb-3">
                            <CheckCircle2 className="h-4 w-4 mr-1.5 text-blue-500" />
                            Payments History
                        </h2>
                        <div className="card p-4">
                            {payments.length === 0 ? (
                                <p className="text-slate-400 text-center py-3 text-sm">No payments recorded yet.</p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {payments.map((payment) => (
                                        <li key={payment.id} className="py-3 flex sm:items-center justify-between flex-col sm:flex-row gap-2">
                                            <div>
                                                <p className="font-medium text-slate-900 text-sm">
                                                    {getMemberName(payment.payerId)} paid {getMemberName(payment.receiverId)}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {new Date(payment.createdAt).toLocaleDateString()} ·
                                                    <span className={`ml-1 font-semibold ${payment.status === 'verified' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {payment.status.toUpperCase()}
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-4">
                                                <span className="font-bold text-slate-900 text-sm">₹{payment.amount.toFixed(2)}</span>
                                                {user?.id === group?.createdBy && payment.status === 'pending' && (
                                                    <button onClick={() => handleVerifyPayment(payment.id)}
                                                        className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-semibold rounded-md transition-colors">
                                                        Verify
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Expenses */}
                    <div className="mb-6">
                        <h2 className="text-base font-bold flex items-center text-slate-900 mb-3">
                            <CreditCard className="h-4 w-4 mr-1.5 text-indigo-500" />
                            Recent Expenses
                        </h2>
                        <div className="card p-4">
                            {expenses.length === 0 ? (
                                <p className="text-slate-400 text-center py-3 text-sm">No expenses recorded yet.</p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {expenses.map((expense) => (
                                        <li key={expense.id} className="py-3 flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">{expense.description}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    Paid by {getMemberName(expense.paidBy)} · {new Date(expense.createdAt).toLocaleDateString()}
                                                </p>
                                                {group?.members?.length > 0 && (
                                                    <p className="text-xs text-indigo-600 font-medium mt-1.5 bg-indigo-50 inline-block px-2 py-0.5 rounded-md">
                                                        Split: ₹{(expense.amount / group.members.length).toFixed(2)} / member
                                                    </p>
                                                )}
                                            </div>
                                            <span className="font-bold text-slate-900 text-sm">₹{expense.amount.toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </main>

                {/* Expense Modal */}
                <ModalWrapper show={showExpenseModal} onClose={() => setShowExpenseModal(false)}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-slate-900">Add Expense</h3>
                        <button onClick={() => setShowExpenseModal(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                            <X className="h-4 w-4 text-slate-400" />
                        </button>
                    </div>
                    <form onSubmit={handleAddExpense}>
                        <label className="block text-sm font-medium mb-1.5 text-slate-700">Description</label>
                        <input required type="text" className="input-field pl-4 mb-3" placeholder="e.g. Dinner"
                            value={expenseData.description} onChange={e => setExpenseData({ ...expenseData, description: e.target.value })} />
                        <label className="block text-sm font-medium mb-1.5 text-slate-700">Amount (₹)</label>
                        <input required type="number" step="0.01" className="input-field pl-4 mb-4" placeholder="1000.00"
                            value={expenseData.amount} onChange={e => setExpenseData({ ...expenseData, amount: e.target.value })} />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowExpenseModal(false)}
                                className="px-4 py-2 font-medium text-slate-500 hover:bg-slate-100 rounded-lg text-sm transition-colors">Cancel</button>
                            <button type="submit" className="btn-primary text-sm py-2">Save</button>
                        </div>
                    </form>
                </ModalWrapper>

                {/* Member Modal */}
                <ModalWrapper show={showMemberModal} onClose={() => setShowMemberModal(false)}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-slate-900">Add Member</h3>
                        <button onClick={() => setShowMemberModal(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                            <X className="h-4 w-4 text-slate-400" />
                        </button>
                    </div>
                    <form onSubmit={handleAddMember}>
                        <label className="block text-sm font-medium mb-1.5 text-slate-700">Email address</label>
                        <input required type="email" className="input-field pl-4 mb-4" placeholder="friend@example.com"
                            value={memberEmail} onChange={e => setMemberEmail(e.target.value)} />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowMemberModal(false)}
                                className="px-4 py-2 font-medium text-slate-500 hover:bg-slate-100 rounded-lg text-sm transition-colors">Cancel</button>
                            <button type="submit" className="btn-primary text-sm py-2">Add</button>
                        </div>
                    </form>
                </ModalWrapper>
            </div>
        </PageTransition>
    );
};

export default GroupDetails;
