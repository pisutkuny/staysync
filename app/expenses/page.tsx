"use client";

import { useState, useEffect } from "react";
import { Plus, Save, Trash2, Calendar, DollarSign, Tag, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";

type Expense = {
    id: number;
    title: string;
    amount: number;
    category: string;
    date: string;
    note: string;
};

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Maintenance");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState("");

    const fetchExpenses = async () => {
        try {
            const res = await fetch("/api/expenses");
            const data = await res.json();
            setExpenses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    amount,
                    category,
                    date,
                    note
                })
            });

            if (res.ok) {
                // Reset form
                setTitle("");
                setAmount("");
                setNote("");
                fetchExpenses(); // Reload list
            }
        } catch (error) {
            alert("Failed to save expense");
        } finally {
            setSubmitting(false);
        }
    };

    const totalStats = expenses.reduce((sum: number, ex) => sum + ex.amount, 0);

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Expense Tracking</h2>
                    <p className="text-gray-500 mt-2">Record and monitor operating expenses.</p>
                </div>
                <div className="bg-red-50 px-6 py-3 rounded-xl border border-red-100">
                    <p className="text-sm font-bold text-red-600 uppercase">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-700">฿{totalStats.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-fit">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Plus className="text-indigo-600" size={20} />
                        Add New Expense
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="pl-10 w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. Fix Aircon Room 101"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <input
                                        type="number"
                                        required
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="pl-10 w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20"
                                placeholder="Additional details..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Save Record
                        </button>
                    </form>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-gray-500 flex justify-center">
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-medium">
                                    <tr>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Title</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {expenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-gray-400">No expenses recorded yet.</td>
                                        </tr>
                                    ) : (
                                        expenses.map((expense) => (
                                            <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4 text-gray-500">
                                                    {format(new Date(expense.date), "dd MMM yyyy")}
                                                </td>
                                                <td className="p-4 font-medium text-gray-900">
                                                    {expense.title}
                                                    {expense.note && <div className="text-xs text-gray-400 font-normal">{expense.note}</div>}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold 
                                                        ${expense.category === 'Maintenance' ? 'bg-orange-100 text-orange-700' :
                                                            expense.category === 'Utilities' ? 'bg-blue-100 text-blue-700' :
                                                                expense.category === 'Salary' ? 'bg-green-100 text-green-700' :
                                                                    'bg-gray-100 text-gray-700'}`}>
                                                        {expense.category}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-bold text-red-600">
                                                    -฿{expense.amount.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
