import prisma from "@/lib/prisma";
import InvoiceA4 from "@/app/components/print/InvoiceA4";
import ReceiptSlip from "@/app/components/print/ReceiptSlip";
import PrintToolbar from "@/app/components/print/PrintToolbar";
import { notFound } from "next/navigation";

export default async function PrintPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ type: string }> }) {
    const { id } = await params;
    const { type = 'a4' } = await searchParams; // Default to A4

    const billing = await prisma.billing.findUnique({
        where: { id: Number(id) },
        include: {
            room: {
                include: {
                    residents: true
                }
            }
        }
    });

    const config = await prisma.systemConfig.findFirst();

    if (!billing || !config) {
        return notFound();
    }

    // Fallback logic to find the correct resident
    // 1. Try to find 'Active' resident
    // 2. Fallback to the first resident found
    const resident = billing.room?.residents?.find((r: any) => r.status === 'Active') || billing.room?.residents?.[0];

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8 print:p-0 print:bg-white">
            <style type="text/css" dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 0; }
                    body { background: white; }
                }
            `}} />

            {/* Print Toolbar (Client Component) */}
            <PrintToolbar id={id} />

            {/* Preview Area */}
            <div className={`shadow-2xl print:shadow-none ${type === 'a4' ? 'max-w-[210mm]' : 'max-w-[80mm]'}`}>
                {type === 'a4' ? (
                    <InvoiceA4 billing={billing} resident={resident} config={config} />
                ) : (
                    <ReceiptSlip billing={billing} resident={resident} config={config} />
                )}
            </div>

            <script dangerouslySetInnerHTML={{
                __html: `
                // Auto print if requested, but better to let user click to ensure layout loads
                // window.print();
            `}} />
        </div>
    );
}
