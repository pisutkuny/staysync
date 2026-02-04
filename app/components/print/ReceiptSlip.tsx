"use client";

import generatePayload from 'promptpay-qr';
import { QRCodeCanvas } from 'qrcode.react';

export default function ReceiptSlip({ billing, resident, config }: { billing: any, resident: any, config: any }) {
    // Calculate Amounts safely
    const waterAmount = (billing.waterMeterCurrent - billing.waterMeterLast) * billing.waterRate;
    const electricAmount = (billing.electricMeterCurrent - billing.electricMeterLast) * billing.electricRate;
    const rentAmount = billing.totalAmount - (waterAmount + electricAmount + (billing.trashFee || 0) + (billing.otherFees || 0) + (billing.internetFee || 0));

    const promptPayPayload = config.promptPayId
        ? generatePayload(config.promptPayId, { amount: billing.totalAmount })
        : "";

    return (
        <div className="w-[80mm] bg-white p-4 mx-auto text-black font-sans text-xs leading-relaxed relative">

            {/* Header */}
            <div className="text-center mb-4 pb-4 border-b-2 border-dashed border-gray-400">
                {config.invoiceLogo && (
                    <img src={config.invoiceLogo} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-2 rounded-full border border-gray-200" />
                )}
                <h1 className="font-bold text-lg text-gray-900 leading-tight">{config.dormName}</h1>
                <p className="text-[10px] text-gray-600 mt-1 px-2 leading-snug">{config.dormAddress}</p>
            </div>

            {/* Document Details */}
            <div className="flex justify-between items-end mb-4 text-[10px] text-gray-600 font-medium">
                <div className="text-left">
                    <div className="text-gray-900 font-bold text-base">ห้อง {billing.room.number}</div>
                    <div>{resident?.fullName || "Guest"}</div>
                </div>
                <div className="text-right">
                    <div>INV #{billing.id.toString().padStart(6, '0')}</div>
                    <div>{new Date(billing.createdAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })}</div>
                </div>
            </div>

            {/* Item List */}
            <div className="mb-4">
                <table className="w-full text-right">
                    <thead className="text-[9px] text-gray-500 border-b border-gray-300">
                        <tr>
                            <th className="py-1 text-left font-normal">รายการ</th>
                            <th className="py-1 font-normal">หน่วย</th>
                            <th className="py-1 font-normal">บาท</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-800">
                        <tr>
                            <td className="py-1 text-left">ค่าเช่าห้อง</td>
                            <td className="py-1 text-center">-</td>
                            <td className="py-1 font-bold">{rentAmount.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td className="py-1 text-left">
                                ค่าน้ำ <span className="text-[9px] text-gray-400">({billing.waterMeterLast}→{billing.waterMeterCurrent})</span>
                            </td>
                            <td className="py-1 text-center">{(billing.waterMeterCurrent - billing.waterMeterLast)}</td>
                            <td className="py-1 font-bold">{waterAmount.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td className="py-1 text-left">
                                ค่าไฟ <span className="text-[9px] text-gray-400">({billing.electricMeterLast}→{billing.electricMeterCurrent})</span>
                            </td>
                            <td className="py-1 text-center">{(billing.electricMeterCurrent - billing.electricMeterLast)}</td>
                            <td className="py-1 font-bold">{electricAmount.toLocaleString()}</td>
                        </tr>
                        {billing.trashFee > 0 && (
                            <tr>
                                <td className="py-1 text-left">ค่าขยะ</td>
                                <td className="py-1 text-center">-</td>
                                <td className="py-1 font-bold">{billing.trashFee.toLocaleString()}</td>
                            </tr>
                        )}
                        {billing.otherFees > 0 && (
                            <tr>
                                <td className="py-1 text-left">อื่นๆ</td>
                                <td className="py-1 text-center">-</td>
                                <td className="py-1 font-bold">{billing.otherFees.toLocaleString()}</td>
                            </tr>
                        )}
                        {billing.internetFee > 0 && (
                            <tr>
                                <td className="py-1 text-left">อินเทอร์เน็ต</td>
                                <td className="py-1 text-center">-</td>
                                <td className="py-1 font-bold">{billing.internetFee.toLocaleString()}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Total */}
            <div className="border-t-2 border-dashed border-gray-800 pt-3 pb-6 mb-2">
                <div className="flex justify-between items-center">
                    <span className="font-bold text-sm uppercase">ยอดสุทธิ (Total)</span>
                    <span className="font-black text-2xl">฿{billing.totalAmount.toLocaleString()}</span>
                </div>
            </div>

            {/* QR Code Section */}
            {promptPayPayload && (
                <div className="text-center mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="inline-block bg-white p-2 border border-black rounded-lg mb-2 relative">
                        <QRCodeCanvas value={promptPayPayload} size={130} />
                        {/* Corner accents for style */}
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-black"></div>
                        <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-black"></div>
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-black"></div>
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-black"></div>
                    </div>

                    <div className="text-xs font-bold text-gray-800">SCAN TO PAY</div>
                    <div className="text-[10px] text-gray-500 mt-1">{config.bankName}</div>
                    <div className="text-[10px] text-gray-500">{config.bankAccountName}</div>
                    <div className="text-sm font-mono font-bold mt-1 tracking-wider">{config.bankAccountNumber}</div>

                    {config.invoiceNote && (
                        <div className="mt-3 text-[9px] italic text-gray-500 border-t border-gray-200 pt-2">
                            {config.invoiceNote}
                        </div>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="text-center text-[9px] text-gray-400 space-y-1">
                <p>ขอบคุณที่ใช้บริการ</p>
                <p>Generated by StaySync</p>
            </div>
        </div>
    );
}
