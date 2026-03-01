"use client";

export default function BulkPrintToolbar({ month, billCount, pageCount }: { month: string; billCount: number; pageCount: number }) {
    return (
        <div className="print:hidden w-full max-w-[210mm] mb-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <a href="/billing" className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors font-bold text-sm px-4">
                    ← Back
                </a>
                <div className="text-sm text-gray-700">
                    <span className="font-bold">{billCount} bills</span> on <span className="font-bold">{pageCount} pages</span>
                    <span className="text-gray-400 ml-2">({month})</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-md shadow-sm border border-gray-200">
                    💡 Paper: <b>A4</b> | Margins: <b>None</b>
                </div>
                <button
                    onClick={() => window.print()}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-bold shadow-sm flex items-center gap-2 hover:bg-gray-800 transition-colors"
                >
                    🖨️ Print All
                </button>
            </div>
        </div>
    );
}
