"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import IssueItem from "./IssueItem";
import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function IssuesPage() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const status = searchParams.get("status");
    const currentStatus = status || "Pending";

    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/issues?status=${currentStatus}`)
            .then(res => res.json())
            .then(data => {
                setIssues(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [currentStatus]);

    return (
        <div className="space-y-8">
            {/* Enhanced Gradient Header */}
            <div className="bg-gradient-to-r from-red-600 via-pink-600 to-rose-600 rounded-2xl p-8 shadow-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg">
                            🔧 {currentStatus === "Pending" ? t.issues.pendingTitle : t.issues.historyTitle}
                        </h2>
                        <p className="text-pink-100 mt-2 text-lg">
                            {currentStatus === "Pending" ? t.issues.pendingDesc : t.issues.historyDesc}
                        </p>
                    </div>
                    <Link href="/report" className="bg-white text-red-700 px-6 py-3 rounded-xl font-bold hover:bg-red-50 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 whitespace-nowrap border-2 border-white/30 hover:scale-105">
                        ➕ {t.issues.newIssue}
                    </Link>
                </div>
            </div>

            {/* Enhanced Tabs */}
            <div className="flex space-x-2 bg-gradient-to-r from-gray-100 to-gray-200 p-1.5 rounded-2xl w-fit shadow-md">
                <Link
                    href="/issues?status=Pending"
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${currentStatus === "Pending"
                        ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                        }`}
                >
                    🔴 {t.issues.tabPending}
                </Link>
                <Link
                    href="/issues?status=Done"
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${currentStatus === "Done"
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                        }`}
                >
                    ✅ {t.issues.tabHistory}
                </Link>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12">
                        <Loader2 className="animate-spin h-8 w-8 mx-auto text-gray-400" />
                        <p className="text-gray-500 mt-2">{t.issues.loading}</p>
                    </div>
                ) : issues.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">{t.issues.noIssues}</p>
                    </div>
                ) : (
                    issues.map((issue: any) => (
                        <IssueItem key={issue.id} issue={issue} />
                    ))
                )}
            </div>
        </div>
    );
}
