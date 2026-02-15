"use client";

import { X, Receipt, Droplets, Zap, Wifi, Trash2, Home } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface BillDetailsModalProps {
    bill: any;
    onClose: () => void;
}

export default function BillDetailsModal({ bill, onClose }: BillDetailsModalProps) {
    const { t } = useLanguage();

    if (!bill) return null;

    // Calculate totals for breakdown
    const waterTotal = (bill.waterMeterCurrent - bill.waterMeterLast) * bill.waterRate;
    const electricTotal = (bill.electricMeterCurrent - bill.electricMeterLast) * bill.electricRate;
    const commonFee = (bill.commonWaterFee || 0) + (bill.commonElectricFee || 0) + (bill.commonInternetFee || 0) + (bill.commonTrashFee || 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Receipt className="w-6 h-6" />
                            {t.billing.billDetails}
                        </h2>
                        <p className="text-indigo-100 text-sm mt-1">
                            {new Date(bill.createdAt).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

                    {/* Status Badge */}
                    <div className="flex justify-center">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide border-2 ${bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                bill.status === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                    'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                            {bill.status}
                        </span>
                    </div>

                    {/* Breakdown List */}
                    <div className="space-y-4">
                        {/* Room Price */}
                        <div className="flex justify-between items-center text-slate-700 p-3 bg-slate-50 rounded-xl border-2 border-slate-100">
                            <span className="flex items-center gap-2 font-bold">
                                <Home size={18} className="text-indigo-500" />
                                {t.rooms.price}
                            </span>
                            <span className="font-mono font-bold">฿{bill.room?.price?.toLocaleString() || 0}</span>
                        </div>

                        {/* Utilities */}
                        <div className="space-y-2">
                            {/* Water */}
                            <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                <span className="flex items-center gap-2 text-slate-600">
                                    <Droplets size={16} className="text-blue-500" />
                                    {t.billing.water} ({bill.waterMeterCurrent - bill.waterMeterLast} units)
                                </span>
                                <span className="font-mono font-medium text-slate-900">฿{waterTotal.toLocaleString()}</span>
                            </div>

                            {/* Electric */}
                            <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                <span className="flex items-center gap-2 text-slate-600">
                                    <Zap size={16} className="text-amber-500" />
                                    {t.billing.electric} ({bill.electricMeterCurrent - bill.electricMeterLast} units)
                                </span>
                                <span className="font-mono font-medium text-slate-900">฿{electricTotal.toLocaleString()}</span>
                            </div>

                            {/* Internet */}
                            {(bill.internetFee > 0) && (
                                <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                    <span className="flex items-center gap-2 text-slate-600">
                                        <Wifi size={16} className="text-sky-500" />
                                        {t.billing.internet}
                                    </span>
                                    <span className="font-mono font-medium text-slate-900">฿{bill.internetFee.toLocaleString()}</span>
                                </div>
                            )}

                            {/* Common Fee */}
                            {commonFee > 0 && (
                                <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                    <span className="flex items-center gap-2 text-slate-600">
                                        <Home size={16} className="text-emerald-500" />
                                        Common Fees
                                    </span>
                                    <span className="font-mono font-medium text-slate-900">฿{commonFee.toLocaleString()}</span>
                                </div>
                            )}

                            {/* Trash */}
                            {(bill.trashFee > 0) && (
                                <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                    <span className="flex items-center gap-2 text-slate-600">
                                        <Trash2 size={16} className="text-gray-500" />
                                        Trash
                                    </span>
                                    <span className="font-mono font-medium text-slate-900">฿{bill.trashFee.toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t-2 border-dashed border-slate-200 my-4"></div>

                        {/* Total */}
                        <div className="flex justify-between items-end">
                            <span className="text-lg font-bold text-slate-800">TOTAL</span>
                            <span className="text-3xl font-black text-indigo-600 tracking-tight">
                                ฿{bill.totalAmount.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t-2 border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
