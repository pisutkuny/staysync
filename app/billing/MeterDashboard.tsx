"use client";

import { useState, useMemo } from "react";
import { Search, Calendar, CheckCircle2, AlertCircle, ArrowRight, Loader2, Bell, Banknote, Trash2, ExternalLink, XCircle, Clock, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useModal } from "@/app/context/ModalContext";
import Link from "next/link";

import BillDetailsModal from "./BillDetailsModal";

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
    month?: string | Date;
    // Added for breakdown
    waterMeterLast: number;
    waterMeterCurrent: number;
    waterRate: number;
    electricMeterLast: number;
    electricMeterCurrent: number;
    electricRate: number;
    internetFee: number;
    trashFee: number;
    otherFees: number;
    commonWaterFee: number;
    commonElectricFee: number;
    commonInternetFee: number;
    commonTrashFee: number;
    room?: { price: number; number: string };
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
    const [selectedBill, setSelectedBill] = useState<BillData | null>(null);
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
                // Priority: Use 'month' field if available (correct logic), otherwise fallback to 'createdAt' (legacy)
                const targetDate = b.month ? b.month : b.createdAt;
                const billDate = new Date(targetDate);
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

            {/* Grid Layout */}
            <div className="p-6 overflow-y-auto h-[calc(100vh-280px)] min-h-[500px] bg-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredRooms.map((room) => {
                        const bill = room.bill;
                        const status = bill ? (bill.paymentStatus || bill.status || 'Pending') : 'No Bill';
                        const isOccupied = room.status === 'Occupied';

                        // Dynamic Font Size Logic
                        const titleSize = room.number.length > 15 ? 'text-2xl' :
                            room.number.length > 8 ? 'text-3xl' :
                                'text-4xl';

                        // Accessibility & Color Config: Distinct Zones & High Contrast
                        // Gone with "All Gray" -> Now using "Distinct Colored Zones"
                        const statusColor =
                            status === 'Paid' ? 'border-emerald-500 ring-1 ring-emerald-200' :
                                status === 'Pending' ? 'border-amber-400 ring-1 ring-amber-200' :
                                    status === 'Overdue' ? 'border-rose-500 ring-1 ring-rose-200' :
                                        'border-slate-300';

                        const headerBg =
                            status === 'Paid' ? 'bg-emerald-100 border-b-emerald-200' :
                                status === 'Pending' ? 'bg-amber-100 border-b-amber-200' :
                                    status === 'Overdue' ? 'bg-rose-100 border-b-rose-200' :
                                        'bg-slate-100 border-b-slate-200';

                        const cardBg = 'bg-white';

                        const badgeStyle =
                            status === 'Paid' ? 'bg-emerald-600 text-white border-emerald-700' :
                                status === 'Pending' ? 'bg-amber-500 text-white border-amber-600' :
                                    status === 'Overdue' ? 'bg-rose-600 text-white border-rose-700' :
                                        'bg-slate-600 text-white border-slate-700';

                        return (
                            <div
                                key={room.id}
                                className={`relative group flex flex-col rounded-xl shadow-md border-x-2 border-b-2 border-t-[8px] overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${statusColor}`}
                            >
                                {/* Header: Distinct Color Zone */}
                                <div className={`p-4 flex justify-between items-start border-b border-black/5 ${headerBg}`}>
                                    <div className="flex-1 mr-2">
                                        <div className="flex flex-col">
                                            <span className={`${titleSize} font-black text-slate-900 tracking-tight leading-tight break-words`}>
                                                {room.number}
                                            </span>
                                            {isOccupied && (
                                                <span className="inline-block mt-1 w-fit px-2 py-0.5 rounded-full bg-slate-900/10 text-slate-900 text-[10px] font-bold uppercase tracking-wider">
                                                    Occupied
                                                </span>
                                            )}
                                        </div>
                                        {!isOccupied && (
                                            <div className="mt-1 text-xs font-bold text-slate-600 uppercase tracking-widest">
                                                Vacant Unit
                                            </div>
                                        )}
                                    </div>
                                    {bill && (
                                        <div className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide shadow-sm border flex items-center gap-1.5 ${badgeStyle}`}>
                                            {status === 'Paid' && <CheckCircle2 size={12} strokeWidth={3} />}
                                            {status === 'Pending' && <Clock size={12} strokeWidth={3} />}
                                            {status === 'Overdue' && <AlertTriangle size={12} strokeWidth={3} />}
                                            {status === 'Rejected' && <XCircle size={12} strokeWidth={3} />}
                                            {status}
                                        </div>
                                    )}
                                </div>

                                {/* Body: Light Tinted Zone */}
                                <div className={`p-5 flex-grow flex flex-col gap-6 ${cardBg}`}>
                                    {/* Resident Block */}
                                    <div className="flex items-center gap-4 p-4 bg-white/60 rounded-xl border border-black/5 shadow-sm">
                                        <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                                            {room.residents[0] ? (
                                                <img
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(room.residents[0].fullName)}&backgroundColor=e5e7eb`}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-2xl">👤</span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-base font-bold text-slate-900 truncate">
                                                {room.residents[0]?.fullName || <span className="text-slate-500 italic">No Resident</span>}
                                            </p>
                                            <p className="text-xs text-slate-600 truncate font-bold uppercase">
                                                Primary Resident
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-auto px-1">
                                        <div className="flex justify-between items-end mb-1">
                                            <p className="text-xs text-slate-600 uppercase tracking-wider font-extrabold">Total Bill</p>
                                            {bill && (
                                                <button
                                                    onClick={() => setSelectedBill(bill)}
                                                    className="text-xs text-indigo-700 font-bold cursor-pointer hover:underline hover:text-indigo-800 transition-colors"
                                                >
                                                    See Breakdown
                                                </button>
                                            )}
                                        </div>
                                        <div className={`text-5xl font-black tracking-tighter ${bill ? 'text-slate-900' : 'text-slate-400'}`}>
                                            {bill ? `฿${bill.totalAmount.toLocaleString()}` : '---'}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer: Actions (Darker Tint) */}
                                <div className={`p-4 border-t border-black/10 flex gap-3 rounded-b-lg ${headerBg} bg-opacity-50`}>
                                    {bill ? (
                                        <>
                                            {/* Primary Action */}
                                            {(status === "Pending" || status === "Overdue" || status === "Late") ? (
                                                <button
                                                    onClick={() => handleCashPayment(bill.id)}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-lg text-sm font-bold shadow-md hover:bg-black transition-all active:scale-95"
                                                >
                                                    <Banknote size={18} /> Pay Cash
                                                </button>
                                            ) : status === "Review" ? (
                                                <button
                                                    onClick={() => handleReview(bill.id, "approve")}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-800 text-white py-3 rounded-lg text-sm font-bold shadow-md hover:bg-blue-900 transition-all active:scale-95"
                                                >
                                                    <CheckCircle2 size={18} /> Approve
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => bill.slipImage && setSelectedSlip(bill.slipImage)}
                                                    disabled={!bill.slipImage}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-black/10 text-slate-800 py-3 rounded-lg text-sm font-bold shadow-sm hover:bg-white/80 transition-all disabled:opacity-50"
                                                >
                                                    <ExternalLink size={18} /> View Slip
                                                </button>
                                            )}

                                            {/* Secondary Actions Menu */}
                                            <div className="flex gap-2">
                                                <a
                                                    href={`/billing/${bill.id}/print?type=a4`}
                                                    target="_blank"
                                                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-white border-2 border-black/10 text-slate-700 hover:text-indigo-900 hover:border-indigo-500 transition-colors shadow-sm"
                                                    title="Print"
                                                >
                                                    <span className="text-xl">🖨️</span>
                                                </a>

                                                {status === "Review" && (
                                                    <button
                                                        onClick={() => setRejectingId(bill.id)}
                                                        className="w-12 h-12 flex items-center justify-center rounded-lg bg-white border-2 border-black/10 text-rose-600 hover:text-rose-900 hover:border-rose-500 transition-colors shadow-sm"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={22} />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => handleDelete(bill.id)}
                                                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-white border-2 border-black/10 text-slate-500 hover:text-rose-600 hover:border-rose-500 transition-colors shadow-sm"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={22} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <Link
                                            href={`/billing/bulk?month=${selectedMonth}`}
                                            className="w-full flex items-center justify-center gap-2 bg-indigo-800 text-white py-3 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-900 transition-all active:scale-95"
                                        >
                                            Create Bill <ArrowRight size={18} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredRooms.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <Search size={48} className="mb-4 opacity-20" />
                        <span className="text-lg font-medium">No rooms found matching "{filter}"</span>
                    </div>
                )}
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

            {selectedBill && (
                <BillDetailsModal
                    bill={selectedBill}
                    onClose={() => setSelectedBill(null)}
                />
            )}
        </div>
    );
}
