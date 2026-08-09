"use client";

import { AlertCircle } from "lucide-react";
import OccupancyChart from "@/app/components/OccupancyChart";
import { OccupancyChartData } from "@/lib/data/dashboard";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function OccupancySection({ data }: { data: OccupancyChartData[] }) {
    const { t } = useLanguage();

    return (
        <div className="bg-white p-6 rounded-2xl border-2 border-teal-200 shadow-xl flex flex-col">
            <h3 className="text-lg font-extrabold text-teal-950 mb-6 flex items-center gap-2">
                <AlertCircle className="text-teal-700" size={22} />
                {t.dashboard.roomStatus}
            </h3>
            <div className="flex-1 flex items-center justify-center">
                <OccupancyChart data={data} />
            </div>
        </div>
    );
}
