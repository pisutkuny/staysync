"use client";

import { AlertCircle } from "lucide-react";
import OccupancyChart from "@/app/components/OccupancyChart";
import { OccupancyChartData } from "@/lib/data/dashboard";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function OccupancySection({ data }: { data: OccupancyChartData[] }) {
    const { t } = useLanguage();

    return (
        <div className="bg-gradient-to-br from-white to-teal-50 p-6 rounded-2xl border-2 border-teal-200 shadow-xl flex flex-col">
            <h3 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
                <AlertCircle className="text-teal-600" size={22} />
                {t.dashboard.roomStatus}
            </h3>
            <div className="flex-1 flex items-center justify-center">
                <OccupancyChart data={data} />
            </div>
        </div>
    );
}
