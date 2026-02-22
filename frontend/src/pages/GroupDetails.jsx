import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, UserPlus, CreditCard, ChevronRight, CheckCircle2, X, Banknote, Smartphone, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';

const ModalWrapper = ({ show, onClose, children }) => (
    <AnimatePresence>
        {show && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
    const [actionLoading, setActionLoading] = useState(null);

    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseData, setExpenseData] = useState({ amount: '', description: '' });
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [memberEmail, setMemberEmail] = useState('');

    // Payment modal state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingPayment, setPendingPayment] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentNote, setPaymentNote] = useState('');

    const fetchData = async () => {
        try {
            const [groupRes, settlementRes, expenseRes, paymentRes] = await Promise.all([
                api.get(`/groups/${id}`),
                api.get(`/settlements/${id}`),
                api.get(`/expenses/${id}`),
                api.get(`/payments/${id}`)
            ]);
            console.log('Group data:', groupRes.data);
            console.log('Settlements:', settlementRes.data);
            console.log('Expenses:', expenseRes.data);
            console.log('Payments:', paymentRes.data);
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

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            await api.post('/expenses', { groupId: id, amount: parseFloat(expenseData.amount), description: expenseData.description });
            setShowExpenseModal(false);
            setExpenseData({ amount: '', description: '' });
            await fetchData();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Failed to add expense");
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/groups/${id}/members`, { email: memberEmail });
            setShowMemberModal(false);
            setMemberEmail('');
            await fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to add member");
        }
    };

    const getMemberName = (memberId) => {
        if (!memberId) return "Unknown";
        if (memberId === user?.id) return "You";
        if (!group || !group.members) return `User...${String(memberId).slice(-4)}`;
        const member = group.members.find(m => m.id === memberId);
        return member ? member.name : `User...${String(memberId).slice(-4)}`;
    };

    const openPaymentModal = (receiverId, amount) => {
        setPendingPayment({ receiverId, amount });
        setPaymentMethod('cash');
        setPaymentNote('');
        setShowPaymentModal(true);
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        if (!pendingPayment) return;
        try {
            setActionLoading('submit-payment');
            await api.post('/payments', {
                groupId: id,
                receiverId: pendingPayment.receiverId,
                amount: pendingPayment.amount,
                paymentMethod,
                note: paymentNote,
            });
            setShowPaymentModal(false);
            setPendingPayment(null);
            await fetchData();
        } catch (err) {
            console.error('Payment error:', err.response?.data || err);
            alert(err.response?.data?.error || "Failed to submit payment");
        } finally {
            setActionLoading(null);
        }
    };

    const handleConfirmPayment = async (paymentId) => {
        if (!window.confirm('Confirm that you received this payment?')) return;
        try {
            setActionLoading(paymentId);
            await api.post('/payments/verify', { paymentId });
            await fetchData();
        } catch (err) {
            console.error('Confirm error:', err.response?.data || err);
            alert(err.response?.data?.error || "Failed to confirm payment");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <PageTransition>
                <div className="min-h-screen bg-slate-100 flex justify-center items-center">
                    <p className="text-slate-400 text-sm animate-pulse">Loading group details...</p>
                </div>
            </PageTransition>
        );
    }

    const pendingPaymentsList = payments.filter(p => p.status === 'pending');
    const verifiedPaymentsList = payments.filter(p => p.status === 'verified');

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-100">

                {/* Header */}
                <div className="bg-white border-b border-slate-200/60 shadow-sm sticky top-0 z-10 px-4 py-3 sm:px-6">
                    <div className="max-w-4xl mx-auto flex items-center gap-3">
                        <Link to="/dashboard" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors duration-150">
                            <ArrowLeft className="h-5 w-5 text-slate-500" />
                        </Link>
                        <div>
                            <h1 className="text-base font-bold text-slate-900">{group?.name}</h1>
                            <p className="text-xs text-slate-400">{group?.members?.length || 0} members</p>
                        </div>
                    </div>
                </div>

                <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

                    {/* Group Members */}
                    <div>
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Members</h2>
                        <div className="flex flex-wrap gap-2">
                            {group?.members?.map((m) => (
                                <span key={m.id} className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 shadow-sm flex items-center">
                                    <div className="h-5 w-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mr-2 text-xs font-bold">
                                        {m.id === user?.id ? 'Y' : m.name.charAt(0).toUpperCase()}
                                    </div>
                                    {m.id === user?.id ? 'You' : m.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
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

                    {/* ── SETTLEMENTS ── */}
                    <div>
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <ChevronRight className="h-4 w-4 text-emerald-500" />
                            Who Owes Who
                        </h2>
                        <div className="card p-4">
                            {settlements.length === 0 ? (
                                <div className="flex flex-col items-center py-6 gap-2">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                    <p className="text-slate-400 text-sm font-medium">All settled up! 🎉</p>
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {settlements.map((s, i) => {
                                        const isDebtor = user?.id === s.fromUser;
                                        const isCreditor = user?.id === s.toUser;
                                        return (
                                            <li key={i} className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2 text-sm flex-wrap">
                                                        <div className="h-7 w-7 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs flex-shrink-0">
                                                            {getMemberName(s.fromUser).charAt(0)}
                                                        </div>
                                                        <span className="font-semibold text-slate-800">{getMemberName(s.fromUser)}</span>
                                                        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                                                        <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs flex-shrink-0">
                                                            {getMemberName(s.toUser).charAt(0)}
                                                        </div>
                                                        <span className="font-semibold text-slate-800">{getMemberName(s.toUser)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between sm:justify-end gap-3">
                                                        <span className="font-bold text-slate-900 text-lg">₹{s.amount.toFixed(2)}</span>
                                                        {isDebtor && (
                                                            <button onClick={() => openPaymentModal(s.toUser, s.amount)}
                                                                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm">
                                                                <CreditCard className="h-3.5 w-3.5" />
                                                                Pay Now
                                                            </button>
                                                        )}
                                                        {isCreditor && (
                                                            <span className="text-xs text-slate-400 italic bg-slate-100 px-2 py-1 rounded-md">Awaiting payment from them</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* ── PENDING PAYMENTS (to confirm) ── */}
                    {pendingPaymentsList.length > 0 && (
                        <div>
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-500" />
                                Payments Awaiting Confirmation
                                <span className="ml-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingPaymentsList.length}</span>
                            </h2>
                            <div className="card p-4">
                                <ul className="space-y-3">
                                    {pendingPaymentsList.map((payment) => {
                                        const isReceiver = user?.id === payment.receiverId;
                                        const isPayer = user?.id === payment.payerId;
                                        return (
                                            <li key={payment.id} className={`rounded-xl p-4 border ${isReceiver ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-slate-800 text-sm">
                                                            {getMemberName(payment.payerId)}
                                                            <span className="font-normal text-slate-500"> paid </span>
                                                            {getMemberName(payment.receiverId)}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                            {/* Payment Method Badge */}
                                                            {payment.paymentMethod === 'upi' ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                                                                    <Smartphone className="h-3 w-3" /> UPI
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                                    <Banknote className="h-3 w-3" /> Cash
                                                                </span>
                                                            )}
                                                            {/* Status Badge */}
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                                                <Clock className="h-3 w-3" /> PENDING
                                                            </span>
                                                            {payment.note && (
                                                                <span className="text-xs text-slate-400 italic">"{payment.note}"</span>
                                                            )}
                                                            <span className="text-xs text-slate-400">
                                                                {new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-slate-900 text-lg">₹{payment.amount.toFixed(2)}</span>
                                                        {isReceiver && (
                                                            <button
                                                                onClick={() => handleConfirmPayment(payment.id)}
                                                                disabled={actionLoading === payment.id}
                                                                className="px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap">
                                                                {actionLoading === payment.id ? (
                                                                    <span className="animate-pulse">Confirming...</span>
                                                                ) : (
                                                                    <>
                                                                        <ShieldCheck className="h-4 w-4" />
                                                                        Confirm Receipt
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                        {isPayer && (
                                                            <span className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-md">
                                                                ⏳ Waiting for confirmation
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* ── PAYMENT HISTORY (all payments) ── */}
                    <div>
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            Payment History
                            {payments.length > 0 && <span className="text-xs font-normal text-slate-400">({verifiedPaymentsList.length} confirmed, {pendingPaymentsList.length} pending)</span>}
                        </h2>
                        <div className="card p-4">
                            {payments.length === 0 ? (
                                <p className="text-slate-400 text-center py-4 text-sm">No payments recorded yet. Use "Pay Now" in settlements above to get started.</p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {payments.map((payment) => (
                                        <li key={payment.id} className="py-3.5 first:pt-0 last:pb-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-slate-800 text-sm">
                                                        {getMemberName(payment.payerId)}
                                                        <span className="font-normal text-slate-500"> → </span>
                                                        {getMemberName(payment.receiverId)}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        {/* Method */}
                                                        {payment.paymentMethod === 'upi' ? (
                                                            <span className="text-xs text-violet-600">📱 UPI</span>
                                                        ) : payment.paymentMethod === 'cash' ? (
                                                            <span className="text-xs text-green-600">💵 Cash</span>
                                                        ) : null}
                                                        {/* Status */}
                                                        {payment.status === 'verified' ? (
                                                            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                                                                <ShieldCheck className="h-3 w-3" /> Confirmed
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                                                                <Clock className="h-3 w-3" /> Pending
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-slate-400">
                                                            {new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                        {payment.note && <span className="text-xs text-slate-400">· {payment.note}</span>}
                                                    </div>
                                                </div>
                                                <span className={`font-bold text-sm ${payment.status === 'verified' ? 'text-emerald-700' : 'text-slate-900'}`}>
                                                    ₹{payment.amount.toFixed(2)}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* ── EXPENSES ── */}
                    <div>
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-indigo-500" />
                            Expenses
                        </h2>
                        <div className="card p-4">
                            {expenses.length === 0 ? (
                                <p className="text-slate-400 text-center py-4 text-sm">No expenses recorded yet.</p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {expenses.map((expense) => (
                                        <li key={expense.id} className="py-3.5 first:pt-0 last:pb-0 flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">{expense.description}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    Paid by <span className="font-medium text-slate-600">{getMemberName(expense.paidBy)}</span> · {new Date(expense.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </p>
                                                {group?.members?.length > 0 && (
                                                    <span className="mt-1.5 text-xs text-indigo-600 font-medium bg-indigo-50 inline-block px-2 py-0.5 rounded-md">
                                                        ₹{(expense.amount / group.members.length).toFixed(2)} / member
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-bold text-slate-900 text-sm ml-4 flex-shrink-0">₹{expense.amount.toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </main>

                {/* ── PAYMENT METHOD MODAL ── */}
                <ModalWrapper show={showPaymentModal} onClose={() => setShowPaymentModal(false)}>
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Make Payment</h3>
                            {pendingPayment && (
                                <p className="text-sm text-slate-500 mt-0.5">
                                    ₹{pendingPayment.amount.toFixed(2)} to <span className="font-medium text-slate-700">{getMemberName(pendingPayment.receiverId)}</span>
                                </p>
                            )}
                        </div>
                        <button onClick={() => setShowPaymentModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                            <X className="h-4 w-4 text-slate-400" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmitPayment}>
                        <label className="block text-sm font-semibold mb-2 text-slate-700">How did you pay?</label>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button type="button"
                                onClick={() => setPaymentMethod('cash')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                                <Banknote className="h-7 w-7" />
                                <span className="text-sm font-bold">Cash</span>
                            </button>
                            <button type="button"
                                onClick={() => setPaymentMethod('upi')}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'upi' ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                                <Smartphone className="h-7 w-7" />
                                <span className="text-sm font-bold">UPI</span>
                            </button>
                        </div>
                        <label className="block text-sm font-semibold mb-1.5 text-slate-700">Note <span className="font-normal text-slate-400">(optional)</span></label>
                        <input type="text" className="input-field pl-4 mb-4" placeholder={paymentMethod === 'upi' ? 'e.g. UPI ref: 12345' : 'e.g. Gave cash at office'}
                            value={paymentNote} onChange={e => setPaymentNote(e.target.value)} />

                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5 text-xs text-blue-800">
                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-500" />
                            <p>After you mark as paid, <strong>{getMemberName(pendingPayment?.receiverId)}</strong> will see a <strong>"Confirm Receipt"</strong> button to verify they received the money.</p>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowPaymentModal(false)}
                                className="px-4 py-2 font-medium text-slate-500 hover:bg-slate-100 rounded-lg text-sm transition-colors">Cancel</button>
                            <button type="submit" disabled={actionLoading === 'submit-payment'}
                                className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2 disabled:opacity-60 font-bold">
                                {actionLoading === 'submit-payment' ? (
                                    <span className="animate-pulse">Submitting...</span>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Mark as Paid
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </ModalWrapper>

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
        </PageTransition >
    );
};

export default GroupDetails;
