"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type MonthlyData = {
    month: Date | string;
    monthStr: string;
    central: any;
    roomWaterUsage: number;
    roomElectricUsage: number;
    waterRevenue: number;
    electricRevenue: number;
    commonWaterUsage: number;
    commonElectricUsage: number;
    commonWaterCost: number;
    commonElectricCost: number;
    waterProfit: number;
    electricProfit: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
};

export default function UtilityAnalysisClient({ monthlyData }: { monthlyData: MonthlyData[] }) {
    const { t } = useLanguage();
    const latestMonth = monthlyData[0];

    // Helper to format month
    const formatMonth = (date: Date | string) => {
        // We use 'en-US' or 'th-TH' based on current language?
        // t doesn't give us the current lang code directly, but we can infer or simpler: use a map/lookup? 
        // For now, let's just use EN/TH locale if we can access the lang context state, but useLanguage only returns { t, language, setLanguage }.
        // I need to destruct language from useLanguage.
        return new Date(date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long' }); // Default to Thai format as per original
    };

    return (
        <div className="space-y-6">
            {/* Enhanced Gradient Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg">📈 {t.utilityAnalysis.title}</h2>
                        <p className="text-indigo-100 mt-2 text-sm md:text-base">{t.utilityAnalysis.subtitle}</p>
                    </div>
                    <Link href="/admin/central-meter">
                        <button className="bg-white text-indigo-700 px-4 py-2.5 rounded-lg font-bold hover:bg-indigo-50 transition-all shadow-md hover:shadow-lg flex items-center gap-2 border border-white/30 hover:scale-105 text-sm">
                            📊 {t.utilityAnalysis.recordCentral}
                        </button>
                    </Link>
                </div>
            </div>

            {monthlyData.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-slate-300 shadow-sm text-center">
                    <p className="text-gray-500 mb-4">{t.utilityAnalysis.noData}</p>
                    <Link href="/admin/central-meter">
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                            {t.utilityAnalysis.startRecording}
                        </button>
                    </Link>
                </div>
            ) : (
                <>
                    {/* Latest Month Summary */}
                    {latestMonth && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Water Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-300 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">💧 {t.utilityAnalysis.water} - {formatMonth(latestMonth.month)}</h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">{t.utilityAnalysis.centralMeter}:</span>
                                        <span className="font-semibold text-gray-900">{latestMonth.central.waterUsage.toLocaleString()} {t.centralMeter.unit}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">{t.utilityAnalysis.totalRooms}:</span>
                                        <span className="font-semibold text-gray-900">{latestMonth.roomWaterUsage.toLocaleString()} {t.centralMeter.unit}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-blue-300">
                                        <span className="text-sm font-semibold text-blue-700">{t.utilityAnalysis.commonArea}:</span>
                                        <span className="font-bold text-blue-700">{latestMonth.commonWaterUsage.toLocaleString()} {t.centralMeter.unit} ({((latestMonth.commonWaterUsage / latestMonth.central.waterUsage) * 100).toFixed(1)}%)</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">{t.utilityAnalysis.commonCost}:</span>
                                        <span className="text-sm font-semibold text-red-600">฿{latestMonth.commonWaterCost.toLocaleString()} ({t.utilityAnalysis.ownerPays})</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-blue-300">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-gray-600">{t.utilityAnalysis.revenue}:</span>
                                        <span className="font-semibold text-green-600">฿{latestMonth.waterRevenue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-gray-600">{t.utilityAnalysis.actualCost}:</span>
                                        <span className="font-semibold text-gray-900">฿{latestMonth.central.waterTotalCost.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-blue-300">
                                        <span className="font-bold text-gray-900">{t.utilityAnalysis.profit}:</span>
                                        <span className={`font-bold text-lg ${latestMonth.waterProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ฿{latestMonth.waterProfit.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Electric Card */}
                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-300 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">⚡ {t.utilityAnalysis.elec} - {formatMonth(latestMonth.month)}</h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">{t.utilityAnalysis.centralMeter}:</span>
                                        <span className="font-semibold text-gray-900">{latestMonth.central.electricUsage.toLocaleString()} {t.centralMeter.unit}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">{t.utilityAnalysis.totalRooms}:</span>
                                        <span className="font-semibold text-gray-900">{latestMonth.roomElectricUsage.toLocaleString()} {t.centralMeter.unit}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-yellow-300">
                                        <span className="text-sm font-semibold text-orange-700">{t.utilityAnalysis.commonArea}:</span>
                                        <span className="font-bold text-orange-700">{latestMonth.commonElectricUsage.toLocaleString()} {t.centralMeter.unit} ({((latestMonth.commonElectricUsage / latestMonth.central.electricUsage) * 100).toFixed(1)}%)</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">{t.utilityAnalysis.commonCost}:</span>
                                        <span className="text-sm font-semibold text-red-600">฿{latestMonth.commonElectricCost.toLocaleString()} ({t.utilityAnalysis.ownerPays})</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-yellow-300">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-gray-600">{t.utilityAnalysis.revenue}:</span>
                                        <span className="font-semibold text-green-600">฿{latestMonth.electricRevenue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-gray-600">{t.utilityAnalysis.actualCost}:</span>
                                        <span className="font-semibold text-gray-900">฿{latestMonth.central.electricTotalCost.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-yellow-300">
                                        <span className="font-bold text-gray-900">{t.utilityAnalysis.profit}:</span>
                                        <span className={`font-bold text-lg ${latestMonth.electricProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ฿{latestMonth.electricProfit.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Total Profit Summary */}
                    {latestMonth && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-300 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">💰 {t.utilityAnalysis.summary}</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">{t.utilityAnalysis.totalRevenue}</p>
                                    <p className="text-2xl font-bold text-green-600">฿{latestMonth.totalRevenue.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">{t.utilityAnalysis.actualCost}</p>
                                    <p className="text-2xl font-bold text-gray-900">฿{latestMonth.totalCost.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">{t.utilityAnalysis.netProfit}</p>
                                    <p className={`text-xl md:text-3xl font-bold ${latestMonth.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ฿{latestMonth.totalProfit.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {t.utilityAnalysis.margin}: {((latestMonth.totalProfit / latestMonth.totalRevenue) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-green-300">
                                <p className="text-sm text-gray-600">*{t.utilityAnalysis.ownerPays} ฿{(latestMonth.commonWaterCost + latestMonth.commonElectricCost).toLocaleString()}/{t.centralMeter.month}</p>
                            </div>
                        </div>
                    )}

                    {/* Historical Table */}
                    <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">📊 {t.utilityAnalysis.history}</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-300">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">{t.centralMeter.month}</th>
                                        <th className="text-right py-3 px-4 font-semibold text-gray-700">{t.utilityAnalysis.waterCentral}</th>
                                        <th className="text-right py-3 px-4 font-semibold text-gray-700">{t.utilityAnalysis.waterRoom}</th>
                                        <th className="text-right py-3 px-4 font-semibold text-gray-700">{t.utilityAnalysis.elecCentral}</th>
                                        <th className="text-right py-3 px-4 font-semibold text-gray-700">{t.utilityAnalysis.elecRoom}</th>
                                        <th className="text-right py-3 px-4 font-semibold text-gray-700">{t.utilityAnalysis.profit}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyData.map((data, idx) => (
                                        <tr key={idx} className="border-b border-slate-200 hover:bg-gray-50">
                                            <td className="py-3 px-4 font-medium text-gray-900">
                                                {new Date(data.month).toLocaleDateString('th-TH', { year: '2-digit', month: 'short' })}
                                            </td>
                                            <td className="text-right py-3 px-4 text-gray-700">{data.central.waterUsage.toLocaleString()}</td>
                                            <td className="text-right py-3 px-4 text-gray-700">{data.roomWaterUsage.toLocaleString()}</td>
                                            <td className="text-right py-3 px-4 text-gray-700">{data.central.electricUsage.toLocaleString()}</td>
                                            <td className="text-right py-3 px-4 text-gray-700">{data.roomElectricUsage.toLocaleString()}</td>
                                            <td className={`text-right py-3 px-4 font-bold ${data.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                ฿{data.totalProfit.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
