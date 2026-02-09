"use client";

import { useState, useEffect } from "react";
import { Plus, Save, Trash2, Edit, FileText, Loader2, X, Upload, Eye, Check } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

type Expense = {
    id: number;
    title: string;
    amount: number;
    category: string;
    date: string;
    note: string;
    receiptUrl?: string | null;
    receiptFileId?: string | null;
};

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Maintenance");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState("");
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string>("");
    const [existingReceiptUrl, setExistingReceiptUrl] = useState<string>("");
    const [existingReceiptFileId, setExistingReceiptFileId] = useState<string>("");
    const [uploadingReceipt, setUploadingReceipt] = useState(false);

    // Delete modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

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

    const resetForm = () => {
        setEditingId(null);
        setTitle("");
        setAmount("");
        setCategory("Maintenance");
        setDate(new Date().toISOString().split('T')[0]);
        setNote("");
        setReceiptFile(null);
        setReceiptPreview("");
        setExistingReceiptUrl("");
        setExistingReceiptFileId("");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setReceiptFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadReceiptToGoogleDrive = async (file: File, expenseId?: number): Promise<{ webViewLink: string, fileId: string } | null> => {
        try {
            setUploadingReceipt(true);
            const scriptUrl = process.env.NEXT_PUBLIC_EXPENSE_RECEIPT_SCRIPT_URL;

            if (!scriptUrl) {
                alert("Expense receipt upload not configured");
                return null;
            }

            // Convert to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onloadend = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    resolve(base64);
                };
                reader.readAsDataURL(file);
            });

            const base64Data = await base64Promise;

            const response = await fetch(scriptUrl, {
                method: 'POST',
                body: JSON.stringify({
                    fileName: file.name,
                    fileData: base64Data,
                    mimeType: file.type,
                    expenseId: expenseId || Date.now(),
                    uploadDate: date
                })
            });

            const result = await response.json();

            if (result.success) {
                return {
                    webViewLink: result.webViewLink,
                    fileId: result.fileId
                };
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Receipt upload error:', error);
            alert('Failed to upload receipt');
            return null;
        } finally {
            setUploadingReceipt(false);
        }
    };

    const deleteReceiptFromDrive = async (fileId: string) => {
        try {
            const scriptUrl = process.env.NEXT_PUBLIC_EXPENSE_RECEIPT_SCRIPT_URL;
            if (!scriptUrl || !fileId) return;

            await fetch(scriptUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'delete',
                    fileId: fileId
                })
            });
        } catch (error) {
            console.error('Failed to delete receipt from Drive:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            let receiptUrl = existingReceiptUrl;
            let receiptFileId = existingReceiptFileId;

            // Upload new receipt if provided
            if (receiptFile) {
                // If editing and had old receipt, delete it first
                if (editingId && existingReceiptFileId) {
                    await deleteReceiptFromDrive(existingReceiptFileId);
                }

                const uploadResult = await uploadReceiptToGoogleDrive(receiptFile, editingId || undefined);
                if (uploadResult) {
                    receiptUrl = uploadResult.webViewLink;
                    receiptFileId = uploadResult.fileId;
                }
            }

            const payload = {
                title,
                amount,
                category,
                date,
                note,
                receiptUrl,
                receiptFileId
            };

            const url = editingId ? `/api/expenses/${editingId}` : "/api/expenses";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                resetForm();
                fetchExpenses();
                alert(editingId ? "Expense updated successfully!" : "Expense added successfully!");
            }
        } catch (error) {
            alert("Failed to save expense");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (expense: Expense) => {
        setEditingId(expense.id);
        setTitle(expense.title);
        setAmount(expense.amount.toString());
        setCategory(expense.category);
        setDate(new Date(expense.date).toISOString().split('T')[0]);
        setNote(expense.note || "");
        setExistingReceiptUrl(expense.receiptUrl || "");
        setExistingReceiptFileId(expense.receiptFileId || "");
        setReceiptFile(null);
        setReceiptPreview("");

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async () => {
        if (!deleteTargetId) return;
        setDeleting(true);

        try {
            const res = await fetch(`/api/expenses/${deleteTargetId}`, {
                method: "DELETE"
            });

            const data = await res.json();

            if (res.ok) {
                // Delete receipt from Drive if exists
                if (data.receiptFileId) {
                    await deleteReceiptFromDrive(data.receiptFileId);
                }

                fetchExpenses();
                setDeleteModalOpen(false);
                setDeleteTargetId(null);
                alert("Expense deleted successfully!");
            }
        } catch (error) {
            alert("Failed to delete expense");
        } finally {
            setDeleting(false);
        }
    };

    const openDeleteModal = (id: number) => {
        setDeleteTargetId(id);
        setDeleteModalOpen(true);
    };

    const totalStats = expenses.reduce((sum: number, ex) => sum + ex.amount, 0);

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Expense Tracking</h2>
                    <p className="text-gray-500 mt-2">Record and monitor operating expenses with receipt uploads.</p>
                </div>
                <div className="bg-red-50 px-6 py-3 rounded-xl border border-red-100">
                    <p className="text-sm font-bold text-red-600 uppercase">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-700">฿{totalStats.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-fit">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            {editingId ? <Edit className="text-blue-600" size={20} /> : <Plus className="text-indigo-600" size={20} />}
                            {editingId ? "Edit Expense" : "Add New Expense"}
                        </h3>
                        {editingId && (
                            <button
                                onClick={resetForm}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

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
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="0.00"
                                />
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

                        {/* Receipt Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Image (Optional)</label>

                            {/* Existing Receipt */}
                            {existingReceiptUrl && !receiptPreview && (
                                <div className="mb-2 relative">
                                    <img
                                        src={existingReceiptUrl}
                                        alt="Existing receipt"
                                        className="w-full h-32 object-cover rounded-lg border"
                                    />
                                    <a
                                        href={existingReceiptUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-lg hover:bg-gray-100"
                                    >
                                        <Eye size={16} />
                                    </a>
                                </div>
                            )}

                            {/* New Upload Preview */}
                            {receiptPreview && (
                                <div className="mb-2 relative">
                                    <img
                                        src={receiptPreview}
                                        alt="New receipt"
                                        className="w-full h-32 object-cover rounded-lg border border-blue-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReceiptFile(null);
                                            setReceiptPreview("");
                                        }}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full p-2 border rounded-lg text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">Mobile camera supported • Max 5MB</p>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || uploadingReceipt}
                            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting || uploadingReceipt ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    {uploadingReceipt ? "Uploading..." : editingId ? "Updating..." : "Saving..."}
                                </>
                            ) : (
                                <>
                                    {editingId ? <Check size={20} /> : <Save size={20} />}
                                    {editingId ? "Update Record" : "Save Record"}
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
                                        <th className="px-2 py-3 sm:p-4">Date</th>
                                        <th className="px-2 py-3 sm:p-4">Title</th>
                                        <th className="px-2 py-3 sm:p-4">Category</th>
                                        <th className="px-2 py-3 sm:p-4 text-right">Amount</th>
                                        <th className="px-2 py-3 sm:p-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {expenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-400">No expenses recorded yet.</td>
                                        </tr>
                                    ) : (
                                        expenses.map((expense) => (
                                            <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-2 py-3 sm:p-4 text-gray-500">
                                                    {format(new Date(expense.date), "dd MMM yyyy")}
                                                </td>
                                                <td className="px-2 py-3 sm:p-4">
                                                    <div className="font-medium text-gray-900">{expense.title}</div>
                                                    {expense.note && <div className="text-xs text-gray-400 font-normal">{expense.note}</div>}
                                                    {expense.receiptUrl && (
                                                        <a
                                                            href={expense.receiptUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                                        >
                                                            <FileText size={12} />
                                                            View Receipt
                                                        </a>
                                                    )}
                                                </td>
                                                <td className="px-2 py-3 sm:p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold 
                                                        ${expense.category === 'Maintenance' ? 'bg-orange-100 text-orange-700' :
                                                            expense.category === 'Utilities' ? 'bg-blue-100 text-blue-700' :
                                                                expense.category === 'Salary' ? 'bg-green-100 text-green-700' :
                                                                    'bg-gray-100 text-gray-700'}`}>
                                                        {expense.category}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-3 sm:p-4 text-right font-bold text-red-600">
                                                    -฿{expense.amount.toLocaleString()}
                                                </td>
                                                <td className="px-2 py-3 sm:p-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(expense)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                                            title="Edit"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => openDeleteModal(expense.id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
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

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Expense?</h3>
                        <p className="text-gray-600 mb-6">This action cannot be undone. The receipt will also be deleted from Google Drive.</p>
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
