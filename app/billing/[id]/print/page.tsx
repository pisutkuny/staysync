import prisma from "@/lib/prisma";
import InvoiceA4 from "@/app/components/print/InvoiceA4";
import InvoiceA5 from "@/app/components/print/InvoiceA5";
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
        <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col items-center justify-start overflow-auto p-8 print:p-0 print:bg-white print:static print:block">
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
                    /* Hide toolbar and all other page elements */
                    nav, header, footer, .sidebar {
                        display: none !important;
                    }
                }
            `}} />

            {/* Print Toolbar (Client Component) */}
            <div className="print:hidden w-full max-w-[210mm] mb-6 flex justify-between items-center">
                <PrintToolbar id={id} />
                <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-md shadow-sm border border-gray-200">
                    💡 Tip: ตั้งค่า Paper Size เป็น <b>A4</b> และ Margins เป็น <b>None/Default</b>
                </div>
            </div>

            {/* Preview Area */}
            <div className={`print-content bg-white shadow-2xl print:shadow-none mx-auto ${type === 'slip' ? 'w-[80mm]' : 'w-[210mm] min-h-[297mm]'}`}>
                {type === 'a4' && (
                    <InvoiceA4 billing={billing} resident={resident} config={config} />
                )}
                {type === 'a5' && (
                    <div className="w-[210mm] h-[297mm] bg-white print:w-full print:h-full flex flex-col">
                        <InvoiceA5 billing={billing} resident={resident} config={config} copyType="ORIGINAL (Customer)" type="invoice" />
                        <InvoiceA5 billing={billing} resident={resident} config={config} copyType="ORIGINAL (Customer)" type="receipt" />
                    </div>
                )}
                {type === 'slip' && (
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
