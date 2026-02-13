"use client";

import { useState, useEffect } from "react";
import { Loader2, UserCheck, UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import SuccessModal from "@/app/components/SuccessModal";

interface CheckInFormProps {
    roomId: string;
    roomNumber: string;
    roomPrice: number;
    isOccupied: boolean;
}

export default function CheckInForm({ roomId, roomNumber, roomPrice, isOccupied }: CheckInFormProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        lineUserId: "",
        contractDurationMonths: 12,
        customDuration: "",
        deposit: roomPrice
    });

    // Calculate contract end date
    const calculateEndDate = () => {
        const duration = formData.contractDurationMonths === 0
            ? parseInt(formData.customDuration) || 0
            : formData.contractDurationMonths;

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + duration);
        return endDate.toISOString().split('T')[0];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/rooms/${roomId}/checkin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    contractStartDate: new Date().toISOString()
                }),
            });

            if (!res.ok) throw new Error("Failed");

            setShowSuccess(true);
        } catch (error) {
            alert(t.residents.errorProcessing);
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccess(false);
        router.push("/rooms");
        router.refresh();
    };

    return (
        <div className="space-y-6">
            <SuccessModal
                isOpen={showSuccess}
                onClose={handleSuccessClose}
                title={isOccupied ? t.residents.addSuccess : t.residents.checkInSuccess}
                message={t.residents.checkInSuccessDesc || "Operation completed successfully."}
                actionLabel={t.common?.ok || "OK"}
                onAction={handleSuccessClose}
            />

            <div className="flex items-center gap-4">
                <Link href="/rooms" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-white" />
                </Link>
                <div>
                    <h2 className="text-xl md:text-3xl font-bold tracking-tight text-white">
                        {isOccupied ? t.residents.addResident : t.residents.checkInTitle}
                    </h2>
                    <p className="text-gray-300 mt-2">
                        {isOccupied
                            ? `${t.residents.addResidentDesc} ${roomNumber}.`
                            : `${t.residents.checkInDesc} ${roomNumber}.`
                        }
                    </p>
                </div>
            </div>

            <div className="max-w-md bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.residents.fullName}</label>
                        <input
                            required
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="John Doe"
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">📞 {t.residents.phone}</label>
                        <input
                            required
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="081XXXXXXX"
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Contract Duration */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">📅 {t.residents.contractDuration}</label>
                        <select
                            value={formData.contractDurationMonths}
                            onChange={(e) => setFormData({ ...formData, contractDurationMonths: parseInt(e.target.value) })}
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value={6}>{t.residents.months6}</option>
                            <option value={12}>{t.residents.months12}</option>
                            <option value={24}>{t.residents.months24}</option>
                            <option value={0}>{t.residents.customDuration}</option>
                        </select>
                    </div>

                    {/* Custom Duration Input */}
                    {formData.contractDurationMonths === 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t.residents.customMonthsLabel}</label>
                            <input
                                required
                                type="number"
                                min="1"
                                max="36"
                                value={formData.customDuration}
                                onChange={(e) => setFormData({ ...formData, customDuration: e.target.value })}
                                placeholder={t.residents.enterMonthsPlaceholder}
                                className="w-full rounded-lg border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    )}

                    {/* Contract End Date Display */}
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-gray-600 mb-1">{t.residents.contractEndDateAuto}</p>
                        <p className="text-lg font-bold text-indigo-700">{calculateEndDate()}</p>
                    </div>

                    {/* Deposit */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">💰 {t.residents.deposit}</label>
                        <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.deposit}
                            onChange={(e) => setFormData({ ...formData, deposit: parseFloat(e.target.value) })}
                            className="w-full rounded-lg border-2 border-purple-300 p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg font-bold"
                        />
                        <p className="text-xs text-gray-500 mt-1">💡 {t.residents.depositDefault.replace('1 Month Rent', `${roomPrice.toLocaleString()} THB`)}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">💬 {t.residents.lineUserIdOptional}</label>
                        <input
                            type="text"
                            value={formData.lineUserId}
                            onChange={(e) => setFormData({ ...formData, lineUserId: e.target.value })}
                            placeholder="U1234..."
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">{t.residents.lineUserIdDesc}</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full mt-4 text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${isOccupied
                            ? "bg-indigo-600 hover:bg-indigo-700"
                            : "bg-green-600 hover:bg-green-700"
                            }`}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isOccupied ? <UserPlus size={20} /> : <UserCheck size={20} />)}
                        {isOccupied ? t.residents.addResident : t.residents.confirmCheckIn}
                    </button>
                </form>
            </div>
        </div>
    );
}
