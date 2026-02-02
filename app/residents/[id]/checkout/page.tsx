"use client";

import { useState, use } from "react";
import { Loader2, Calculator, LogOut, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CheckOutPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const residentId = id;
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form State
    const [finalMeter, setFinalMeter] = useState("");
    const [extraCharges, setExtraCharges] = useState("0");
    const [extraChargesNote, setExtraChargesNote] = useState("");

    // Calculation State
    const [summary, setSummary] = useState<{
        deposit: number;
        finalBill: number;
        refund: number;
    } | null>(null);

    const handleCalculate = async () => {
        if (!finalMeter) return alert("Please enter final meter reading.");

        // In a real app, we would fetch the resident's deposit and room price here.
        // For this demo, I'll mock/fetch them via an API check or just pass them.
        // Let's implement a 'dry-run' via API? Or just client-side estimation?
        // Let's do a client-side simple calc first, then real API submit.
        // But we need the Deposit amount.
        // Fetch resident data first?

        // Let's assume we fetch logic in useEffect? 
        // Or simpler: Just Submit to API and let API return the summary to confirm?
        // Let's do the "Confirm" flow.
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/residents/${residentId}/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    finalMeter: Number(finalMeter),
                    extraCharges: Number(extraCharges),
                    note: extraChargesNote
                }),
            });

            if (!res.ok) throw new Error("Checkout failed");
            const data = await res.json();

            // Show Success & Summary
            alert(`Check-out Complete!\nRefund Amount: ${data.refund} THB`);
            router.push("/rooms");
        } catch (error) {
            alert("Error processing check-out.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <Link href={`/residents/${residentId}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Check Out Resident</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 flex items-start gap-3">
                    <LogOut className="text-orange-600 mt-1" size={20} />
                    <div>
                        <h3 className="font-bold text-orange-900">Warning</h3>
                        <p className="text-sm text-orange-800">This action will remove the resident from the room and mark it as available.</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Final Meter Reading</label>
                    <input
                        type="number"
                        value={finalMeter}
                        onChange={(e) => setFinalMeter(e.target.value)}
                        required
                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white"
                        placeholder="e.g. 1250"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Extra Charges (Damages/Cleaning)</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={extraCharges}
                            onChange={(e) => setExtraCharges(e.target.value)}
                            className="w-1/3 rounded-lg border border-gray-300 p-3 text-gray-900 bg-white"
                            placeholder="0"
                        />
                        <input
                            type="text"
                            value={extraChargesNote}
                            onChange={(e) => setExtraChargesNote(e.target.value)}
                            className="w-2/3 rounded-lg border border-gray-300 p-3 text-gray-900 bg-white"
                            placeholder="Reason (e.g. Warning for broken window...)"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Confirm Check Out"}
                    </button>
                </div>
            </form>
        </div>
    );
}
