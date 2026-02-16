"use client";

import { Zap, Droplets } from "lucide-react";
import { TopSpenderItem } from "@/lib/data/dashboard";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function TopSpendersList({ topSpenders }: { topSpenders: TopSpenderItem[] }) {
    const { t } = useLanguage();

    return (
        <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-xl overflow-hidden">
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
                        <div key={idx} className="p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 grid grid-cols-[auto_1fr_auto] gap-4 items-center">
                            {/* Rank */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-50' :
                                idx === 1 ? 'bg-gray-100 text-gray-700 ring-2 ring-gray-50' :
                                    idx === 2 ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-50' :
                                        'text-gray-500 bg-slate-50'
                                }`}>
                                #{idx + 1}
                            </div>

                            {/* Room & Usage */}
                            <div className="min-w-0">
                                <div className="text-base font-bold text-gray-900 mb-1 leading-tight break-words">
                                    {room.room}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                        <Droplets size={12} className="mr-1" />
                                        {room.water.toFixed(0)} {t.dashboard.unit}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
                                        <Zap size={12} className="mr-1" />
                                        {room.electric.toFixed(0)} {t.dashboard.unit}
                                    </span>
                                </div>
                            </div>

                            {/* Total */}
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
