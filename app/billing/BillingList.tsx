"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, ExternalLink, Loader2, Bell, Banknote, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useModal } from "@/app/context/ModalContext";

type Bill = {
    id: number;
    room: { number: string };
    resident?: { fullName: string };
    totalAmount: number;
    paymentStatus: string;
    slipImage: string | null;
    paymentDate: Date | null;
    createdAt: Date;
};

export default function BillingList({ initialBills }: { initialBills: any[] }) {
    const { t } = useLanguage();
    const { showAlert, showConfirm } = useModal();
    const [bills, setBills] = useState<Bill[]>(initialBills);
    const [loading, setLoading] = useState<number | null>(null);
    const [reminderLoading, setReminderLoading] = useState(false);
    const [selectedSlip, setSelectedSlip] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState("");

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
        const confirmed = await showConfirm(
            t.status.Paid,
            t.billing.confirmCash,
            true
        );
        if (!confirmed) return;

        setLoading(id);
        try {
            const res = await fetch(`/api/billing/${id}/pay-cash`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: 1 }), // Default to admin for now
            });
            const data = await res.json();

            if (res.ok) {
                // Update local state
                setBills(bills.map(b => b.id === id ? { ...b, paymentStatus: "Paid" } : b));
                showAlert("Success", `✅ ${t.billing.cashSuccess}`, "success");
            } else {
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
            const data = await res.json();

            if (res.ok) {
                setBills(bills.filter((b) => b.id !== id));
                showAlert("Success", `✅ ${t.billing.deleteSuccess}`, "success");
            } else {
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

            const result = await res.json();

            // Update UI locally
            const newStatus = result.status;
            setBills(bills.map(b => b.id === id ? { ...b, paymentStatus: newStatus } : b));

            showAlert(action === "approve" ? "Success" : "Rejected", action === "approve" ? `✅ ${t.billing.approveSuccess}` : `❌ ${t.billing.rejectSuccess}`, action === "approve" ? "success" : "info");
        } catch (error: any) {
            showAlert("Error", `เกิดข้อผิดพลาด: ${error.message}`, "error");
        } finally {
            setLoading(null);
            if (action === "reject") {
                setRejectingId(null);
                setRejectReason("");
            }
        }
    };

    // Helper to get Status Color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20';
            case 'Pending': return 'bg-amber-100 text-amber-700 ring-1 ring-amber-600/20';
            case 'Overdue': return 'bg-rose-100 text-rose-700 ring-1 ring-rose-600/20';
            case 'Review': return 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20';
            case 'Rejected': return 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20';
            default: return 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20';
        }
    };

    return (
        <>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">{t.billing.recent}</h3>
                        <p className="text-sm text-gray-500">Manage your latest transactions</p>
                    </div>
                    <button
                        onClick={handleSendReminders}
                        disabled={reminderLoading}
                        className="px-4 py-2 bg-rose-600 text-white rounded-lg font-semibold text-sm shadow-sm hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2 transition-all hover:shadow-md"
                    >
                        {reminderLoading ? <Loader2 className="animate-spin" size={16} /> : <Bell size={16} />}
                        {t.billing.sendReminder}
                    </button>
                </div>

                {/* Mobile View: Cards */}
                <div className="md:hidden divide-y divide-gray-100">
                    {bills.map((bill) => (
                        <div key={bill.id} className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg">{t.billing.room} {bill.room.number}</h4>
                                    {bill.resident && <p className="text-xs text-gray-500">{bill.resident.fullName}</p>}
                                    <p className="text-xs text-gray-400 mt-1">{new Date(bill.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 ${getStatusColor(bill.paymentStatus)}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                                    {bill.paymentStatus}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <p className="font-bold text-xl text-gray-900">฿{bill.totalAmount.toLocaleString()}</p>
                                <div className="flex gap-2">
                                    {bill.slipImage ? (
                                        <button
                                            onClick={() => setSelectedSlip(bill.slipImage)}
                                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 text-sm font-medium flex items-center gap-2"
                                        >
                                            <ExternalLink size={14} /> Slip
                                        </button>
                                    ) : bill.paymentStatus === 'Paid' ? (
                                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 text-sm font-medium flex items-center gap-2">
                                            <Banknote size={14} /> Cash
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            {/* Action Buttons Row */}
                            <div className="pt-2 flex flex-wrap gap-2">
                                <a href={`/billing/${bill.id}/print?type=a4`} target="_blank"
                                    className="flex-1 py-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors">
                                    <span>🖨️</span> {t.billing.print}
                                </a>

                                {(bill.paymentStatus === "Pending" || bill.paymentStatus === "Overdue" || bill.paymentStatus === "Late") && (
                                    <button
                                        onClick={() => handleCashPayment(bill.id)}
                                        disabled={loading === bill.id}
                                        className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-sm transition-colors"
                                    >
                                        {loading === bill.id ? <Loader2 className="animate-spin" size={16} /> : <Banknote size={16} />}
                                        {t.billing.payCash}
                                    </button>
                                )}

                                {bill.paymentStatus === "Review" && (
                                    <>
                                        <button
                                            onClick={() => handleReview(bill.id, "approve")}
                                            disabled={loading === bill.id}
                                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700"
                                        >
                                            {loading === bill.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Approve
                                        </button>
                                        <button
                                            onClick={() => setRejectingId(bill.id)}
                                            disabled={loading === bill.id}
                                            className="flex-1 py-2 bg-white text-rose-600 border border-rose-200 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-50"
                                        >
                                            <XCircle size={16} /> Reject
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={() => handleDelete(bill.id)}
                                    disabled={loading === bill.id}
                                    className="px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                >
                                    {loading === bill.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                </button>
                            </div>
                        </div>
                    ))}
                    {bills.length === 0 && (
                        <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">🧾</div>
                            <p>{t.billing.noBills}</p>
                        </div>
                    )}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider text-xs border-b border-gray-200">
                            <tr>
                                <th className="p-5 font-semibold text-gray-600">{t.billing.room}</th>
                                <th className="p-5 font-semibold text-gray-600">Date</th>
                                <th className="p-5 font-semibold text-gray-600">{t.billing.total}</th>
                                <th className="p-5 font-semibold text-gray-600">{t.billing.status}</th>
                                <th className="p-5 font-semibold text-gray-600">{t.billing.slip}</th>
                                <th className="p-5 font-semibold text-gray-600 text-right">{t.billing.action}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bills.map((bill) => (
                                <tr key={bill.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="p-5">
                                        <div className="font-bold text-gray-900 text-base">{t.billing.room} {bill.room.number}</div>
                                        {bill.resident && <div className="text-xs text-gray-500 mt-0.5">{bill.resident.fullName}</div>}
                                    </td>
                                    <td className="p-5 text-gray-500 font-medium whitespace-nowrap">
                                        {new Date(bill.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="p-5 font-bold text-gray-900 text-base">฿{bill.totalAmount.toLocaleString()}</td>
                                    <td className="p-5">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase shadow-sm ${getStatusColor(bill.paymentStatus)}`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                                            {bill.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        {bill.slipImage ? (
                                            <button
                                                onClick={() => setSelectedSlip(bill.slipImage)}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 rounded-md font-medium text-xs transition-colors ring-1 ring-indigo-600/10"
                                            >
                                                <ExternalLink size={12} /> {t.billing.viewSlip}
                                            </button>
                                        ) : bill.paymentStatus === 'Paid' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md font-medium text-xs ring-1 ring-emerald-600/10">
                                                <Banknote size={12} /> {t.billing.cash}
                                            </span>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                            {bill.paymentStatus === "Review" && (
                                                <>
                                                    <button
                                                        onClick={() => handleReview(bill.id, "approve")}
                                                        disabled={loading === bill.id}
                                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors shadow-sm" title={t.billing.approve}>
                                                        {loading === bill.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectingId(bill.id)}
                                                        disabled={loading === bill.id}
                                                        className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-colors shadow-sm" title={t.billing.reject}>
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}

                                            {/* Cash Payment Button - Only for unpaid bills */}
                                            {(bill.paymentStatus === "Pending" || bill.paymentStatus === "Overdue" || bill.paymentStatus === "Late") && (
                                                <button
                                                    onClick={() => handleCashPayment(bill.id)}
                                                    disabled={loading === bill.id}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-sm font-semibold transition-all shadow-sm"
                                                    title={t.billing.payCash}
                                                >
                                                    {loading === bill.id ? <Loader2 className="animate-spin" size={16} /> : <Banknote size={16} />}
                                                    <span className="hidden xl:inline">{t.billing.payCash}</span>
                                                </button>
                                            )}

                                            <a href={`/billing/${bill.id}/print?type=a4`} target="_blank"
                                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                title={t.billing.print}>
                                                <span className="text-xl">🖨️</span>
                                            </a>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleDelete(bill.id)}
                                                disabled={loading === bill.id}
                                                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title={t.billing.deleteBill}
                                            >
                                                {loading === bill.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {bills.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-3xl grayscale opacity-50">🧾</span>
                                            <p>{t.billing.noBills}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
                        <div className="p-4 border-t bg-white flex justify-end">
                            <a
                                href={selectedSlip}
                                download="payment-slip.png"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <span>⬇️</span> Download Image
                            </a>
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
                            placeholder="Enter reason for rejection..."
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
                                Reject Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
