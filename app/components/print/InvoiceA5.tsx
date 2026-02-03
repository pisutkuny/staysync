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
        <div className="w-full h-[148mm] bg-white p-8 flex text-black relative border-b border-dashed border-gray-300 last:border-0 font-sans overflow-hidden">
            {/* Watermark Background */}
            {config.invoiceLogo && (
                <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    <img
                        src={config.invoiceLogo}
                        alt="Watermark"
                        className="w-[70%] h-auto object-contain opacity-[0.03] grayscale"
                    />
                </div>
            )}

            {/* Left Main Content */}
            <div className="flex-1 pr-8 flex flex-col relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4 items-start">
                        {/* Logo Top Left */}
                        {config.invoiceLogo ? (
                            <img src={config.invoiceLogo} alt="Logo" className="w-16 h-16 object-contain rounded-full border border-gray-100 shadow-sm" />
                        ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                                <span className="text-xs">No Logo</span>
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{config.dormName}</h2>
                            <p className="text-[10px] text-gray-500 max-w-[250px] leading-tight mt-1">{config.dormAddress}</p>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-800 uppercase">INVOICE</h1>
                </div>

                {/* Table */}
                <div className="flex-1">
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-100 text-gray-500 font-bold text-[10px] tracking-wider bg-white">
                            <tr>
                                <th className="py-2 text-left">รายการ</th>
                                <th className="py-2 text-right">ราคาต่อหน่วย</th>
                                <th className="py-2 text-center">จำนวน</th>
                                <th className="py-2 text-right">รวมเป็นเงิน</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                            <tr>
                                <td className="py-3">ค่าเช่าห้อง ({billing.room.number})</td>
                                <td className="py-3 text-right">{rentAmount.toLocaleString()}</td>
                                <td className="py-3 text-center">1</td>
                                <td className="py-3 text-right font-mono text-gray-900">{rentAmount.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="py-3">ค่าน้ำ Meter: {billing.waterMeterLast} → {billing.waterMeterCurrent}</td>
                                <td className="py-3 text-right">{billing.waterRate}</td>
                                <td className="py-3 text-center">{(billing.waterMeterCurrent - billing.waterMeterLast).toLocaleString()}</td>
                                <td className="py-3 text-right font-mono text-gray-900">{waterAmount.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="py-3">ค่าไฟ Meter: {billing.electricMeterLast} → {billing.electricMeterCurrent}</td>
                                <td className="py-3 text-right">{billing.electricRate}</td>
                                <td className="py-3 text-center">{(billing.electricMeterCurrent - billing.electricMeterLast).toLocaleString()}</td>
                                <td className="py-3 text-right font-mono text-gray-900">{electricAmount.toLocaleString()}</td>
                            </tr>
                            {billing.trashFee > 0 && (
                                <tr>
                                    <td className="py-3">ค่าจัดเก็บขยะมูลฝอย</td>
                                    <td className="py-3 text-right">{billing.trashFee.toLocaleString()}</td>
                                    <td className="py-3 text-center">1</td>
                                    <td className="py-3 text-right font-mono text-gray-900">{billing.trashFee.toLocaleString()}</td>
                                </tr>
                            )}
                            {billing.internetFee > 0 && (
                                <tr>
                                    <td className="py-3">ค่าอินเทอร์เน็ต</td>
                                    <td className="py-3 text-right">{billing.internetFee.toLocaleString()}</td>
                                    <td className="py-3 text-center">1</td>
                                    <td className="py-3 text-right font-mono text-gray-900">{billing.internetFee.toLocaleString()}</td>
                                </tr>
                            )}
                            {billing.otherFees > 0 && (
                                <tr>
                                    <td className="py-3">ค่าใช้จ่ายอื่นๆ</td>
                                    <td className="py-3 text-right">{billing.otherFees.toLocaleString()}</td>
                                    <td className="py-3 text-center">1</td>
                                    <td className="py-3 text-right font-mono text-gray-900">{billing.otherFees.toLocaleString()}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end mt-2 border-t border-gray-100 pt-2">
                    <div className="w-1/2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>รวมเงิน</span>
                            <span>{billing.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-gray-900 mt-1">
                            <span>ยอดสุทธิ</span>
                            <span style={{ color: themeColor }}>฿{billing.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Signature */}
                <div className="mt-auto pt-4">
                    <div className="flex justify-center mb-2">
                        <div className="text-center w-40">
                            <div className="border-b border-gray-300 mb-1 h-8"></div>
                            <p className="text-[10px] text-gray-400">ผู้รับเงิน / Collector</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-[30%] border-l border-gray-100 pl-6 flex flex-col gap-4 bg-gray-50/30 -my-8 py-8 -mr-8 pr-8 text-right">
                {/* QR Code Section */}
                {promptPayPayload && (
                    <div className="flex flex-col items-end">
                        <div className="relative inline-block p-1 border-2 border-gray-800 rounded-lg bg-white mb-2">
                            {/* Corner accents */}
                            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-gray-800"></div>
                            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-gray-800"></div>
                            <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-gray-800"></div>
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-gray-800"></div>
                            <QRCodeCanvas value={promptPayPayload} size={90} />
                        </div>

                        <div className="text-lg font-bold text-gray-900 leading-none" style={{ color: themeColor }}>
                            ฿{billing.totalAmount.toLocaleString()}
                        </div>
                        <p className="text-sm font-bold text-gray-800 mt-1">สแกนเพื่อชำระเงิน</p>

                        {/* Custom Note */}
                        {config.invoiceNote ? (
                            <p className="text-[9px] text-gray-500 italic mt-1 max-w-[150px] leading-tight">
                                {config.invoiceNote}
                            </p>
                        ) : (
                            <p className="text-[9px] text-gray-400 italic mt-1 max-w-[150px] leading-tight">
                                กรุณาโอนชำระและส่งสลิปยืนยันภายใน 5 วัน
                            </p>
                        )}
                    </div>
                )}

                {/* Spacing */}
                <div className="h-2"></div>

                {/* Issued To */}
                <div className="text-right">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-1">ออกให้แก่ :</h3>
                    <p className="font-bold text-gray-900 text-sm">{resident?.fullName || "Guest"}</p>
                    <p className="text-xs text-gray-500">{resident?.phone || "-"}</p>
                    <p className="text-xs text-gray-500">ห้อง {billing.room.number}</p>
                </div>

                {/* Invoice Details */}
                <div className="space-y-2 text-right">
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase">เลขที่เอกสาร</h3>
                        <p className="font-mono text-xs text-gray-900 font-bold">INV/#{billing.id.toString().padStart(6, '0')}</p>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase">วันที่</h3>
                        <p className="text-xs text-gray-900">{new Date(billing.createdAt).toLocaleDateString('th-TH')}</p>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase">ประเภท</h3>
                        <p className="text-xs text-indigo-600 font-bold">
                            {copyType === 'ORIGINAL (Customer)' ? 'ต้นฉบับ (ลูกค้า)' : 'สำเนา (ร้านค้า)'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
