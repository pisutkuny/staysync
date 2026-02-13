"use client";

import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function PrintToolbar({ id }: { id: string }) {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const type = searchParams.get('type') || 'a4';

    return (
        <div className="fixed top-4 right-4 flex gap-2 print:hidden z-50">
            <a href={`/billing/${id}/print?type=a4`}
                className={`px-4 py-2 rounded-lg font-bold shadow-sm ${type === 'a4' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                {t.print.invoiceA4}
            </a>
            <a href={`/billing/${id}/print?type=a4_receipt`}
                className={`px-4 py-2 rounded-lg font-bold shadow-sm ${type === 'a4_receipt' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                {t.print.receiptA4}
            </a>
            <a href={`/billing/${id}/print?type=a5`}
                className={`px-4 py-2 rounded-lg font-bold shadow-sm ${type === 'a5' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                {t.print.invoiceA5}
            </a>
            <a href={`/billing/${id}/print?type=slip`}
                className={`px-4 py-2 rounded-lg font-bold shadow-sm ${type === 'slip' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                {t.print.slip}
            </a>
            <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg font-bold shadow-sm flex items-center gap-2 hover:bg-gray-800">
                🖨️ {t.print.printNow}
            </button>
            <a href="/billing" className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors" title="Close">
                ✕
            </a>
        </div>
    );
}
