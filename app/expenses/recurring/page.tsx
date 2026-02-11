"use client";

import { useState, useEffect } from "react";
import { Plus, Save, Trash2, Edit, Loader2, X, Check, Calendar, Power, PowerOff } from "lucide-react";
import { format, addMonths } from "date-fns";

type RecurringExpense = {
    id: number;
    title: string;
    amount: number;
    category: string;
    note: string | null;
    dayOfMonth: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export default function RecurringExpensesPage() {
    const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Maintenance");
    const [note, setNote] = useState("");
    const [dayOfMonth, setDayOfMonth] = useState(1);

    // Delete modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchRecurring = async () => {
        try {
            const res = await fetch("/api/recurring-expenses");
            const data = await res.json();
            setRecurring(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecurring();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setTitle("");
        setAmount("");
        setCategory("Maintenance");
        setNote("");
        setDayOfMonth(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                title,
                amount,
                category,
                note,
                dayOfMonth
            };

            const url = editingId ? `/api/recurring-expenses/${editingId}` : "/api/recurring-expenses";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...payload,
                    ...(editingId && { isActive: recurring.find(r => r.id === editingId)?.isActive })
                })
            });

            if (res.ok) {
                resetForm();
                fetchRecurring();
                alert(editingId ? "Recurring expense updated!" : "Recurring expense created!");
            }
        } catch (error) {
            alert("Failed to save recurring expense");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (rec: RecurringExpense) => {
        setEditingId(rec.id);
        setTitle(rec.title);
        setAmount(rec.amount.toString());
        setCategory(rec.category);
        setNote(rec.note || "");
        setDayOfMonth(rec.dayOfMonth);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleActive = async (id: number, currentActive: boolean) => {
        try {
            const rec = recurring.find(r => r.id === id);
            if (!rec) return;

            const res = await fetch(`/api/recurring-expenses/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...rec,
                    isActive: !currentActive
                })
            });

            if (res.ok) {
                fetchRecurring();
            }
        } catch (error) {
            alert("Failed to toggle status");
        }
    };

    const handleDelete = async () => {
        if (!deleteTargetId) return;
        setDeleting(true);

        try {
            const res = await fetch(`/api/recurring-expenses/${deleteTargetId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                fetchRecurring();
                setDeleteModalOpen(false);
                setDeleteTargetId(null);
                alert("Recurring expense deleted!");
            }
        } catch (error) {
            alert("Failed to delete");
        } finally {
            setDeleting(false);
        }
    };

    const openDeleteModal = (id: number) => {
        setDeleteTargetId(id);
        setDeleteModalOpen(true);
    };

    const getNextCreationDate = (dayOfMonth: number) => {
        const today = new Date();
        const nextMonth = today.getDate() >= dayOfMonth ? addMonths(today, 1) : today;
        return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(dayOfMonth, 28));
    };

    const totalMonthly = recurring.filter(r => r.isActive).reduce((sum, r) => sum + r.amount, 0);

    return (
        <div className="space-y-8 pb-10">
            {/* Enhanced Header with Gradient */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl p-8 shadow-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <button
                                onClick={() => window.location.href = '/expenses'}
                                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg text-white font-medium border border-white/30"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 12H5" />
                                    <path d="M12 19l-7-7 7-7" />
                                </svg>
                                Back to Expenses
                            </button>
                        </div>
                        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg">🔁 Recurring Expenses</h2>
                        <p className="text-pink-100 mt-2 text-lg">Manage expense templates that auto-create monthly.</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/30 shadow-lg">
                        <p className="text-sm font-bold text-white/90 uppercase tracking-wider">Monthly Total</p>
                        <p className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">฿{totalMonthly.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Enhanced Form Section */}
                <div className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-2xl border-2 border-purple-200 shadow-xl h-fit">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                            {editingId ? <Edit className="text-blue-600" size={22} /> : <Plus className="text-purple-600" size={22} />}
                            {editingId ? "✏️ Edit Template" : "➕ New Template"}
                        </h3>
                        {editingId && (
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 transition hover:bg-gray-100 rounded-lg p-1">
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="e.g. Monthly Internet Bill"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Day of Month</label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    max={28}
                                    value={dayOfMonth}
                                    onChange={e => setDayOfMonth(parseInt(e.target.value))}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="Maintenance">Maintenance</option>
                                <option value="Utilities">Utilities</option>
                                <option value="Salary">Salary</option>
                                <option value="Supplies">Supplies</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none h-20"
                                placeholder="Additional details..."
                            />
                        </div>

                        <div className="bg-purple-50 p-3 rounded-lg text-sm text-purple-700">
                            <Calendar className="inline mr-2" size={16} />
                            This expense will be created automatically on day <strong>{dayOfMonth}</strong> of each month.
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    {editingId ? "Updating..." : "Saving..."}
                                </>
                            ) : (
                                <>
                                    {editingId ? <Check size={20} /> : <Save size={20} />}
                                    {editingId ? "Update Template" : "Save Template"}
                                </>
                            )}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="w-full bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-300 transition-all"
                            >
                                Cancel
                            </button>
                        )}
                    </form>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">Expense Templates</h3>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-gray-500 flex justify-center">
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {recurring.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    No recurring expenses yet. Create one to get started!
                                </div>
                            ) : (
                                recurring.map((rec) => (
                                    <div
                                        key={rec.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors ${!rec.isActive ? 'opacity-60' : ''}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-bold text-gray-900">{rec.title}</h4>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold 
                                                        ${rec.category === 'Maintenance' ? 'bg-orange-100 text-orange-700' :
                                                            rec.category === 'Utilities' ? 'bg-blue-100 text-blue-700' :
                                                                rec.category === 'Salary' ? 'bg-green-100 text-green-700' :
                                                                    'bg-gray-100 text-gray-700'}`}>
                                                        {rec.category}
                                                    </span>
                                                    {rec.isActive ? (
                                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1">
                                                            <Power size={12} />
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-600 flex items-center gap-1">
                                                            <PowerOff size={12} />
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        Day {rec.dayOfMonth} of month
                                                    </div>
                                                    <div className="font-bold text-red-600">
                                                        ฿{rec.amount.toLocaleString()}
                                                    </div>
                                                </div>

                                                {rec.note && (
                                                    <p className="text-xs text-gray-500 mb-2">{rec.note}</p>
                                                )}

                                                {rec.isActive && (
                                                    <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded inline-block">
                                                        Next creation: {format(getNextCreationDate(rec.dayOfMonth), 'dd MMM yyyy')}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 ml-4">
                                                <button
                                                    onClick={() => toggleActive(rec.id, rec.isActive)}
                                                    className={`p-1.5 rounded transition ${rec.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                                                    title={rec.isActive ? "Deactivate" : "Activate"}
                                                >
                                                    {rec.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(rec)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(rec.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Template?</h3>
                        <p className="text-gray-600 mb-6">This will only delete the template. Previously created expenses will not be affected.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setDeleteTargetId(null);
                                }}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
