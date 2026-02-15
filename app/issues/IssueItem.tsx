"use client";

import { CheckCircle2, Loader2, AlertTriangle, CloudRain, Zap, Wifi, HelpCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useModal } from "@/app/context/ModalContext";

export default function IssueItem({ issue }: { issue: any }) {
    const { t } = useLanguage();
    const router = useRouter();
    const { showAlert, showConfirm } = useModal();
    const [loading, setLoading] = useState(false);

    const handleMarkDone = async () => {
        const confirmed = await showConfirm("Confirm", t.issues.confirmMarkDone, true);
        if (!confirmed) return;

        setLoading(true);

        try {
            const res = await fetch(`/api/issues/${issue.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Done" }),
            });

            if (!res.ok) throw new Error("Failed");

            router.refresh();
        } catch (error) {
            showAlert("Error", "Failed to update status", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
            <div className="space-y-1">
                <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg uppercase border-2 border-slate-200 flex items-center gap-1">
                        {issue.category === 'Water' && <CloudRain size={12} />}
                        {issue.category === 'Electric' && <Zap size={12} />}
                        {issue.category === 'Internet' && <Wifi size={12} />}
                        {issue.category === 'Other' && <HelpCircle size={12} />}
                        {issue.category}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">
                        {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <p className="text-slate-900 font-bold text-lg mb-1">{issue.description}</p>
                {issue.photo && (
                    <div className="mb-2 mt-2">
                        <a href={issue.photo} target="_blank" rel="noopener noreferrer">
                            <img src={issue.photo} alt="Issue" className="w-full h-32 object-cover rounded-lg border-2 border-slate-200 hover:opacity-90 transition-opacity" />
                        </a>
                    </div>
                )}
                <p className="text-sm text-slate-600">
                    {t.issues.reportedBy} <span className="font-bold text-indigo-700">{issue.resident?.fullName}</span> ({t.issues.room} <span className="font-bold text-slate-900">{issue.resident?.room?.number || "N/A"}</span>)
                </p>
            </div>

            <div className="flex gap-2">
                {issue.status === "Done" ? (
                    <span className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-bold border-2 border-emerald-200">
                        <CheckCircle2 size={18} />
                        {t.issues.resolved}
                    </span>
                ) : (
                    <button
                        onClick={handleMarkDone}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold transition-all disabled:opacity-50 border-2 border-transparent hover:border-emerald-800 shadow-sm"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                        {t.issues.markDone}
                    </button>
                )}
            </div>
        </div>
    );
}
