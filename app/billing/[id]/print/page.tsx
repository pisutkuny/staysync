import prisma from "@/lib/prisma";
import InvoiceA4 from "@/app/components/print/InvoiceA4";
import ReceiptSlip from "@/app/components/print/ReceiptSlip";
import { notFound } from "next/navigation";

export default async function PrintPage({ params, searchParams }: { params: { id: string }, searchParams: { type: string } }) {
    const { id } = params;
    const type = searchParams.type || 'a4'; // Default to A4

    const billing = await prisma.billing.findUnique({
        where: { id: Number(id) },
        include: {
            room: true,
            resident: true
        }
    });

    const config = await prisma.systemConfig.findFirst();

    if (!billing || !config) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8 print:p-0 print:bg-white">
            <style type="text/css" dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 0; }
                    body { background: white; }
                }
            `}} />

            {/* Print Toolbar (Hidden when printing) */}
            <div className="fixed top-4 right-4 flex gap-2 print:hidden">
                <a href={`/billing/${id}/print?type=a4`}
                    className={`px-4 py-2 rounded-lg font-bold shadow-sm ${type === 'a4' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                    A4 Invoice
                </a>
                <a href={`/billing/${id}/print?type=slip`}
                    className={`px-4 py-2 rounded-lg font-bold shadow-sm ${type === 'slip' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                    Thermal Slip
                </a>
                <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg font-bold shadow-sm flex items-center gap-2 hover:bg-gray-800">
                    🖨️ Print Now
                </button>
            </div>

            {/* Preview Area */}
            <div className={`shadow-2xl print:shadow-none ${type === 'a4' ? 'max-w-[210mm]' : 'max-w-[80mm]'}`}>
                {type === 'a4' ? (
                    <InvoiceA4 billing={billing} config={config} />
                ) : (
                    <ReceiptSlip billing={billing} config={config} />
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
