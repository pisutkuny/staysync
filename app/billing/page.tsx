import prisma from "@/lib/prisma";
import BillingForm from "./BillingForm";
import BillingList from "./BillingList";
import MeterDashboard from "./MeterDashboard";
import ExportButton from "./ExportButton";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
    const rooms = await prisma.room.findMany({
        where: { status: "Occupied" },
        include: { residents: true },
        orderBy: { number: "asc" },
    });

    const bills = await prisma.billing.findMany({
        include: { room: true },
        orderBy: [
            { paymentStatus: "asc" }, // Review first (if sort logic works like Pending < Paid/Review? No. Need custom sort or just sort by date/status logic)
            // Ideally: Review first. But simple string sort won't do that perfectly.
            // Let's sort by date desc for now, keeping newest at top.
            { createdAt: "desc" }
        ],
        take: 50
    });

    // Custom sort to put 'Review' at top
    bills.sort((a, b) => {
        if (a.paymentStatus === 'Review' && b.paymentStatus !== 'Review') return -1;
        if (a.paymentStatus !== 'Review' && b.paymentStatus === 'Review') return 1;
        return 0;
    });

    // Fetch ALL rooms for the dashboard table (even available ones)
    const allRooms = await prisma.room.findMany({
        include: {
            residents: { where: { status: 'Active' } },
            billings: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                select: { waterMeterCurrent: true, electricMeterCurrent: true, createdAt: true }
            }
        },
        orderBy: { number: "asc" },
    });

    const config = await prisma.systemConfig.findFirst();

    // Calculate default common fee (if fixed cap is set)
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
                        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg">💰 Monthly Billing</h2>
                        <p className="text-indigo-100 mt-2 text-sm md:text-base">Manage billing and view utility usage.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full md:w-auto min-w-[300px]">
                        <ExportButton />
                        <Link href="/billing/bulk" className="w-full">
                            <button className="w-full h-full bg-white text-orange-700 px-2 py-2.5 rounded-lg font-bold hover:bg-orange-50 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 border border-white/30 hover:scale-105 text-xs sm:text-sm">
                                <span>📝</span>
                                <span className="truncate">Record All</span>
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Meter Dashboard Table */}
            <MeterDashboard rooms={allRooms} />

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Create New Bill</h3>
                    <p className="text-sm text-gray-500">
                        💡 <strong>สำหรับสร้างบิลเฉพาะห้อง</strong> - แก้ไขบิลกลางเดือน หรือบิลพิเศษ |
                        <span className="text-indigo-600 font-medium">สำหรับบันทึกมาตรประจำเดือนทั้งหมด ใช้ &quot;Record All Meters&quot;</span>
                    </p>
                </div>
                {rooms.length > 0 ? (
                    <BillingForm
                        rooms={rooms}
                        initialRates={initialRates}
                        config={config}
                        totalRoomCount={allRooms.length}
                    />
                ) : (
                    <p className="text-gray-500">No occupied rooms to bill.</p>
                )}
            </div>

            <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h3>
                <BillingList initialBills={bills} />
            </div>
        </div>
    );
}
