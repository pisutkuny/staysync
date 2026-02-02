import prisma from "@/lib/prisma";
import BillingForm from "./BillingForm";
import BillingList from "./BillingList";
import MeterDashboard from "./MeterDashboard";
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

    const initialRates = {
        trash: config?.trashFee || 0,
        internet: config?.internetFee || 0,
        other: config?.otherFees || 0
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Monthly Billing</h2>
                    <p className="text-gray-500 mt-2">Manage billing and view utility usage.</p>
                </div>
                <Link href="/billing/bulk">
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2">
                        <span>📝</span> Record All Meters
                    </button>
                </Link>
            </div>

            {/* Meter Dashboard Table */}
            <MeterDashboard rooms={allRooms} />

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Create New Bill</h3>
                {rooms.length > 0 ? <BillingForm rooms={rooms} initialRates={initialRates} /> : <p className="text-gray-500">No occupied rooms to bill.</p>}
            </div>

            <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Transactions</h3>
                <BillingList initialBills={bills} />
            </div>
        </div>
    );
}
