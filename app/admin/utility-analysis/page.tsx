import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function UtilityAnalysisPage() {
    // Fetch central meter records
    const centralRecords = await prisma.centralMeter.findMany({
        orderBy: { month: 'desc' },
        take: 6 // Last 6 months
    });

    // Fetch billings grouped by month
    const billings = await prisma.billing.findMany({
        select: {
            month: true,
            waterMeterLast: true,
            waterMeterCurrent: true,
            waterRate: true,
            electricMeterLast: true,
            electricMeterCurrent: true,
            electricRate: true,
        },
        orderBy: { month: 'desc' }
    });

    // Group billings by month and calculate totals
    const monthlyData = centralRecords.map(central => {
        const monthStr = new Date(central.month).toISOString().slice(0, 7);
        const monthBillings = billings.filter(b =>
            new Date(b.month).toISOString().slice(0, 7) === monthStr
        );

        const roomWaterUsage = monthBillings.reduce((sum, b) => sum + (b.waterMeterCurrent - b.waterMeterLast), 0);
        const roomElectricUsage = monthBillings.reduce((sum, b) => sum + (b.electricMeterCurrent - b.electricMeterLast), 0);

        // Calculate revenue from rooms (average rate * usage)
        const avgWaterRate = monthBillings.length > 0
            ? monthBillings.reduce((sum, b) => sum + b.waterRate, 0) / monthBillings.length
            : 0;
        const avgElectricRate = monthBillings.length > 0
            ? monthBillings.reduce((sum, b) => sum + b.electricRate, 0) / monthBillings.length
            : 0;

        const waterRevenue = roomWaterUsage * avgWaterRate;
        const electricRevenue = roomElectricUsage * avgElectricRate;

        // Common area
        const commonWaterUsage = central.waterUsage - roomWaterUsage;
        const commonElectricUsage = central.electricUsage - roomElectricUsage;

        const commonWaterCost = commonWaterUsage * central.waterRateFromUtility;
        const commonElectricCost = commonElectricUsage * central.electricRateFromUtility;

        // Profit
        const waterProfit = waterRevenue - central.waterTotalCost;
        const electricProfit = electricRevenue - central.electricTotalCost;

        return {
            month: central.month,
            monthStr,
            central,
            roomWaterUsage,
            roomElectricUsage,
            waterRevenue,
            electricRevenue,
            commonWaterUsage,
            commonElectricUsage,
            commonWaterCost,
            commonElectricCost,
            waterProfit,
            electricProfit,
            totalRevenue: waterRevenue + electricRevenue,
            totalCost: central.waterTotalCost + central.electricTotalCost,
            totalProfit: waterProfit + electricProfit
        };
    });

    const latestMonth = monthlyData[0];

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 border border-gray-100 dark:border-slate-700">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">📈 วิเคราะห์สาธารณูปโภค</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">เปรียบเทียบมาตรส่วนกลางกับห้องย่อย</p>
                    </div>
                    <Link href="/admin/central-meter">
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm">
                            📊 บันทึกมาตรส่วนกลาง
                        </button>
                    </Link>
                </div>
            </div>

            {monthlyData.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm text-center">
                    <p className="text-gray-500 mb-4">ยังไม่มีข้อมูลมาตรส่วนกลาง</p>
                    <Link href="/admin/central-meter">
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                            เริ่มบันทึกเลย
                        </button>
                    </Link>
                </div>
            ) : (
                <>
                    {/* Latest Month Summary */}
                    {latestMonth && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Water Card */}
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">💧 น้ำ - {new Date(latestMonth.month).toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}</h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">มาตรกลาง:</span>
                                        <span className="font-semibold text-gray-900">{latestMonth.central.waterUsage.toLocaleString()} หน่วย</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">รวมห้องทั้งหมด:</span>
                                        <span className="font-semibold text-gray-900">{latestMonth.roomWaterUsage.toLocaleString()} หน่วย</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                                        <span className="text-sm font-semibold text-blue-700">ส่วนกลาง:</span>
                                        <span className="font-bold text-blue-700">{latestMonth.commonWaterUsage.toLocaleString()} หน่วย ({((latestMonth.commonWaterUsage / latestMonth.central.waterUsage) * 100).toFixed(1)}%)</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">ค่าใช้จ่ายส่วนกลาง:</span>
                                        <span className="text-sm font-semibold text-red-600">฿{latestMonth.commonWaterCost.toLocaleString()} (เจ้าของจ่าย)</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-blue-200">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-gray-600">รายได้:</span>
                                        <span className="font-semibold text-green-600">฿{latestMonth.waterRevenue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-gray-600">ต้นทุนจริง:</span>
                                        <span className="font-semibold text-gray-900">฿{latestMonth.central.waterTotalCost.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                                        <span className="font-bold text-gray-900">กำไร:</span>
                                        <span className={`font-bold text-lg ${latestMonth.waterProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ฿{latestMonth.waterProfit.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Electric Card */}
                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-100 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">⚡ ไฟฟ้า - {new Date(latestMonth.month).toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}</h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">มาตรกลาง:</span>
                                        <span className="font-semibold text-gray-900">{latestMonth.central.electricUsage.toLocaleString()} หน่วย</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">รวมห้องทั้งหมด:</span>
                                        <span className="font-semibold text-gray-900">{latestMonth.roomElectricUsage.toLocaleString()} หน่วย</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-yellow-200">
                                        <span className="text-sm font-semibold text-orange-700">ส่วนกลาง:</span>
                                        <span className="font-bold text-orange-700">{latestMonth.commonElectricUsage.toLocaleString()} หน่วย ({((latestMonth.commonElectricUsage / latestMonth.central.electricUsage) * 100).toFixed(1)}%)</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500">ค่าใช้จ่ายส่วนกลาง:</span>
                                        <span className="text-sm font-semibold text-red-600">฿{latestMonth.commonElectricCost.toLocaleString()} (เจ้าของจ่าย)</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-yellow-200">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-gray-600">รายได้:</span>
                                        <span className="font-semibold text-green-600">฿{latestMonth.electricRevenue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-gray-600">ต้นทุนจริง:</span>
                                        <span className="font-semibold text-gray-900">฿{latestMonth.central.electricTotalCost.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-yellow-200">
                                        <span className="font-bold text-gray-900">กำไร:</span>
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
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">💰 สรุปรวม</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">รายได้รวม</p>
                                    <p className="text-2xl font-bold text-green-600">฿{latestMonth.totalRevenue.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">ต้นทุนจริง</p>
                                    <p className="text-2xl font-bold text-gray-900">฿{latestMonth.totalCost.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">กำไรสุทธิ</p>
                                    <p className={`text-3xl font-bold ${latestMonth.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ฿{latestMonth.totalProfit.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        อัตรากำไร: {((latestMonth.totalProfit / latestMonth.totalRevenue) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-green-200">
                                <p className="text-sm text-gray-600">หมายเหตุ: เจ้าของออกค่าส่วนกลาง ฿{(latestMonth.commonWaterCost + latestMonth.commonElectricCost).toLocaleString()}/เดือน</p>
                            </div>
                        </div>
                    )}

                    {/* Historical Table */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">📊 ประวัติ 6 เดือนล่าสุด</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">เดือน</th>
                                        <th className="text-right py-3 px-4 font-semibold text-gray-700">น้ำ (กลาง)</th>
                                        <th className="text-right py-3 px-4 font-semibold text-gray-700">น้ำ (ห้อง)</th>
                                        <th className="text-right py-3 px-4 font-semibold text-gray-700">ไฟ (กลาง)</th>
                                        <th className="text-right py-3 px-4 font-semibold text-gray-700">ไฟ (ห้อง)</th>
                                        <th className="text-right py-3 px-4 font-semibold text-gray-700">กำไร</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyData.map((data, idx) => (
                                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
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
