"use client";

import { useState } from "react";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function AddRoomPage() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [formData, setFormData] = useState({
        number: "",
        price: "",
        defaultContractDuration: 12,
        defaultDeposit: 0
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    number: formData.number,
                    price: Number(formData.price),
                    defaultContractDuration: formData.defaultContractDuration,
                    defaultDeposit: formData.defaultDeposit
                }),
            });

            if (!res.ok) throw new Error("Failed");

            alert(t.rooms.addSuccess);
            router.push("/dashboard"); // Redirect back to dashboard
            router.refresh(); // Refresh data
        } catch (error) {
            alert(t.rooms.addError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-white" />
                </Link>
                <div>
                    <h2 className="text-xl md:text-3xl font-bold tracking-tight text-white">{t.rooms.addNewRoom}</h2>
                    <p className="text-gray-300 mt-2">{t.rooms.createRoomDesc}</p>
                </div>
            </div>

            <div className="max-w-md bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.rooms.roomNumber}</label>
                        <input
                            required
                            type="text"
                            value={formData.number}
                            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                            placeholder="e.g. 104"
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.rooms.priceThbMonth}</label>
                        <input
                            required
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="e.g. 3500"
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t.residents.contractDuration} ({t.residents.months})</label>
                            <input
                                type="number"
                                value={formData.defaultContractDuration}
                                onChange={(e) => setFormData({ ...formData, defaultContractDuration: parseInt(e.target.value) || 0 })}
                                placeholder="12"
                                className="w-full rounded-lg border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t.residents.deposit} (฿)</label>
                            <input
                                type="number"
                                value={formData.defaultDeposit}
                                onChange={(e) => setFormData({ ...formData, defaultDeposit: parseFloat(e.target.value) || 0 })}
                                placeholder="0"
                                className="w-full rounded-lg border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        {t.rooms.saveRoom}
                    </button>
                </form>
            </div>
        </div>
    );
}
