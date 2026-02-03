"use client";

import generatePayload from 'promptpay-qr';
import { QRCodeCanvas } from 'qrcode.react';

export default function InvoiceA5({ billing, resident, config, copyType }: { billing: any, resident: any, config: any, copyType: string }) {
    // Calculate Amounts safely
    const waterAmount = (billing.waterMeterCurrent - billing.waterMeterLast) * billing.waterRate;
    const electricAmount = (billing.electricMeterCurrent - billing.electricMeterLast) * billing.electricRate;
    const rentAmount = billing.totalAmount - (waterAmount + electricAmount + (billing.trashFee || 0) + (billing.otherFees || 0) + (billing.internetFee || 0));

    const promptPayPayload = config.promptPayId
        ? generatePayload(config.promptPayId, { amount: billing.totalAmount })
        : "";

    return (
        <div className="w-full h-[148mm] bg-white p-8 flex gap-8 text-black border-b border-dashed border-gray-300 last:border-0 relative">
            {/* Left Side: Invoice Details */}
            <div className="flex-1 flex flex-col justify-between">
                {/* Header */}
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900 leading-none">{config.dormName}</h1>
                            <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">{config.dormAddress}</p>
                        </div>
                        <div className="text-right">
                            <div className="inline-block bg-gray-100 px-2 py-1 rounded text-[10px] font-bold text-gray-500 uppercase mb-1">
                                {copyType}
                            </div>
                            <h2 className="text-xl font-bold text-indigo-600">INVOICE</h2>
                            <p className="font-mono text-xs text-gray-500">#{billing.id.toString().padStart(6, '0')}</p>
                        </div>
                    </div>

                    {/* Customer */}
                    <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase">Bill To</span>
                            <div className="font-bold text-gray-900">Room {billing.room.number}</div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">{resident?.fullName || "Guest"}</p>
                            <p className="text-[10px] text-gray-400">{new Date(billing.createdAt).toLocaleDateString('th-TH')}</p>
                        </div>
                    </div>

                    {/* Items */}
                    <table className="w-full text-sm">
                        <thead className="text-[10px] text-gray-400 uppercase border-b border-gray-200">
                            <tr>
                                <th className="py-1 text-left font-normal">Description</th>
                                <th className="py-1 text-center font-normal">Qty/Unit</th>
                                <th className="py-1 text-right font-normal">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs">
                            <tr>
                                <td className="py-2">Room Rent</td>
                                <td className="py-2 text-center text-gray-500">1 Mo</td>
                                <td className="py-2 text-right font-mono">{rentAmount.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="py-2">Water ({billing.waterMeterLast}-{billing.waterMeterCurrent})</td>
                                <td className="py-2 text-center text-gray-500">{(billing.waterMeterCurrent - billing.waterMeterLast).toLocaleString()} u</td>
                                <td className="py-2 text-right font-mono">{waterAmount.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="py-2">Electric ({billing.electricMeterLast}-{billing.electricMeterCurrent})</td>
                                <td className="py-2 text-center text-gray-500">{(billing.electricMeterCurrent - billing.electricMeterLast).toLocaleString()} u</td>
                                <td className="py-2 text-right font-mono">{electricAmount.toLocaleString()}</td>
                            </tr>
                            {(billing.trashFee > 0 || billing.otherFees > 0 || billing.internetFee > 0) && (
                                <tr>
                                    <td className="py-2">Other Fees (Trash/Internet/Etc)</td>
                                    <td className="py-2 text-center text-gray-500">-</td>
                                    <td className="py-2 text-right font-mono">
                                        {((billing.trashFee || 0) + (billing.otherFees || 0) + (billing.internetFee || 0)).toLocaleString()}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Totals */}
                <div className="flex justify-between items-end border-t border-gray-200 pt-3">
                    <p className="text-[10px] text-gray-400 italic mt-2">Thank you for your payment.</p>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Total Amount Due</p>
                        <p className="text-3xl font-bold text-indigo-600 leading-none">฿{billing.totalAmount.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Right Side: QR Code Area */}
            {promptPayPayload && (
                <div className="w-[80mm] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">
                        SCAN TO PAY
                    </div>

                    <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-sm mb-3">
                        <QRCodeCanvas value={promptPayPayload} size={120} />
                    </div>

                    <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Bank Account</p>
                        <p className="font-bold text-sm text-gray-900">{config.bankAccountName}</p>
                        <p className="font-mono text-sm text-gray-600 mt-0.5">{config.bankAccountNumber}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{config.bankName}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
