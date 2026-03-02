"use client";

import { useState, useMemo } from "react";
import InvoiceA5 from "@/app/components/print/InvoiceA5";

type PrintType = "invoice" | "receipt";

export default function BulkPrintClient({ bills, config, month }: { bills: any[]; config: any; month: string }) {
    const [printType, setPrintType] = useState<PrintType>("invoice");
    const [selectedRooms, setSelectedRooms] = useState<Set<number>>(() => new Set(bills.map(b => b.roomId)));
    const [showRoomPicker, setShowRoomPicker] = useState(false);

    const toggleRoom = (roomId: number) => {
        setSelectedRooms(prev => {
            const next = new Set(prev);
            if (next.has(roomId)) {
                next.delete(roomId);
            } else {
                next.add(roomId);
            }
            return next;
        });
    };

    const selectAll = () => setSelectedRooms(new Set(bills.map(b => b.roomId)));
    const selectNone = () => setSelectedRooms(new Set());

    // Filter bills by selected rooms
    const filteredBills = useMemo(() =>
        bills.filter(b => selectedRooms.has(b.roomId)),
        [bills, selectedRooms]
    );

    // Pair bills into groups of 2
    const pages = useMemo(() => {
        const result: any[][] = [];
        for (let i = 0; i < filteredBills.length; i += 2) {
            result.push(filteredBills.slice(i, i + 2));
        }
        return result;
    }, [filteredBills]);

    return (
        <div className="fixed inset-0 z-[60] bg-gray-100 flex flex-col items-center justify-start overflow-auto p-8 print:p-0 print:bg-white print:static print:block">
            <style type="text/css" dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    * { visibility: hidden; }
                    .print-content, .print-content * { visibility: visible; }
                    .print-content { position: absolute; left: 0; top: 0; width: 100%; margin: 0; }
                    .a4-page { page-break-after: always; page-break-inside: avoid; }
                    .a4-page:last-child { page-break-after: auto; }
                    nav, header, footer, .sidebar { display: none !important; }
                }
            `}} />

            {/* Toolbar */}
            <div className="print:hidden w-full max-w-[210mm] mb-6 space-y-3">
                {/* Top Row */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <a href="/billing" className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors font-bold text-sm px-4">
                            ← Back
                        </a>
                        <div className="text-sm text-gray-700">
                            <span className="font-bold">{filteredBills.length}/{bills.length} bills</span> on <span className="font-bold">{pages.length} pages</span>
                            <span className="text-gray-400 ml-2">({month})</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-md shadow-sm border border-gray-200">
                            💡 Paper: <b>A4</b> | Margins: <b>None</b>
                        </div>
                        <button
                            onClick={() => window.print()}
                            disabled={filteredBills.length === 0}
                            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-bold shadow-sm flex items-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            🖨️ Print
                        </button>
                    </div>
                </div>

                {/* Type Toggle + Room Picker */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Type Toggle */}
                    <div className="flex bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <button
                            onClick={() => setPrintType("invoice")}
                            className={`px-4 py-2 text-sm font-bold transition-colors ${printType === "invoice" ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                        >
                            📄 Invoice A5
                        </button>
                        <button
                            onClick={() => setPrintType("receipt")}
                            className={`px-4 py-2 text-sm font-bold transition-colors ${printType === "receipt" ? "bg-emerald-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                        >
                            🧾 Receipt A5
                        </button>
                    </div>

                    {/* Room Picker Toggle */}
                    <button
                        onClick={() => setShowRoomPicker(!showRoomPicker)}
                        className={`px-4 py-2 text-sm font-bold rounded-lg border transition-colors flex items-center gap-2 ${showRoomPicker ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                    >
                        🏠 เลือกห้อง ({selectedRooms.size}/{bills.length})
                    </button>
                </div>

                {/* Room Selection Panel */}
                {showRoomPicker && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-gray-700">เลือกห้องที่ต้องการพิมพ์</span>
                            <div className="flex gap-2">
                                <button onClick={selectAll} className="text-xs font-bold text-indigo-600 hover:underline">เลือกทั้งหมด</button>
                                <span className="text-gray-300">|</span>
                                <button onClick={selectNone} className="text-xs font-bold text-gray-500 hover:underline">ไม่เลือก</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {bills.map(bill => {
                                const isSelected = selectedRooms.has(bill.roomId);
                                const isPaid = bill.paymentStatus === "Paid";
                                return (
                                    <button
                                        key={bill.id}
                                        onClick={() => toggleRoom(bill.roomId)}
                                        className={`p-2 rounded-lg border-2 text-sm font-bold transition-all text-center ${isSelected
                                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                : "border-gray-200 bg-gray-50 text-gray-400"
                                            }`}
                                    >
                                        <div>{bill.room.number}</div>
                                        <div className="text-[10px] font-normal mt-0.5">
                                            {isPaid ? "✅ Paid" : "⏳ Pending"}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Print Content */}
            <div className="print-content">
                {filteredBills.length === 0 ? (
                    <div className="w-[210mm] bg-white shadow-2xl mx-auto p-20 text-center text-gray-400 rounded-xl">
                        <p className="text-4xl mb-4">🏠</p>
                        <p className="text-lg font-bold">ยังไม่ได้เลือกห้อง</p>
                        <p className="text-sm">กรุณาเลือกห้องที่ต้องการพิมพ์</p>
                    </div>
                ) : (
                    pages.map((pageBills, pageIndex) => (
                        <div key={pageIndex} className="a4-page w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none mx-auto mb-8 print:mb-0 flex flex-col">
                            {pageBills.map((bill: any) => {
                                const resident = bill.room?.residents?.find((r: any) => r.status === 'Active') || bill.room?.residents?.[0];
                                return (
                                    <InvoiceA5
                                        key={bill.id}
                                        billing={bill}
                                        resident={resident}
                                        config={config}
                                        copyType="ORIGINAL (Customer)"
                                        type={printType}
                                    />
                                );
                            })}
                            {pageBills.length === 1 && (
                                <div className="flex-1 bg-white" />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
