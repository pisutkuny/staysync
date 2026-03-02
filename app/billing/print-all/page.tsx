import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import BulkPrintClient from "./BulkPrintClient";

export const dynamic = 'force-dynamic';

export default async function PrintAllPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
    const { month } = await searchParams;

    if (!month) {
        return notFound();
    }

    const monthStart = new Date(month + "-01");
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    // Fetch all bills for this month
    const bills = await prisma.billing.findMany({
        where: {
            month: {
                gte: monthStart,
                lt: monthEnd
            }
        },
        include: {
            room: {
                include: {
                    residents: {
                        where: { status: "Active" },
                        orderBy: { isMainTenant: 'desc' }
                    }
                }
            }
        },
        orderBy: { room: { number: 'asc' } }
    });

    const config = await prisma.systemConfig.findFirst();

    if (!config || bills.length === 0) {
        return (
            <div className="fixed inset-0 z-[60] bg-gray-100 flex flex-col items-center justify-center p-8">
                <div className="text-center bg-white rounded-2xl p-12 shadow-lg max-w-md">
                    <p className="text-6xl mb-4">📄</p>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Bills Found</h2>
                    <p className="text-gray-500 mb-6">
                        No bills found for <strong>{month}</strong>. Please create bills first.
                    </p>
                    <Link href="/billing" className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                        ← Back to Billing
                    </Link>
                </div>
            </div>
        );
    }

    // Serialize dates for client component
    const serializedBills = bills.map(b => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        month: b.month.toISOString(),
        paymentDate: b.paymentDate?.toISOString() || null,
        reviewedAt: b.reviewedAt?.toISOString() || null,
    }));

    return <BulkPrintClient bills={serializedBills} config={config} month={month} />;
}
