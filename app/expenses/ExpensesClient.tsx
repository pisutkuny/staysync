"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Save, Trash2, Edit, FileText, Loader2, X, Upload, Eye, Check, Search, Filter, Download, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import imageCompression from 'browser-image-compression';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useModal } from "@/app/context/ModalContext";

type Expense = {
    id: number;
    title: string;
    amount: number;
    category: string;
    date: string;
    note: string | null;
    receiptUrl?: string | null;
    receiptFileId?: string | null;
};

type PaginationInfo = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

interface ExpensesClientProps {
    initialExpenses: Expense[];
    initialPagination: PaginationInfo;
}

export default function ExpensesClient({ initialExpenses, initialPagination }: ExpensesClientProps) {
    const { t } = useLanguage();
    const { showAlert } = useModal();
    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const isMount = useRef(true);

    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [pagination, setPagination] = useState<PaginationInfo>(initialPagination);

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

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
    const [compressing, setCompressing] = useState(false);
    const [originalSize, setOriginalSize] = useState(0);
    const [compressedSize, setCompressedSize] = useState(0);

    // Delete modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(searchQuery && { search: searchQuery }),
                ...(categoryFilter && { category: categoryFilter }),
                ...(dateFrom && { dateFrom }),
                ...(dateTo && { dateTo })
            });

            const res = await fetch(`/api/expenses?${params}`);
            const data = await res.json();

            if (data.expenses) {
                setExpenses(data.expenses);
                setPagination(data.pagination);
            } else {
                setExpenses(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isMount.current) {
            isMount.current = false;
            return;
        }
        fetchExpenses();
    }, [page, limit, searchQuery, categoryFilter, dateFrom, dateTo]);

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
        setOriginalSize(0);
        setCompressedSize(0);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setOriginalSize(file.size);
            setCompressing(true);

            try {
                // Compress image
                const options = {
                    maxSizeMB: 0.5,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true
                };

                const compressedFile = await imageCompression(file, options);
                setCompressedSize(compressedFile.size);
                setReceiptFile(compressedFile);

                // Preview
                const reader = new FileReader();
                reader.onloadend = () => {
                    setReceiptPreview(reader.result as string);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Compression error:', error);
                setReceiptFile(file);
                setCompressedSize(file.size);

                const reader = new FileReader();
                reader.onloadend = () => {
                    setReceiptPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } finally {
                setCompressing(false);
            }
        }
    };

    const uploadReceiptToGoogleDrive = async (file: File, expenseId?: number): Promise<{ webViewLink: string, fileId: string } | null> => {
        try {
            setUploadingReceipt(true);
            const scriptUrl = process.env.NEXT_PUBLIC_EXPENSE_RECEIPT_SCRIPT_URL;

            if (!scriptUrl) {
                showAlert("Warning", "Expense receipt upload not configured", "warning");
                return null;
            }

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
            showAlert("Error", "Failed to upload receipt", "error");
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

            if (receiptFile) {
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
                showAlert("Success", editingId ? t.expenses.saveSuccess : t.expenses.saveSuccess, "success");
            }
        } catch (error) {
            showAlert("Error", "Failed to save expense", "error");
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
                if (data.receiptFileId) {
                    await deleteReceiptFromDrive(data.receiptFileId);
                }

                fetchExpenses();
                setDeleteModalOpen(false);
                setDeleteTargetId(null);
                showAlert("Success", t.expenses.deleteSuccess, "success");
            }
        } catch (error) {
            showAlert("Error", "Failed to delete expense", "error");
        } finally {
            setDeleting(false);
        }
    };

    const openDeleteModal = (id: number) => {
        setDeleteTargetId(id);
        setDeleteModalOpen(true);
    };

    const clearFilters = () => {
        setSearchQuery("");
        setCategoryFilter("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    const exportToExcel = () => {
        const data = expenses.map(e => ({
            'Date': format(new Date(e.date), 'dd/MM/yyyy'),
            'Title': e.title,
            'Category': e.category,
            'Amount': e.amount,
            'Note': e.note || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
        XLSX.utils.sheet_add_aoa(worksheet, [
            ['', '', 'TOTAL:', total, '']
        ], { origin: -1 });

        XLSX.writeFile(workbook, `expenses_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Expense Report', 14, 20);
        doc.setFontSize(11);
        doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

        const tableData = expenses.map(e => [
            format(new Date(e.date), 'dd/MM/yyyy'),
            e.title,
            e.category,
            `${e.amount.toLocaleString()}`
        ]);

        const total = expenses.reduce((sum, e) => sum + e.amount, 0);

        autoTable(doc, {
            head: [['Date', 'Title', 'Category', 'Amount']],
            body: tableData,
            startY: 40,
            foot: [['', '', 'TOTAL:', total.toLocaleString()]],
            theme: 'grid'
        });

        doc.save(`expenses_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

    const totalStats = expenses.reduce((sum: number, ex) => sum + ex.amount, 0);

    return (
        <div className="space-y-8 pb-10">
            {/* Enhanced Header with Gradient */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg">💰 {t.expenses.title}</h2>
                        <p className="text-indigo-100 mt-2 text-sm md:text-base">{t.expenses.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => window.location.href = '/expenses/recurring'}
                            className="bg-white text-purple-700 px-4 py-2.5 rounded-lg font-bold hover:bg-indigo-50 transition-all shadow-md hover:shadow-lg flex items-center gap-2 border border-white/30 text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                                <path d="M21 3v5h-5" />
                            </svg>
                            {t.expenses.recurring}
                        </button>
                        <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-xl border border-white/30 shadow-lg">
                            <p className="text-xs font-bold text-white/90 uppercase tracking-wider">{t.expenses.totalExpenses}</p>
                            <p className="text-xl md:text-2xl font-bold text-white drop-shadow-md">฿{totalStats.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Search & Filter Bar */}
            <div className="bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-indigo-400" size={20} />
                            <input
                                type="text"
                                placeholder={`🔍 ${t.expenses.search}`}
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-11 w-full p-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            />
                        </div>
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => {
                            setCategoryFilter(e.target.value);
                            setPage(1);
                        }}
                        className="p-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
                    >
                        <option value="">📁 {t.expenses.allCats}</option>
                        <option value="Maintenance">🔧 {t.expenses.catMaint}</option>
                        <option value="Utilities">⚡ {t.expenses.catUtil}</option>
                        <option value="Salary">💼 {t.expenses.catSalary}</option>
                        <option value="Supplies">📦 {t.expenses.catSupply}</option>
                        <option value="Other">📝 {t.expenses.catOther}</option>
                    </select>
                    <div className="flex gap-2">
                        {(searchQuery || categoryFilter || dateFrom || dateTo) && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
                            >
                                <X size={16} />
                                {t.expenses.clear}
                            </button>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={exportToExcel}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                title="Export to Excel"
                            >
                                <FileSpreadsheet size={16} />
                            </button>
                            <button
                                onClick={exportToPDF}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                                title="Export to PDF"
                            >
                                <FileText size={16} />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">{t.expenses.fromDate}</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => {
                                setDateFrom(e.target.value);
                                setPage(1);
                            }}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">{t.expenses.toDate}</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => {
                                setDateTo(e.target.value);
                                setPage(1);
                            }}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Enhanced Form Section */}
                <div className="bg-gradient-to-br from-white to-indigo-50 p-6 rounded-2xl border-2 border-indigo-200 shadow-xl h-fit">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                            {editingId ? <Edit className="text-blue-600" size={22} /> : <Plus className="text-indigo-600" size={22} />}
                            {editingId ? `✏️ ${t.expenses.edit}` : `➕ ${t.expenses.add}`}
                        </h3>
                        {editingId && (
                            <button
                                onClick={resetForm}
                                className="text-gray-400 hover:text-gray-600 transition hover:bg-gray-100 rounded-lg p-1"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.expenses.titleLabel}</label>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.expenses.amountLabel}</label>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.expenses.dateLabel}</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.expenses.catLabel}</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="Maintenance">{t.expenses.catMaint}</option>
                                <option value="Utilities">{t.expenses.catUtil}</option>
                                <option value="Salary">{t.expenses.catSalary}</option>
                                <option value="Supplies">{t.expenses.catSupply}</option>
                                <option value="Other">{t.expenses.catOther}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.expenses.noteLabel}</label>
                            <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20"
                                placeholder="Additional details..."
                            />
                        </div>

                        {/* Receipt Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.expenses.receiptLabel}</label>

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

                            {receiptPreview && (
                                <div className="mb-2 relative">
                                    <img
                                        src={receiptPreview}
                                        alt="New receipt"
                                        className="w-full h-32 object-cover rounded-lg border border-blue-300"
                                    />
                                    {compressing && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                                            <Loader2 className="animate-spin text-white" size={24} />
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReceiptFile(null);
                                            setReceiptPreview("");
                                            setOriginalSize(0);
                                            setCompressedSize(0);
                                        }}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            {compressedSize > 0 && (
                                <div className="mb-2 text-xs text-gray-600 bg-green-50 p-2 rounded">
                                    ✓ Compressed: {(originalSize / 1024).toFixed(0)}KB → {(compressedSize / 1024).toFixed(0)}KB
                                    ({(((originalSize - compressedSize) / originalSize) * 100).toFixed(0)}% smaller)
                                </div>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={compressing}
                                className="w-full p-2 border rounded-lg text-sm disabled:opacity-50"
                            />
                            <p className="text-xs text-gray-500 mt-1">{t.expenses.mobileCam}</p>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || uploadingReceipt || compressing}
                            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting || uploadingReceipt ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    {uploadingReceipt ? t.expenses.uploading : editingId ? t.expenses.update : t.expenses.save}
                                </>
                            ) : (
                                <>
                                    {editingId ? <Check size={20} /> : <Save size={20} />}
                                    {editingId ? t.expenses.update : t.expenses.save}
                                </>
                            )}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="w-full bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-300 transition-all"
                            >
                                {t.expenses.cancel}
                            </button>
                        )}
                    </form>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900">{t.expenses.recent}</h3>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(parseInt(e.target.value));
                                setPage(1);
                            }}
                            className="p-2 border rounded-lg text-sm"
                        >
                            <option value={10}>10 per page</option>
                            <option value={20}>20 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                        </select>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-gray-500 flex justify-center">
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-medium">
                                        <tr>
                                            <th className="px-2 py-3 sm:p-4">{t.expenses.dateLabel}</th>
                                            <th className="px-2 py-3 sm:p-4">{t.expenses.titleLabel}</th>
                                            <th className="px-2 py-3 sm:p-4">{t.expenses.catLabel}</th>
                                            <th className="px-2 py-3 sm:p-4 text-right">{t.expenses.amountLabel}</th>
                                            <th className="px-2 py-3 sm:p-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {expenses.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-gray-400">
                                                    {t.expenses.noExpenses}
                                                </td>
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
                                                                {t.expenses.viewReceipt}
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

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} expenses
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                            <ChevronLeft size={16} />
                                            Previous
                                        </button>
                                        <span className="text-sm text-gray-600">
                                            Page {page} of {pagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                            disabled={page === pagination.totalPages}
                                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                            Next
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
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

