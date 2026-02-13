"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
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
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
                <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg uppercase">
                        {issue.category}
                    </span>
                    <span className="text-xs text-gray-400">
                        {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <p className="text-gray-900 font-medium mb-1">{issue.description}</p>
                {issue.photo && (
                    <div className="mb-2 mt-2">
                        <a href={issue.photo} target="_blank" rel="noopener noreferrer">
                            <img src={issue.photo} alt="Issue" className="w-full h-32 object-cover rounded-lg border border-gray-100 hover:opacity-90 transition-opacity" />
                        </a>
                    </div>
                )}
                <p className="text-sm text-gray-600">
                    {t.issues.reportedBy} <span className="font-medium text-indigo-600">{issue.resident?.fullName}</span> ({t.issues.room} {issue.resident?.room?.number || "N/A"})
                </p>
            </div>

            <div className="flex gap-2">
                {issue.status === "Done" ? (
                    <span className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-bold border border-green-200">
                        <CheckCircle2 size={18} />
                        {t.issues.resolved}
                    </span>
                ) : (
                    <button
                        onClick={handleMarkDone}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                        {t.issues.markDone}
                    </button>
                )}
            </div>
        </div>
    );
}
