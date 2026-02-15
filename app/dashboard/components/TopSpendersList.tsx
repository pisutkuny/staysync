"use client";

import { Zap, Droplets } from "lucide-react";
import { TopSpenderItem } from "@/lib/data/dashboard";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function TopSpendersList({ topSpenders }: { topSpenders: TopSpenderItem[] }) {
    const { t } = useLanguage();

    return (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
            <div className="p-6 border-b-2 border-gray-100 bg-gradient-to-r from-yellow-50 to-white">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Zap className="text-yellow-500" size={22} />
                    {t.dashboard.topSpenders}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{t.dashboard.currentMonthBill}</p>
            </div>
            <div className="divide-y divide-gray-100">
                {topSpenders.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">-</div>
                ) : (
                    topSpenders.map((room, idx) => (
                        <div key={idx} className="p-4 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-white transition-all flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-bold bg-gradient-to-br from-yellow-400 to-orange-500 bg-clip-text text-transparent w-10">{room.room}</span>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-xs font-medium text-blue-600">
                                        <Droplets size={14} /> {room.water.toFixed(0)} {t.dashboard.unit}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-medium text-yellow-600">
                                        <Zap size={14} /> {room.electric.toFixed(0)} {t.dashboard.unit}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">฿{room.total.toLocaleString()}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
