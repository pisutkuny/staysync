"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

type Billing = {
    id: number;
    createdAt: Date | string;
    totalAmount: number;
    paymentStatus: string;
    waterMeterLast: number;
    waterMeterCurrent: number;
    electricMeterLast: number;
    electricMeterCurrent: number;
    waterRate: number;
    electricRate: number;
    trashFee: number;
    internetFee: number;
    otherFees: number;
};

export default function BillingHistory({ billings }: { billings: Billing[] }) {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const toggle = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (billings.length === 0) {
        return <p className="text-sm text-gray-400">No billing history.</p>;
    }

    return (
        <div className="space-y-3">
            {billings.map(bill => (
                <div key={bill.id} className="border-b border-gray-50 last:border-0 pb-2">
                    <div
                        onClick={() => toggle(bill.id)}
                        className="flex justify-between items-center py-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 font-medium">
                                {new Date(bill.createdAt).toLocaleDateString()}
                            </span>
                            {expandedId === bill.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </div>
                        <span className={`text-sm font-bold ${bill.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-500'}`}>
                            {bill.totalAmount.toLocaleString()} ฿
                        </span>
                    </div>

                    {expandedId === bill.id && (
                        <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1 mt-1 text-gray-600">
                            <div className="flex justify-between">
                                <span>Water ({bill.waterMeterCurrent - bill.waterMeterLast} units)</span>
                                <span>{((bill.waterMeterCurrent - bill.waterMeterLast) * bill.waterRate).toLocaleString()} ฿</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Electric ({bill.electricMeterCurrent - bill.electricMeterLast} units)</span>
                                <span>{((bill.electricMeterCurrent - bill.electricMeterLast) * bill.electricRate).toLocaleString()} ฿</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Internet</span>
                                <span>{bill.internetFee.toLocaleString()} ฿</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Trash</span>
                                <span>{bill.trashFee.toLocaleString()} ฿</span>
                            </div>
                            {bill.otherFees > 0 && (
                                <div className="flex justify-between text-gray-500">
                                    <span>Other</span>
                                    <span>{bill.otherFees.toLocaleString()} ฿</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
