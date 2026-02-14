"use client";

import { useState, useEffect } from "react";
import { Save, Copy, Loader2, FileText, Check, AlertCircle, Calendar } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import AlertModal, { AlertType } from "@/app/components/AlertModal";

type RoomData = {
    id: number;
    number: string;
    residentName: string;
    roomPrice: number;
    lastWater: number;
    lastElectric: number;
};

type Rates = {
    water: number;
    electric: number;
    trash: number;
    internet: number;
    other: number;
};

export default function BillingTable({ rooms, initialRates }: { rooms: RoomData[]; initialRates: Rates }) {
    const { t } = useLanguage();
    // Removed useModal as we are using local AlertModal for better control
    const [readings, setReadings] = useState<Record<number, { wCurr: string; eCurr: string }>>({});
    const [rates, setRates] = useState<Rates>(initialRates);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState<number[]>([]);

    // State for selected month
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const [grandTotal, setGrandTotal] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);

    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: AlertType;
        onAction?: () => void;
        showCancel?: boolean;
        cancelLabel?: string;
        onCancel?: () => void;
        content?: React.ReactNode;
        actionLabel?: string;
    }>({
        isOpen: false,
        title: "",
        message: "",
        type: "success"
    });

    useEffect(() => {
        let total = 0;
        let count = 0;

        rooms.forEach(room => {
            const wCurrStr = readings[room.id]?.wCurr;
            const eCurrStr = readings[room.id]?.eCurr;

            if (wCurrStr && eCurrStr) {
                const t = calculateTotal(room, wCurrStr, eCurrStr);
                total += t;
                count++;
            }
        });

        setGrandTotal(total);
        setCompletedCount(count);
    }, [readings, rates, rooms]);

    const handleChange = (roomId: number, field: 'wCurr' | 'eCurr', value: string) => {
        setReadings(prev => ({
            ...prev,
            [roomId]: {
                ...prev[roomId],
                [field]: value
            }
        }));
    };

    const calculateTotal = (room: RoomData, wCurr: string, eCurr: string) => {
        const wc = parseFloat(wCurr) || room.lastWater;
        const ec = parseFloat(eCurr) || room.lastElectric;

        const wUnits = Math.max(0, wc - room.lastWater);
        const eUnits = Math.max(0, ec - room.lastElectric);

        const wTotal = wUnits * Number(rates.water);
        const eTotal = eUnits * Number(rates.electric);

        // Sum all fees
        return Number(room.roomPrice) + wTotal + eTotal + Number(rates.trash) + Number(rates.internet) + Number(rates.other);
    };

    function handlePreview() {
        if (!selectedMonth) {
            setAlertState({
                isOpen: true,
                title: "Error",
                message: "Please select a month.",
                type: "error"
            });
            return;
        }

        const billsToCreate = rooms
            .filter(r => readings[r.id]?.wCurr && readings[r.id]?.eCurr)
            .map(r => {
                const wCurrStr = readings[r.id].wCurr;
                const eCurrStr = readings[r.id].eCurr;
                const total = calculateTotal(r, wCurrStr, eCurrStr);
                const wUnits = Math.max(0, (parseFloat(wCurrStr) || 0) - r.lastWater);
                const eUnits = Math.max(0, (parseFloat(eCurrStr) || 0) - r.lastElectric);

                return {
                    roomId: r.id,
                    roomNumber: r.number,
                    wCurr: parseFloat(wCurrStr),
                    eCurr: parseFloat(eCurrStr),
                    wLast: r.lastWater,
                    eLast: r.lastElectric,
                    wUnits,
                    eUnits,
                    total
                };
            });

        if (billsToCreate.length === 0) {
            setAlertState({
                isOpen: true,
                title: t.bulkBilling.title, // Or "Warning"
                message: "Please enter readings for at least one room.", // Use translation if available, simplified for now
                type: "warning"
            });
            return;
        }

        const grandTotal = billsToCreate.reduce((sum, b) => sum + b.total, 0);

        const content = (
            <div className="bg-gray-50 rounded-lg p-4 max-h-[60vh] overflow-y-auto">
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm text-yellow-800">
                    ⚠️ {t.bulkBilling.confirmCreate} <br />
                    <strong>{billsToCreate.length}</strong> Rooms | Month: <strong>{selectedMonth}</strong> | Total <strong>฿{grandTotal.toLocaleString()}</strong>
                </div>
                <div className="space-y-2">
                    {billsToCreate.map(entry => (
                        <div key={entry.roomId} className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
                            <div>
                                <span className="font-bold text-gray-700">{entry.roomNumber}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                    (Water {entry.wUnits} | Elec {entry.eUnits})
                                </span>
                            </div>
                            <div className="font-bold text-green-700">฿{entry.total.toLocaleString()}</div>
                        </div>
                    ))}
                </div>
            </div>
        );

        setAlertState({
            isOpen: true,
            title: "Confirm Creation",
            message: "Review the bills before creating.",
            type: "warning",
            content: content,
            showCancel: true,
            cancelLabel: "Cancel",
            actionLabel: t.bulkBilling.saveAndSend,
            onAction: () => handleSubmit(billsToCreate),
            onCancel: () => setAlertState(prev => ({ ...prev, isOpen: false }))
        });
    }

    const handleSubmit = async (billsToCreate: any[]) => {
        setLoading(true);
        // Update modal to show loading
        setAlertState(prev => ({
            ...prev,
            title: "Processing...",
            message: "Creating bills and sending notifications...",
            type: "info",
            showCancel: false,
            actionLabel: "Processing...",
            onAction: () => { }, // Keep open
            content: undefined
        }));

        try {
            const res = await fetch('/api/billing/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    month: selectedMonth,
                    bills: billsToCreate.map(b => ({
                        roomId: b.roomId,
                        wCurr: b.wCurr,
                        eCurr: b.eCurr,
                        wLast: b.wLast,
                        eLast: b.eLast
                    })),
                    rates: rates
                })
            });

            const result = await res.json();

            if (res.ok) {
                let message = `${t.bulkBilling.success} (${result.created} bills created)`;
                if (result.skipped > 0) message += `\n(Skipped ${result.skipped})`;

                setAlertState({
                    isOpen: true,
                    title: "Success!",
                    message: message,
                    type: "success",
                    actionLabel: "Go to Billing",
                    onAction: () => {
                        window.location.href = "/billing";
                    }
                });
                setSubmitted(prev => [...prev, ...billsToCreate.map((b: any) => b.roomId)]);
            } else {
                throw new Error(result.error || "Failed");
            }
        } catch (e: any) {
            console.error(e);
            setAlertState({
                isOpen: true,
                title: "Error",
                message: e.message || t.bulkBilling.error,
                type: "error",
                actionLabel: "Close",
                onAction: () => setAlertState(prev => ({ ...prev, isOpen: false }))
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                onAction={alertState.onAction}
                showCancel={alertState.showCancel}
                cancelLabel={alertState.cancelLabel}
                onCancel={alertState.onCancel}
                actionLabel={alertState.actionLabel}
            >
                {alertState.content}
            </AlertModal>

            {/* Enhanced Gradient Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg">📝 {t.bulkBilling.title}</h2>
                        <p className="text-indigo-100 mt-2 text-sm md:text-base">{t.bulkBilling.subtitle}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-stretch sm:items-center">
                        {/* Month Selector */}
                        <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl border border-white/30 flex items-center gap-3">
                            <Calendar className="text-white ml-2" size={20} />
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="bg-transparent text-white font-bold outline-none cursor-pointer [color-scheme:dark]"
                            />
                        </div>

                        <button
                            onClick={handlePreview}
                            disabled={loading || completedCount === 0}
                            className="flex items-center justify-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 whitespace-nowrap"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            {t.bulkBilling.saveAndSend} ({completedCount})
                        </button>
                    </div>
                </div>

                {/* Live Total Revenue Summary */}
                <div className="mt-8 pt-6 border-t border-white/20 flex flex-col sm:flex-row justify-between items-center text-white gap-4">
                    <div className="flex items-center gap-2">
                        <Check className="text-green-300" />
                        <span className="font-medium">Ready to invoice: {completedCount} rooms</span>
                    </div>
                    <div className="text-right">
                        <span className="text-indigo-200 text-sm uppercase font-bold tracking-wider">Total Revenue</span>
                        <div className="text-3xl font-bold">฿{grandTotal.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Rate Settings */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-amber-800 uppercase">💧 {t.bulkBilling.waterRate}</span>
                        <input
                            type="number"
                            value={rates.water}
                            onChange={(e) => setRates({ ...rates, water: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2 rounded border border-amber-300 text-center text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-amber-800 uppercase">⚡ {t.bulkBilling.elecRate}</span>
                        <input
                            type="number"
                            value={rates.electric}
                            onChange={(e) => setRates({ ...rates, electric: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2 rounded border border-amber-300 text-center text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-amber-800 uppercase">🗑️ {t.bulkBilling.trash}</span>
                        <input
                            type="number"
                            value={rates.trash}
                            onChange={(e) => setRates({ ...rates, trash: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2 rounded border border-amber-300 text-center text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-amber-800 uppercase">🌐 {t.bulkBilling.internet}</span>
                        <input
                            type="number"
                            value={rates.internet}
                            onChange={(e) => setRates({ ...rates, internet: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2 rounded border border-amber-300 text-center text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-amber-800 uppercase">➕ {t.bulkBilling.other}</span>
                        <input
                            type="number"
                            value={rates.other}
                            onChange={(e) => setRates({ ...rates, other: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2 rounded border border-amber-300 text-center text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4">
                {rooms.map(room => {
                    const wCurr = readings[room.id]?.wCurr || "";
                    const eCurr = readings[room.id]?.eCurr || "";
                    const total = calculateTotal(room, wCurr, eCurr);
                    const isDone = submitted.includes(room.id);

                    return (
                        <div key={room.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-gray-900 text-lg">{t.billing.room} {room.number}</h4>
                                    <p className="text-gray-500 text-sm">{room.residentName}</p>
                                </div>
                                {isDone ? (
                                    <span className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                                        <Check size={14} /> {t.bulkBilling.sent}
                                    </span>
                                ) : (
                                    <div className="text-right">
                                        <span className="text-xs text-gray-400">{t.bulkBilling.previewTotal}</span>
                                        <p className="font-bold text-gray-900">{total > room.roomPrice ? `฿${total.toLocaleString()}` : '-'}</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-blue-700">
                                        <span>Water (Old: {room.lastWater})</span>
                                    </div>
                                    <input
                                        type="number"
                                        min={room.lastWater}
                                        className="w-full p-2 border border-blue-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50/50"
                                        value={wCurr}
                                        onChange={(e) => handleChange(room.id, 'wCurr', e.target.value)}
                                        placeholder={room.lastWater.toString()}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-yellow-700">
                                        <span>Elec (Old: {room.lastElectric})</span>
                                    </div>
                                    <input
                                        type="number"
                                        min={room.lastElectric}
                                        className="w-full p-2 border border-yellow-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-yellow-50/50"
                                        value={eCurr}
                                        onChange={(e) => handleChange(room.id, 'eCurr', e.target.value)}
                                        placeholder={room.lastElectric.toString()}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700 font-bold">
                        <tr>
                            <th className="px-3 py-3 sm:p-4 whitespace-nowrap">{t.billing.room}</th>
                            <th className="px-3 py-3 sm:p-4 whitespace-nowrap">{t.billing.resident}</th>
                            <th className="px-2 py-3 sm:p-4 text-center bg-blue-50 text-blue-800 whitespace-nowrap">{t.billing.waterPrev}</th>
                            <th className="px-2 py-3 sm:p-4 text-center bg-blue-100 text-blue-800 border-l border-blue-200 whitespace-nowrap">{t.bulkBilling.waterNew}</th>
                            <th className="px-2 py-3 sm:p-4 text-center bg-yellow-50 text-yellow-800 whitespace-nowrap">{t.billing.elecPrev}</th>
                            <th className="px-2 py-3 sm:p-4 text-center bg-yellow-100 text-yellow-800 border-l border-yellow-200 whitespace-nowrap">{t.bulkBilling.elecNew}</th>
                            <th className="px-3 py-3 sm:p-4 text-right whitespace-nowrap">{t.bulkBilling.previewTotal}</th>
                            <th className="px-3 py-3 sm:p-4 whitespace-nowrap">{t.billing.status}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rooms.map(room => {
                            const wCurr = readings[room.id]?.wCurr || "";
                            const eCurr = readings[room.id]?.eCurr || "";
                            const total = calculateTotal(room, wCurr, eCurr);
                            const isDone = submitted.includes(room.id);

                            return (
                                <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-3 py-3 sm:p-4 font-bold text-gray-900 whitespace-nowrap">{room.number}</td>
                                    <td className="px-3 py-3 sm:p-4 text-gray-600 whitespace-nowrap max-w-[120px] truncate">{room.residentName}</td>

                                    {/* Water */}
                                    <td className="px-2 py-3 sm:p-4 text-center font-mono text-gray-500 bg-blue-50/30 whitespace-nowrap">
                                        {room.lastWater}
                                    </td>
                                    <td className="px-2 py-3 sm:p-4 text-center border-l border-blue-100 bg-blue-50/50 whitespace-nowrap">
                                        <input
                                            type="number"
                                            min={room.lastWater}
                                            className="w-16 sm:w-20 p-1 border border-blue-300 rounded text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={wCurr}
                                            onChange={(e) => handleChange(room.id, 'wCurr', e.target.value)}
                                            placeholder={room.lastWater.toString()}
                                        />
                                    </td>

                                    {/* Elec */}
                                    <td className="px-2 py-3 sm:p-4 text-center font-mono text-gray-500 bg-yellow-50/30 whitespace-nowrap">
                                        {room.lastElectric}
                                    </td>
                                    <td className="px-2 py-3 sm:p-4 text-center border-l border-yellow-100 bg-yellow-50/50 whitespace-nowrap">
                                        <input
                                            type="number"
                                            min={room.lastElectric}
                                            className="w-16 sm:w-20 p-1 border border-yellow-300 rounded text-center font-bold focus:ring-2 focus:ring-yellow-500 outline-none"
                                            value={eCurr}
                                            onChange={(e) => handleChange(room.id, 'eCurr', e.target.value)}
                                            placeholder={room.lastElectric.toString()}
                                        />
                                    </td>

                                    <td className="px-3 py-3 sm:p-4 text-right font-bold text-gray-900 whitespace-nowrap">
                                        {total > room.roomPrice ? `฿${total.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-3 py-3 sm:p-4 whitespace-nowrap">
                                        {isDone ? (
                                            <span className="flex items-center gap-1 text-green-600 font-bold text-xs">
                                                <Check size={14} /> {t.bulkBilling.sent}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs font-medium">{t.bulkBilling.pending}</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
