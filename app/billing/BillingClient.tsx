"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import BillingForm from "./BillingForm";
import MeterDashboard from "./MeterDashboard";
import ExportButton from "./ExportButton";
import Link from "next/link";

interface BillingClientProps {
    rooms: any[];
    bills: any[];
    allRooms: any[]; // Used for calculations
    config: any;
}

export default function BillingClient({ rooms, bills, allRooms, config }: BillingClientProps) {
    const { t } = useLanguage();

    // Calculate default common fee
    let defaultCommonFee = 0;
    if (config?.enableCommonAreaCharges && config?.commonAreaCapType === 'fixed') {
        defaultCommonFee = Math.ceil((config.commonAreaCapFixed || 0) / (allRooms.length || 1));
    }

    const initialRates = {
        trash: config?.trashFee || 0,
        internet: config?.internetFee || 0,
        other: config?.otherFees || 0,
        common: defaultCommonFee
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Enhanced Gradient Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg">💰 {t.billing.title}</h2>
                        <p className="text-indigo-100 mt-2 text-sm md:text-base">{t.billing.subtitle}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full md:w-auto min-w-[300px]">
                        <ExportButton />
                        <Link href="/billing/bulk" className="w-full">
                            <button className="w-full h-full bg-white text-orange-700 px-2 py-2.5 rounded-lg font-bold hover:bg-orange-50 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 border border-white/30 hover:scale-105 text-xs sm:text-sm">
                                <span>📝</span>
                                <span className="truncate">{t.billing.recordAll}</span>
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Dashboard Stats */}
            <MeterDashboard rooms={rooms} bills={bills} />

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{t.billing.createBill}</h3>
                    <p className="text-sm text-gray-500">
                        💡 <strong>{t.billing.createBillDesc}</strong> |
                        <span className="text-indigo-600 font-medium"> {t.billing.recordAllDesc}</span>
                    </p>
                </div>
                {rooms.length > 0 ? (
                    <BillingForm
                        rooms={rooms} // Should be only occupied rooms
                        initialRates={initialRates}
                        config={config}
                        totalRoomCount={allRooms.length}
                    />
                ) : (
                    <p className="text-gray-500">No occupied rooms to bill.</p>
                )}
            </div>
        </div>
    );
}
