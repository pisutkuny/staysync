"use client";

import { TrendingUp } from "lucide-react";
import RevenueChart from "@/app/components/RevenueChart";
import { RevenueChartData } from "@/lib/data/dashboard";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function RevenueChartSection({ data }: { data: RevenueChartData[] }) {
    const { t } = useLanguage();

    return (
        <div className="lg:col-span-2 bg-gradient-to-br from-white to-indigo-50 p-4 md:p-6 rounded-2xl border-2 border-indigo-200 shadow-xl">
            <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
                <TrendingUp className="text-indigo-600" size={22} />
                {t.dashboard.revenueTrend}
            </h3>
            <RevenueChart data={data} />
        </div>
    );
}
