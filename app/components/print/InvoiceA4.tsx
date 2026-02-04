"use client";

import generatePayload from 'promptpay-qr';
import { QRCodeCanvas } from 'qrcode.react';

export default function InvoiceA4({ billing, resident, config, type = 'invoice' }: { billing: any, resident: any, config: any, type?: 'invoice' | 'receipt' }) {
    // Calculate Amounts safely
    const waterAmount = (billing.waterMeterCurrent - billing.waterMeterLast) * billing.waterRate;
    const electricAmount = (billing.electricMeterCurrent - billing.electricMeterLast) * billing.electricRate;
    const rentAmount = billing.totalAmount - (waterAmount + electricAmount + (billing.trashFee || 0) + (billing.otherFees || 0) + (billing.internetFee || 0));

    const promptPayPayload = config.promptPayId
        ? generatePayload(config.promptPayId, { amount: billing.totalAmount })
        : "";

    // Theme Color
    const themeColor = config.invoiceColor || "#4f46e5";

    return (
        <div className="w-[210mm] min-h-[297mm] bg-white p-12 mx-auto text-black relative font-sans print:w-full print:h-full">
            {/* Watermark Background */}
            {config.invoiceLogo && (
                <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    <img
                        src={config.invoiceLogo}
                        alt="Watermark"
                        className="w-[60%] h-auto object-contain opacity-[0.03] grayscale"
                    />
                </div>
            )}

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-gray-300 pb-6 mb-8">
                        <div className="flex gap-6 items-start">
                            {/* Logo */}
                            {config.invoiceLogo ? (
                                <img src={config.invoiceLogo} alt="Logo" className="w-24 h-24 object-contain rounded-full border border-gray-100 shadow-sm" />
                            ) : (
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                                    <span className="text-xs">No Logo</span>
                                </div>
                            )}
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">{config.dormName}</h1>
                                <p className="text-gray-500 mt-2 max-w-sm leading-relaxed">{config.dormAddress}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-4xl font-bold uppercase tracking-tight" style={{ color: themeColor }}>{type === 'receipt' ? 'RECEIPT' : 'INVOICE'}</h2>
                            <p className="font-mono text-lg text-gray-600 mt-2 font-bold">INV #{billing.id.toString().padStart(6, '0')}</p>
                            <p className="text-sm text-gray-500 mt-1">วันที่: {new Date(billing.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="flex justify-between mb-10">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ออกบิลถึง / Bill To</h3>
                            <div className="text-2xl font-bold text-gray-900 mb-1">ห้อง {billing.room.number}</div>
                            <p className="text-lg text-gray-700">{resident?.fullName || "ผู้เช่ารายวัน / Guest"}</p>
                            {resident?.phone && <p className="text-gray-500 text-sm mt-1">{resident.phone}</p>}
                        </div>
                        <div className="text-right">
                            {/* Optional: Add Due Date or other info here if needed */}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="mb-8">
                        <table className="w-full">
                            <thead>
                                <tr className="border-y-2 border-gray-200">
                                    <th className="py-3 text-left font-bold text-gray-600 text-sm uppercase tracking-wider">รายการ (Description)</th>
                                    <th className="py-3 text-right font-bold text-gray-600 text-sm uppercase tracking-wider">ราคาต่อหน่วย</th>
                                    <th className="py-3 text-center font-bold text-gray-600 text-sm uppercase tracking-wider">จำนวน</th>
                                    <th className="py-3 text-right font-bold text-gray-600 text-sm uppercase tracking-wider">รวมเป็นเงิน</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                <tr>
                                    <td className="py-4 font-medium text-gray-800">ค่าเช่าห้อง (Room Rent)</td>
                                    <td className="py-4 text-right">-</td>
                                    <td className="py-4 text-center">1 เดือน</td>
                                    <td className="py-4 text-right font-mono font-bold text-gray-900">{rentAmount.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td className="py-4">
                                        <div className="font-medium text-gray-800">ค่าน้ำ (Water Usage)</div>
                                        <div className="text-xs text-gray-500 mt-1">มิเตอร์: {billing.waterMeterLast} → {billing.waterMeterCurrent}</div>
                                    </td>
                                    <td className="py-4 text-right">{billing.waterRate}</td>
                                    <td className="py-4 text-center">{(billing.waterMeterCurrent - billing.waterMeterLast).toLocaleString()} หน่วย</td>
                                    <td className="py-4 text-right font-mono font-bold text-gray-900">{waterAmount.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td className="py-4">
                                        <div className="font-medium text-gray-800">ค่าไฟ (Electric Usage)</div>
                                        <div className="text-xs text-gray-500 mt-1">มิเตอร์: {billing.electricMeterLast} → {billing.electricMeterCurrent}</div>
                                    </td>
                                    <td className="py-4 text-right">{billing.electricRate}</td>
                                    <td className="py-4 text-center">{(billing.electricMeterCurrent - billing.electricMeterLast).toLocaleString()} หน่วย</td>
                                    <td className="py-4 text-right font-mono font-bold text-gray-900">{electricAmount.toLocaleString()}</td>
                                </tr>
                                {billing.trashFee > 0 && (
                                    <tr>
                                        <td className="py-4 font-medium text-gray-800">ค่าส่วนกลาง/ขยะ (Common Fee)</td>
                                        <td className="py-4 text-right">-</td>
                                        <td className="py-4 text-center">-</td>
                                        <td className="py-4 text-right font-mono font-bold text-gray-900">{billing.trashFee.toLocaleString()}</td>
                                    </tr>
                                )}
                                {billing.internetFee > 0 && (
                                    <tr>
                                        <td className="py-4 font-medium text-gray-800">ค่าอินเทอร์เน็ต (Internet)</td>
                                        <td className="py-4 text-right">-</td>
                                        <td className="py-4 text-center">-</td>
                                        <td className="py-4 text-right font-mono font-bold text-gray-900">{billing.internetFee.toLocaleString()}</td>
                                    </tr>
                                )}
                                {billing.otherFees > 0 && (
                                    <tr>
                                        <td className="py-4 font-medium text-gray-800">อื่นๆ (Other Fees)</td>
                                        <td className="py-4 text-right">-</td>
                                        <td className="py-4 text-center">-</td>
                                        <td className="py-4 text-right font-mono font-bold text-gray-900">{billing.otherFees.toLocaleString()}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Section: Totals, Payment, Signatures */}
                <div className="mt-auto">
                    {/* Totals */}
                    <div className="flex justify-end mb-8 border-t border-gray-300 pt-4">
                        <div className="w-1/3">
                            <div className="flex justify-between text-gray-600 mb-2">
                                <span>รวมเงิน (Subtotal)</span>
                                <span>{billing.totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-3xl font-bold mt-2 pt-2 border-t border-gray-200">
                                <span>ยอดสุทธิ</span>
                                <span style={{ color: themeColor }}>฿{billing.totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-end border-t-2 border-gray-100 pt-8">
                        {/* Payment / QR */}
                        <div className="w-2/3 pr-8">
                            {type === 'receipt' ? (
                                <div className="flex gap-6 items-center">
                                    <div className="border-4 border-red-500 rounded-lg p-3 px-6 transform rotate-[-8deg] opacity-80 mask-stamp">
                                        <span className="text-4xl font-black text-red-500 tracking-widest uppercase">PAID</span>
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-red-600">ชำระเงินเรียบร้อยแล้ว</p>
                                        <p className="text-gray-500 mt-1">วันที่ชำระ: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                </div>
                            ) : (
                                promptPayPayload && (
                                    <div className="flex gap-6 items-start">
                                        <div className="relative p-2 border-2 border-gray-200 rounded-xl bg-white">
                                            <QRCodeCanvas value={promptPayPayload} size={110} />
                                            {/* Corner Accents */}
                                            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-gray-800"></div>
                                            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-gray-800"></div>
                                            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-gray-800"></div>
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-gray-800"></div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-900 mb-1">สแกนชำระเงิน (Scan to Pay)</h4>
                                            <p className="text-sm text-gray-600 font-medium">{config.bankName}</p>
                                            <p className="text-sm text-gray-600">{config.bankAccountName}</p>
                                            <p className="text-lg font-mono font-bold text-gray-800 mt-1">{config.bankAccountNumber}</p>

                                            {config.invoiceNote ? (
                                                <p className="text-sm text-gray-500 italic mt-3 bg-gray-50 p-2 rounded border border-gray-100 max-w-sm">
                                                    Note: {config.invoiceNote}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-gray-400 italic mt-2">
                                                    กรุณาโอนชำระและส่งสลิปภายใน 5 วัน
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Signature */}
                        <div className="text-center w-48">
                            <div className="border-b-2 border-dotted border-gray-400 mb-2 h-16"></div>
                            <p className="text-sm font-bold text-gray-700">ผู้ดูแลหอพัก</p>
                            <p className="text-xs text-gray-500">(Dorm Manager)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
