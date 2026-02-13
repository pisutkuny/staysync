"use client";

import { useState, useEffect } from "react";
import { Loader2, UserCheck, UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useModal } from "@/app/context/ModalContext";


interface CheckInFormProps {
    roomId: string;
    roomNumber: string;
    roomPrice: number;
    isOccupied: boolean;
    defaultContractDuration: number;
    defaultDeposit: number;
}

export default function CheckInForm({ roomId, roomNumber, roomPrice, isOccupied, defaultContractDuration, defaultDeposit }: CheckInFormProps) {
    const { t } = useLanguage();
    const { showAlert } = useModal();
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        lineUserId: "",
        isChild: false,
        contractDurationMonths: defaultContractDuration, // Use default from room
        customDuration: "",
        deposit: defaultDeposit // Use default from room
    });

    // Calculate contract end date
    const calculateEndDate = () => {
        const duration = formData.contractDurationMonths;
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
                    isChild: formData.isChild, // Explicitly include isChild
                    contractStartDate: new Date().toISOString()
                }),
            });

            if (!res.ok) throw new Error("Failed");

            showAlert(
                isOccupied ? t.residents.addSuccess : t.residents.checkInSuccess,
                t.residents.checkInSuccessDesc || "Operation completed successfully.",
                "success",
                () => {
                    router.push("/rooms");
                    router.refresh();
                }
            );
        } catch (error) {
            showAlert(t.common.error, t.residents.errorProcessing, "error");
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
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
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isChild"
                            checked={formData.isChild}
                            onChange={(e) => setFormData({ ...formData, isChild: e.target.checked })}
                            className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                        />
                        <label htmlFor="isChild" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                            👶 {t.common?.residentsUnder18 || "Resident is under 18 (Child)"}
                        </label>
                    </div>

                    {/* Contract Duration (Read Only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">📅 {t.residents.contractDuration}</label>
                        <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-gray-600">
                            {formData.contractDurationMonths} {t.residents.months}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">* Set in Room Settings</p>
                    </div>

                    {/* Contract End Date Display */}
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-gray-600 mb-1">{t.residents.contractEndDateAuto}</p>
                        <p className="text-lg font-bold text-indigo-700">{calculateEndDate()}</p>
                    </div>

                    {/* Deposit (Read Only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">💰 {t.residents.deposit}</label>
                        <div className="w-full rounded-lg border-2 border-purple-100 bg-purple-50 p-3 text-lg font-bold text-purple-700">
                            ฿{formData.deposit.toLocaleString()}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">* Set in Room Settings</p>
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
