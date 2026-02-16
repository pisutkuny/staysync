"use client";

import { Wallet, Users, BadgeAlert, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { DashboardSummary } from "@/lib/data/dashboard";

export default function SummaryCards({ summary }: { summary: DashboardSummary }) {
    const { t } = useLanguage();

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Revenue */}
            <Link href="/billing">
                <div className="p-6 bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-lg border-2 border-green-200 flex items-center justify-between hover:shadow-xl hover:scale-105 transition-all cursor-pointer h-full group">
                    <div>
                        <p className="text-sm font-medium text-gray-600">{t.dashboard.revenue}</p>
                        <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mt-2">฿{summary.revenue.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                        <Wallet size={28} />
                    </div>
                </div>
            </Link>

            {/* Occupancy */}
            <Link href="/rooms">
                <div className="p-6 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border-2 border-blue-200 flex items-center justify-between hover:shadow-xl hover:scale-105 transition-all cursor-pointer h-full group">
                    <div>
                        <p className="text-sm font-medium text-gray-600">{t.dashboard.occupancyRate}</p>
                        <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mt-2">{summary.occupancyRate}%</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                        <Users size={28} />
                    </div>
                </div>
            </Link>

            {/* Active Issues */}
            <Link href="/admin/issues">
                <div className="p-6 bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-lg border-2 border-orange-200 flex items-center justify-between hover:shadow-xl hover:scale-105 transition-all cursor-pointer h-full group">
                    <div>
                        <p className="text-sm font-medium text-gray-600">{t.dashboard.activeRepair}</p>
                        <p className="text-2xl md:text-3xl font-bold text-orange-600 mt-2">{summary.activeIssues}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                        <BadgeAlert size={28} />
                    </div>
                </div>
            </Link>

            {/* Expenses */}
            <Link href="/expenses">
                <div className="p-6 bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-lg border-2 border-purple-200 flex items-center justify-between hover:shadow-xl hover:scale-105 transition-all cursor-pointer h-full group">
                    <div>
                        <p className="text-sm font-medium text-gray-600">{t.dashboard.manageExpenses}</p>
                        <p className="text-2xl md:text-3xl font-bold text-purple-600 mt-2">฿{summary.expenses.toLocaleString()}</p>
                        <p className="text-xs text-purple-400 mt-1">{t.dashboard.viewDetails} →</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                        <TrendingUp size={28} className="rotate-180" />
                    </div>
                </div>
            </Link>
        </div>
    );
}
