"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, ExternalLink, Loader2 } from "lucide-react";

type Bill = {
    id: number;
    room: { number: string };
    totalAmount: number;
    paymentStatus: string;
    slipImage: string | null;
    paymentDate: Date | null;
    createdAt: Date;
};

export default function BillingList({ initialBills }: { initialBills: any[] }) {
    const [bills, setBills] = useState<Bill[]>(initialBills);
    const [loading, setLoading] = useState<number | null>(null);

    const handleStatusUpdate = async (id: number, status: string) => {
        setLoading(id);
        try {
            const res = await fetch(`/api/billing/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Failed");

            // Update UI locally
            setBills(bills.map(b => b.id === id ? { ...b, paymentStatus: status } : b));
        } catch (error) {
            alert("Error updating status.");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-900">Billing History</h3>
            </div>
            {/* Mobile View: Cards */}
            <div className="md:hidden divide-y divide-gray-100">
                {bills.map((bill) => (
                    <div key={bill.id} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-gray-900">Room {bill.room.number}</h4>
                                <p className="text-xs text-gray-500">{new Date(bill.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase
                                ${bill.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                                    bill.paymentStatus === 'Review' ? 'bg-orange-100 text-orange-700' :
                                        bill.paymentStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'}`}>
                                {bill.paymentStatus}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="font-bold text-lg text-gray-900">฿{bill.totalAmount.toLocaleString()}</p>
                            <div className="flex gap-2">
                                {bill.slipImage && (
                                    <a href={bill.slipImage} target="_blank" className="p-2 bg-gray-50 text-indigo-600 rounded-lg border border-gray-100" title="View Slip">
                                        <ExternalLink size={16} />
                                    </a>
                                )}
                                <a href={`/billing/${bill.id}/print`} target="_blank" className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100" title="Print">
                                    <span>🖨️</span>
                                </a>
                            </div>
                        </div>
                        {bill.paymentStatus === "Review" && (
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => handleStatusUpdate(bill.id, "Paid")}
                                    disabled={loading === bill.id}
                                    className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700"
                                >
                                    {loading === bill.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Approve
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(bill.id, "Rejected")}
                                    disabled={loading === bill.id}
                                    className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100"
                                >
                                    <XCircle size={16} /> Reject
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {bills.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No billing history found.</div>
                )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="p-4 font-medium">Room</th>
                            <th className="p-4 font-medium">Date</th>
                            <th className="p-4 font-medium">Amount</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Slip</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {bills.map((bill) => (
                            <tr key={bill.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 font-medium text-gray-900">Room {bill.room.number}</td>
                                <td className="p-4 text-gray-500">{new Date(bill.createdAt).toLocaleDateString()}</td>
                                <td className="p-4 font-medium text-gray-900">฿{bill.totalAmount.toLocaleString()}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase
                                        ${bill.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                                            bill.paymentStatus === 'Review' ? 'bg-orange-100 text-orange-700' :
                                                bill.paymentStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'}`}>
                                        {bill.paymentStatus}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {bill.slipImage ? (
                                        <a href={bill.slipImage} target="_blank" className="text-indigo-600 hover:underline flex items-center gap-1">
                                            <ExternalLink size={14} /> View Slip
                                        </a>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        {bill.paymentStatus === "Review" && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusUpdate(bill.id, "Paid")}
                                                    disabled={loading === bill.id}
                                                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors shadow-sm" title="Approve Payment">
                                                    {loading === bill.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(bill.id, "Rejected")}
                                                    disabled={loading === bill.id}
                                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors shadow-sm" title="Reject Payment">
                                                    <XCircle size={18} />
                                                </button>
                                            </>
                                        )}
                                        <a href={`/billing/${bill.id}/print`} target="_blank"
                                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-sm font-bold transition-all shadow-sm">
                                            <span>🖨️</span> Print Only
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {bills.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-500">No billing history found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
