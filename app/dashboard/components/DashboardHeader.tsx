"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

interface DashboardHeaderProps {
    dormName: string;
    outstanding: number;
}

export default function DashboardHeader({ dormName, outstanding }: DashboardHeaderProps) {
    const { t } = useLanguage();

    return (
        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 rounded-2xl p-8 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg">
                        👋 {t.dashboard.welcomeTo} {dormName}
                    </h2>
                    <p className="text-cyan-100 mt-2 text-lg">{t.dashboard.realtimeOverview}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/30 shadow-lg w-full md:w-auto text-center md:text-right">
                    <p className="text-sm font-bold text-white/90 uppercase tracking-wider">{t.dashboard.outstandingBalance}</p>
                    <p className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">฿{outstanding.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}
