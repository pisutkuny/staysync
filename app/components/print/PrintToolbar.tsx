"use client";

import { useSearchParams } from "next/navigation";

export default function PrintToolbar({ id }: { id: string }) {
    const searchParams = useSearchParams();
    const type = searchParams.get('type') || 'a4';

    return (
        <div className="fixed top-4 right-4 flex gap-2 print:hidden z-50">
            <a href={`/billing/${id}/print?type=a4`}
                className={`px-4 py-2 rounded-lg font-bold shadow-sm ${type === 'a4' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                A4 Full
            </a>
            <a href={`/billing/${id}/print?type=a5`}
                className={`px-4 py-2 rounded-lg font-bold shadow-sm ${type === 'a5' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                A5 (2-Up)
            </a>
            <a href={`/billing/${id}/print?type=slip`}
                className={`px-4 py-2 rounded-lg font-bold shadow-sm ${type === 'slip' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                Slip
            </a>
            <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg font-bold shadow-sm flex items-center gap-2 hover:bg-gray-800">
                🖨️ Print Now
            </button>
        </div>
    );
}
