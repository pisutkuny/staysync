import prisma from "@/lib/prisma";
import InvoiceA5 from "@/app/components/print/InvoiceA5";
import { notFound } from "next/navigation";
import Link from "next/link";
import BulkPrintToolbar from "./BulkPrintToolbar";

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

    // Pair bills into groups of 2 for A5 2-up layout
    const pages: (typeof bills[0])[][] = [];
    for (let i = 0; i < bills.length; i += 2) {
        pages.push(bills.slice(i, i + 2));
    }

    return (
        <div className="fixed inset-0 z-[60] bg-gray-100 flex flex-col items-center justify-start overflow-auto p-8 print:p-0 print:bg-white print:static print:block">
            <style type="text/css" dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 0; 
                    }
                    body { 
                        background: white; 
                        margin: 0; 
                        padding: 0; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact;
                    }
                    * {
                        visibility: hidden;
                    }
                    .print-content, .print-content * {
                        visibility: visible;
                    }
                    .print-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                    }
                    .a4-page {
                        page-break-after: always;
                        page-break-inside: avoid;
                    }
                    .a4-page:last-child {
                        page-break-after: auto;
                    }
                    nav, header, footer, .sidebar {
                        display: none !important;
                    }
                }
            `}} />

            {/* Toolbar */}
            <BulkPrintToolbar month={month} billCount={bills.length} pageCount={pages.length} />

            {/* Print Content */}
            <div className="print-content">
                {pages.map((pageBills, pageIndex) => (
                    <div key={pageIndex} className="a4-page w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none mx-auto mb-8 print:mb-0 flex flex-col">
                        {pageBills.map((bill, billIndex) => {
                            const resident = bill.room?.residents?.find((r: any) => r.status === 'Active') || bill.room?.residents?.[0];
                            return (
                                <InvoiceA5
                                    key={bill.id}
                                    billing={bill}
                                    resident={resident}
                                    config={config}
                                    copyType="ORIGINAL (Customer)"
                                    type="invoice"
                                />
                            );
                        })}
                        {/* If only 1 bill on this page, fill bottom half */}
                        {pageBills.length === 1 && (
                            <div className="flex-1 bg-white" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
