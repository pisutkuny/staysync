"use client";

import { useState, useEffect, use } from "react";
import { Loader2, LogOut, ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ResidentData {
    id: number;
    fullName: string;
    deposit: number;
    contractStartDate: string;
    contractEndDate: string;
    contractDurationMonths: number;
    room: { number: string };
}

export default function CheckOutPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [resident, setResident] = useState<ResidentData | null>(null);
    const [depositReturn, setDepositReturn] = useState(0);
    const [depositForfeitReason, setDepositForfeitReason] = useState("");

    useEffect(() => {
        fetchResident();
    }, []);

    const fetchResident = async () => {
        try {
            const res = await fetch(`/api/residents/${id}`);
            const data = await res.json();
            setResident(data);
            setDepositReturn(data.deposit); // Default: full return
        } catch (error) {
            alert("Error loading resident data");
        }
    };

    const isEarlyCheckout = () => {
        if (!resident) return false;
        const today = new Date();
        const endDate = new Date(resident.contractEndDate);
        const graceDays = 3;
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > graceDays;
    };

    const getDaysRemaining = () => {
        if (!resident) return 0;
        const today = new Date();
        const endDate = new Date(resident.contractEndDate);
        const diffTime = endDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const early = isEarlyCheckout();

        try {
            const res = await fetch(`/api/residents/${id}/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    depositStatus: early ? "Forfeited" : "Returned",
                    depositReturnedAmount: early ? 0 : depositReturn,
                    depositForfeitReason: early ? depositForfeitReason || "Early checkout per rental agreement" : null
                }),
            });

            if (!res.ok) throw new Error("Checkout failed");

            alert(`✅ Check-out Complete!\\n${early ? "Deposit Forfeited" : `Deposit Returned: ${depositReturn.toLocaleString()} THB`}`);
            router.push("/rooms");
            router.refresh();
        } catch (error) {
            alert("Error processing check-out.");
        } finally {
            setLoading(false);
        }
    };

    if (!resident) return <div className="p-8">Loading...</div>;

    const earlyCheckout = isEarlyCheckout();
    const daysRemaining = getDaysRemaining();

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/residents/${id}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-xl md:text-3xl font-bold text-gray-900">Check Out Resident</h1>
                    <p className="text-gray-500">{resident.fullName} • Room {resident.room.number}</p>
                </div>
            </div>

            {/* Contract Info */}
            <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl border-2 border-blue-200 shadow-lg">
                <h3 className="text-lg font-bold mb-4">📋 Contract Information</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Start Date</p>
                        <p className="font-bold">{new Date(resident.contractStartDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">End Date</p>
                        <p className="font-bold">{new Date(resident.contractEndDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-bold">{resident.contractDurationMonths} months</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Days Until End</p>
                        <p className={`font-bold text-lg ${daysRemaining > 0 ? "text-blue-600" : "text-red-600"}`}>
                            {daysRemaining > 0 ? `${daysRemaining} days` : "Expired"}
                        </p>
                    </div>
                </div>

                {/* Early Checkout Warning */}
                {earlyCheckout && (
                    <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="text-red-600 mt-0.5" size={20} />
                        <div>
                            <p className="font-bold text-red-700">⚠️ Early Checkout Detected</p>
                            <p className="text-sm text-red-600 mt-1">
                                Checking out {daysRemaining} days before contract end. Deposit will be forfeited per rental agreement.
                            </p>
                        </div>
                    </div>
                )}

                {/* On-time Checkout */}
                {!earlyCheckout && (
                    <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-start gap-3">
                        <CheckCircle className="text-green-600 mt-0.5" size={20} />
                        <div>
                            <p className="font-bold text-green-700">✅ Contract Completed</p>
                            <p className="text-sm text-green-600 mt-1">
                                Full deposit will be returned (adjustable for damages/cleaning).
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Deposit Handling */}
            <form onSubmit={handleSubmit} className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-2xl border-2 border-purple-200 shadow-lg space-y-4">
                <h3 className="text-lg font-bold">💰 Deposit: {resident.deposit.toLocaleString()} THB</h3>

                {earlyCheckout ? (
                    <>
                        <p className="text-red-600 font-bold">Status: Will be Forfeited (฿0 returned)</p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for Forfeit (for records)
                            </label>
                            <textarea
                                value={depositForfeitReason}
                                onChange={(e) => setDepositForfeitReason(e.target.value)}
                                placeholder="Early checkout per rental agreement..."
                                className="w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                rows={3}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-green-600 font-bold">Status: Will be Returned</p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Amount to Return (Deduct for damages/unpaid bills)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max={resident.deposit}
                                step="0.01"
                                value={depositReturn}
                                onChange={(e) => setDepositReturn(parseFloat(e.target.value))}
                                className="w-full p-3 border-2 border-purple-300 rounded-xl text-lg font-bold focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Max: {resident.deposit.toLocaleString()} THB
                            </p>
                        </div>
                    </>
                )}

                <div className="pt-4 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <LogOut size={20} />}
                        {loading ? "Processing..." : "Confirm Check Out"}
                    </button>
                </div>
            </form>
        </div>
    );
}
