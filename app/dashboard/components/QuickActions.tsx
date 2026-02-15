"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function QuickActions() {
    const { t } = useLanguage();

    return (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                {t.dashboard.quickActions}
            </h3>
            <div className="grid grid-cols-2 lg:flex gap-3 lg:gap-4">
                <Link href="/rooms/add">
                    <button className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-bold transition-all shadow-md hover:shadow-lg hover:scale-105 text-sm flex items-center justify-center gap-2">
                        ➕ {t.dashboard.addRoom}
                    </button>
                </Link>
                <Link href="/billing">
                    <button className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-bold transition-all shadow-sm hover:shadow-md hover:scale-105 text-sm flex items-center justify-center gap-2">
                        💰 {t.dashboard.manageBill}
                    </button>
                </Link>
                <Link href="/billing/bulk">
                    <button className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 font-bold transition-all shadow-md hover:shadow-lg hover:scale-105 text-sm flex items-center justify-center gap-2">
                        📝 {t.dashboard.recordMeter}
                    </button>
                </Link>
                <Link href="/broadcast">
                    <button className="w-full px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 font-bold transition-all shadow-md hover:shadow-lg hover:scale-105 text-sm flex items-center justify-center gap-2">
                        📢 {t.dashboard.broadcast}
                    </button>
                </Link>
                <Link href="/expenses">
                    <button className="w-full px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 font-bold transition-all shadow-md hover:shadow-lg hover:scale-105 text-sm flex items-center justify-center gap-2">
                        📉 {t.dashboard.expenses}
                    </button>
                </Link>
                <Link href="/settings">
                    <button className="w-full px-4 py-2.5 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 font-bold transition-all shadow-md hover:shadow-lg hover:scale-105 text-sm flex items-center justify-center gap-2">
                        ⚙️ {t.common.settings}
                    </button>
                </Link>
            </div>
        </div>
    );
}
