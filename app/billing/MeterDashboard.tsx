"use client";

import { useState, useMemo } from "react";
import { Search, Calendar, CheckCircle2, AlertCircle, ArrowRight, Loader2, Bell, Banknote, Trash2, ExternalLink, XCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useModal } from "@/app/context/ModalContext";
import Link from "next/link";

type RoomData = {
    id: number;
    number: string;
    status: string;
    residents: { fullName: string }[];
};

type BillData = {
    id: number;
    roomId: number;
    totalAmount: number;
    createdAt: string | Date;
    status: string; // 'Pending', 'Paid', 'Overdue', 'Review', 'Rejected', 'Late'
    slipImage?: string | null;
    paymentStatus?: string; // Sometimes used interchangeably with status in your codebase
};

export default function MeterDashboard({ rooms, bills }: { rooms: RoomData[], bills: BillData[] }) {
    const { t } = useLanguage();
    const { showAlert, showConfirm } = useModal();
    const [filter, setFilter] = useState("");

    // Default to current month YYYY-MM
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return now.toISOString().slice(0, 7);
    });

    const [statusFilter, setStatusFilter] = useState<'all' | 'billed' | 'pending'>('all');

    // Billing Actions State
    const [loading, setLoading] = useState<number | null>(null);
    const [reminderLoading, setReminderLoading] = useState(false);
    const [selectedSlip, setSelectedSlip] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    // --- Helper Functions from BillingList ---

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20';
            case 'Pending': return 'bg-amber-100 text-amber-700 ring-1 ring-amber-600/20';
            case 'Overdue': return 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20';
            case 'Late': return 'bg-orange-100 text-orange-700 ring-1 ring-orange-600/20';
            case 'Review': return 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20';
            case 'Rejected': return 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20';
            default: return 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20';
        }
    };

    const handleSendReminders = async () => {
        const confirmed = await showConfirm("Confirm", t.billing.confirmRemind, true);
        if (!confirmed) return;

        setReminderLoading(true);
        try {
            const res = await fetch("/api/notify/overdue", { method: "POST" });
            const data = await res.json();

            if (res.ok) {
                showAlert("Success", `✅ ${t.billing.remindSuccess} \n- Overdue: ${data.overdueCount}\n- Sent: ${data.sentCount}`, "success");
            } else {
                showAlert("Error", `❌ ${t.billing.remindError}: ${data.error}`, "error");
            }
        } catch (error) {
            showAlert("Error", "❌ Network Error", "error");
        } finally {
            setReminderLoading(false);
        }
    };

    const handleCashPayment = async (id: number) => {
        const confirmed = await showConfirm(t.status.Paid, t.billing.confirmCash, true);
        if (!confirmed) return;

        setLoading(id);
        try {
            const res = await fetch(`/api/billing/${id}/pay-cash`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: 1 }),
            });

            if (res.ok) {
                showAlert("Success", `✅ ${t.billing.cashSuccess}`, "success");
                window.location.reload(); // Refresh to update status
            } else {
                const data = await res.json();
                showAlert("Error", `❌ ${data.error}`, "error");
            }
        } catch (error) {
            showAlert("Error", "❌ Network Error", "error");
        } finally {
            setLoading(null);
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = await showConfirm("Delete", t.billing.confirmDelete, true);
        if (!confirmed) return;

        setLoading(id);
        try {
            const res = await fetch(`/api/billing/${id}`, { method: "DELETE" });

            if (res.ok) {
                showAlert("Success", `✅ ${t.billing.deleteSuccess}`, "success");
                window.location.reload();
            } else {
                const data = await res.json();
                showAlert("Error", `❌ ${data.error}`, "error");
            }
        } catch (error) {
            showAlert("Error", "❌ Network Error", "error");
        } finally {
            setLoading(null);
        }
    };

    const handleReview = async (id: number, action: "approve" | "reject", note?: string) => {
        setLoading(id);
        try {
            const res = await fetch(`/api/billing/${id}/review-slip`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, note, userId: 1 }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to review");
            }

            showAlert("Success", action === "approve" ? `✅ ${t.billing.approveSuccess}` : `❌ ${t.billing.rejectSuccess}`, "success");
            window.location.reload();

        } catch (error: any) {
            showAlert("Error", `Error: ${error.message}`, "error");
        } finally {
            setLoading(null);
            if (action === "reject") {
                setRejectingId(null);
                setRejectReason("");
            }
        }
    };

    // --- Data Processing ---

    // Calculate Status
    const roomStatus = useMemo(() => {
        return rooms.map(room => {
            // Find bill for this room in selected month
            // Ensure bills is an array before finding
            const safeBills = Array.isArray(bills) ? bills : [];
            const bill = safeBills.find(b => {
                const billDate = new Date(b.createdAt);
                const billMonth = billDate.toISOString().slice(0, 7);
                return b.roomId === room.id && billMonth === selectedMonth;
            });

            return {
                ...room,
                bill,
                isBilled: !!bill
            };
        });
    }, [rooms, bills, selectedMonth]);

    // Calculate Stats
    const stats = useMemo(() => {
        const total = roomStatus.length;
        const billed = roomStatus.filter(r => r.isBilled).length;
        const pending = total - billed;
        return { total, billed, pending };
    }, [roomStatus]);

    // Filtered List
    const filteredRooms = roomStatus.filter(r => {
        const matchesSearch = r.number.includes(filter) ||
            r.residents[0]?.fullName?.toLowerCase().includes(filter.toLowerCase());

        if (!matchesSearch) return false;

        if (statusFilter === 'billed') return r.isBilled;
        if (statusFilter === 'pending') return !r.isBilled;
        return true;
    });

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header & Controls */}
            <div className="p-6 border-b border-gray-100 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            📊 {t.meterDashboard?.title || "Billing Overview"}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {t.meterDashboard?.subtitle || "Manage monthly bills and payments"}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleSendReminders}
                            disabled={reminderLoading}
                            className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-sm font-medium transition-colors"
                        >
                            {reminderLoading ? <Loader2 className="animate-spin" size={14} /> : <Bell size={14} />}
                            {t.billing.sendReminder}
                        </button>

                        <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                            <Calendar size={16} className="text-gray-500 ml-2" />
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`p-4 rounded-xl border transition-all text-left group ${statusFilter === 'all' ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200 bg-white'
                            }`}
                    >
                        <div className="text-sm text-gray-500 font-medium mb-1">Total Rooms</div>
                        <div className="text-3xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {stats.total}
                        </div>
                    </button>

                    <button
                        onClick={() => setStatusFilter('billed')}
                        className={`p-4 rounded-xl border transition-all text-left group ${statusFilter === 'billed' ? 'ring-2 ring-green-500 border-green-500 bg-green-50' : 'border-gray-100 hover:border-green-200 bg-white'
                            }`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="text-sm text-green-600 font-medium mb-1">Billed</div>
                            <CheckCircle2 size={18} className="text-green-500" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">
                            {stats.billed}
                            <span className="text-sm font-normal text-green-600 ml-2">
                                ({stats.total > 0 ? Math.round((stats.billed / stats.total) * 100) : 0}%)
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={() => setStatusFilter('pending')}
                        className={`p-4 rounded-xl border transition-all text-left group ${statusFilter === 'pending' ? 'ring-2 ring-red-500 border-red-500 bg-red-50' : 'border-gray-100 hover:border-red-200 bg-white'
                            }`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="text-sm text-red-600 font-medium mb-1">Pending Bill</div>
                            <AlertCircle size={18} className="text-red-500" />
                        </div>
                        <div className="text-3xl font-bold text-red-700">
                            {stats.pending}
                            <span className="text-sm font-normal text-red-600 ml-2">
                                ({stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%)
                            </span>
                        </div>
                    </button>
                </div>

                {/* Filter & Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder={t.meterDashboard?.searchPlaceholder || "Search room..."}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50"
                    />
                </div>
            </div>

            {/* List */}
            <div className="max-h-[600px] overflow-y-auto px-6 pb-6">
                <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead className="bg-transparent text-gray-500 text-xs uppercase font-semibold tracking-wider sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 w-32">Room</th>
                            <th className="px-4 py-3">Resident</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Reference</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="">
                        {filteredRooms.map((room) => {
                            const bill = room.bill;
                            const status = bill ? (bill.paymentStatus || bill.status || 'Pending') : 'No Bill';

                            return (
                                <tr key={room.id} className="group transition-all hover:bg-indigo-50/30">
                                    {/* Room Info */}
                                    <td className="p-4 rounded-l-xl border-y border-l border-transparent group-hover:border-indigo-100 group-hover:shadow-sm">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-bold text-gray-900 leading-tight">{room.number}</span>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded w-fit mt-1 ${room.status === 'Occupied' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {room.status}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Resident */}
                                    <td className="p-4 border-y border-transparent group-hover:border-indigo-100 group-hover:shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm">
                                                {room.residents[0]?.fullName.charAt(0) || "?"}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 text-sm">
                                                    {room.residents[0]?.fullName || <span className="text-gray-400 italic">Vacant</span>}
                                                </span>
                                                <span className="text-xs text-gray-400">Resident</span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Amount */}
                                    <td className="p-4 border-y border-transparent group-hover:border-indigo-100 group-hover:shadow-sm">
                                        <div className="flex flex-col items-start">
                                            <span className={`text-base font-bold font-mono ${bill ? 'text-gray-900' : 'text-gray-300'}`}>
                                                {bill ? `฿${bill.totalAmount.toLocaleString()}` : '-'}
                                            </span>
                                            {bill && <span className="text-xs text-gray-400">Total</span>}
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="p-4 text-center border-y border-transparent group-hover:border-indigo-100 group-hover:shadow-sm">
                                        {bill ? (
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${status === 'Paid' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10' :
                                                status === 'Pending' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10' :
                                                    status === 'Overdue' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/10' :
                                                        'bg-gray-50 text-gray-700 ring-1 ring-gray-600/10'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full ${status === 'Paid' ? 'bg-emerald-500' :
                                                    status === 'Pending' ? 'bg-amber-500' :
                                                        status === 'Overdue' ? 'bg-rose-500' :
                                                            'bg-gray-500'
                                                    }`}></span>
                                                {status}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400 font-medium">Wait for Bill</span>
                                        )}
                                    </td>

                                    {/* Slip */}
                                    <td className="p-4 text-center border-y border-transparent group-hover:border-indigo-100 group-hover:shadow-sm">
                                        {bill?.slipImage ? (
                                            <button
                                                onClick={() => setSelectedSlip(bill.slipImage!)}
                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline flex items-center justify-center gap-1"
                                            >
                                                <ExternalLink size={14} /> View Slip
                                            </button>
                                        ) : (status === 'Paid') ? (
                                            <span className="text-xs font-medium text-emerald-600 flex items-center justify-center gap-1">
                                                <Banknote size={14} /> Cash
                                            </span>
                                        ) : (
                                            <span className="text-gray-300 text-xs">-</span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="p-4 text-right rounded-r-xl border-y border-r border-transparent group-hover:border-indigo-100 group-hover:shadow-sm">
                                        <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            {bill ? (
                                                <>
                                                    {/* Review Actions */}
                                                    {status === "Review" && (
                                                        <>
                                                            <button
                                                                onClick={() => handleReview(bill.id, "approve")}
                                                                disabled={loading === bill.id}
                                                                className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200" title={t.billing.approve}>
                                                                <CheckCircle2 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => setRejectingId(bill.id)}
                                                                disabled={loading === bill.id}
                                                                className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200" title={t.billing.reject}>
                                                                <XCircle size={18} />
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Actions Default */}
                                                    {(status === "Pending" || status === "Overdue" || status === "Late") && (
                                                        <button
                                                            onClick={() => handleCashPayment(bill.id)}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                            title={t.billing.payCash}
                                                        >
                                                            <Banknote size={18} />
                                                        </button>
                                                    )}

                                                    <a href={`/billing/${bill.id}/print?type=a4`} target="_blank"
                                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                        title={t.billing.print}>
                                                        <span className="text-xl leading-none">🖨️</span>
                                                    </a>

                                                    <button
                                                        onClick={() => handleDelete(bill.id)}
                                                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                        title={t.billing.deleteBill}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <Link
                                                    href={`/billing/bulk?month=${selectedMonth}`}
                                                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm"
                                                >
                                                    Create
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {filteredRooms.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-gray-400 italic">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search size={32} className="opacity-20" />
                                        <span>No rooms found matching "{filter}"</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Slip Preview Modal */}
            {selectedSlip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedSlip(null)}
                >
                    <div className="relative bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900">Payment Slip Reference</h3>
                            <button
                                onClick={() => setSelectedSlip(null)}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="p-2 bg-gray-100 flex justify-center items-center min-h-[300px]">
                            <img
                                src={selectedSlip}
                                alt="Payment Slip"
                                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Reason Modal */}
            {rejectingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">{t.billing.rejectReason}</h3>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none h-32 resize-none transition-all"
                            placeholder="Enter reason..."
                            autoFocus
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setRejectingId(null);
                                    setRejectReason("");
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleReview(rejectingId, "reject", rejectReason)}
                                disabled={!rejectReason.trim()}
                                className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
