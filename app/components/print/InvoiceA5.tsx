"use client";

import generatePayload from 'promptpay-qr';
import { QRCodeCanvas } from 'qrcode.react';

export default function InvoiceA5({ billing, resident, config, copyType }: { billing: any, resident: any, config: any, copyType: string }) {
    // Calculate Amounts safely
    const waterAmount = (billing.waterMeterCurrent - billing.waterMeterLast) * billing.waterRate;
    const electricAmount = (billing.electricMeterCurrent - billing.electricMeterLast) * billing.electricRate;
    const rentAmount = billing.totalAmount - (waterAmount + electricAmount + (billing.trashFee || 0) + (billing.otherFees || 0) + (billing.internetFee || 0));

    // Theme Color
    const themeColor = config.invoiceColor || "#4f46e5";

    const promptPayPayload = config.promptPayId
        ? generatePayload(config.promptPayId, { amount: billing.totalAmount })
        : "";

    return (
        <div className="w-full h-[148mm] bg-white p-8 flex text-black relative border-b border-dashed border-gray-300 last:border-0 font-sans">
            {/* Left Main Content */}
            <div className="flex-1 pr-8 flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <h1 className="text-5xl font-bold tracking-tight text-gray-800 uppercase">Invoice</h1>
                    {/* Logo if exists */}
                    {config.invoiceLogo && (
                        <img src={config.invoiceLogo} alt="Logo" className="h-12 w-auto object-contain grayscale opacity-80" />
                    )}
                </div>

                {/* Table */}
                <div className="flex-1">
                    <table className="w-full text-sm">
                        <thead className="border-b-2 border-gray-100 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="py-2 text-left">Description</th>
                                <th className="py-2 text-right">Price</th>
                                <th className="py-2 text-center">Qty</th>
                                <th className="py-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                            <tr>
                                <td className="py-3">Room Rent ({billing.room.number})</td>
                                <td className="py-3 text-right">{rentAmount.toLocaleString()}</td>
                                <td className="py-3 text-center">1</td>
                                <td className="py-3 text-right font-mono text-gray-900">{rentAmount.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="py-3">Water ({billing.waterMeterLast}-{billing.waterMeterCurrent})</td>
                                <td className="py-3 text-right">{billing.waterRate}</td>
                                <td className="py-3 text-center">{(billing.waterMeterCurrent - billing.waterMeterLast).toLocaleString()}</td>
                                <td className="py-3 text-right font-mono text-gray-900">{waterAmount.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="py-3">Electric ({billing.electricMeterLast}-{billing.electricMeterCurrent})</td>
                                <td className="py-3 text-right">{billing.electricRate}</td>
                                <td className="py-3 text-center">{(billing.electricMeterCurrent - billing.electricMeterLast).toLocaleString()}</td>
                                <td className="py-3 text-right font-mono text-gray-900">{electricAmount.toLocaleString()}</td>
                            </tr>
                            {(billing.trashFee > 0 || billing.otherFees > 0) && (
                                <tr>
                                    <td className="py-3">Other Fees</td>
                                    <td className="py-3 text-right">-</td>
                                    <td className="py-3 text-center">-</td>
                                    <td className="py-3 text-right font-mono text-gray-900">
                                        {((billing.trashFee || 0) + (billing.otherFees || 0) + (billing.internetFee || 0)).toLocaleString()}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end mt-4 border-t border-gray-100 pt-4">
                    <div className="w-1/2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Subtotal</span>
                            <span>{billing.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-gray-900 mt-2">
                            <span>Total</span>
                            <span style={{ color: themeColor }}>฿{billing.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Left Branding */}
                <div className="mt-auto text-xs text-gray-500 uppercase font-bold tracking-widest pt-8">
                    {config.dormName}
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-[30%] border-l border-gray-100 pl-8 flex flex-col gap-8 bg-gray-50/50 -my-8 py-8 -mr-8 pr-8">
                {/* QR Code Section */}
                {promptPayPayload && (
                    <div className="text-center">
                        <div className="relative inline-block p-1 border-2 border-gray-200 rounded-lg bg-white mb-2">
                            {/* Decorative Corners */}
                            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-gray-800"></div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-gray-800"></div>
                            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-gray-800"></div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-gray-800"></div>
                            <QRCodeCanvas value={promptPayPayload} size={110} />
                        </div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Scan here to pay</p>
                    </div>
                )}

                {/* Issued To */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Issued to :</h3>
                    <p className="font-bold text-gray-900 text-sm">{resident?.fullName || "Guest"}</p>
                    <p className="text-xs text-gray-500">{resident?.phone || "No Phone"}</p>
                    <p className="text-xs text-gray-500">Room {billing.room.number}</p>
                </div>

                {/* Invoice Details */}
                <div className="space-y-3">
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase">Invoice No.</h3>
                        <p className="font-mono text-xs text-gray-900 font-bold">INV/#{billing.id.toString().padStart(6, '0')}</p>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase">Date</h3>
                        <p className="text-xs text-gray-900">{new Date(billing.createdAt).toLocaleDateString('en-GB')}</p>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase">Copy Type</h3>
                        <p className="text-xs text-indigo-600 font-bold uppercase">{copyType}</p>
                    </div>
                </div>

                {/* Custom Note */}
                {config.invoiceNote && (
                    <div className="mt-auto pt-4 text-[10px] text-gray-400 italic border-t border-gray-100">
                        {config.invoiceNote}
                    </div>
                )}
            </div>
        </div>
    );
}
