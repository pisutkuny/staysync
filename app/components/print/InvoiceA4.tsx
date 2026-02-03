import generatePayload from 'promptpay-qr';
import { QRCodeCanvas } from 'qrcode.react';

export default function InvoiceA4({ billing, resident, config }: { billing: any, resident: any, config: any }) {
    const promptPayPayload = config.promptPayId
        ? generatePayload(config.promptPayId, { amount: billing.totalAmount })
        : "";

    return (
        <div className="w-[210mm] h-[297mm] bg-white p-12 mx-auto text-black print:w-full print:h-full">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
                <div>
                    <h1 className="text-4xl font-bold uppercase tracking-wide text-gray-900">{config.dormName}</h1>
                    <p className="mt-2 text-gray-600 whitespace-pre-line">{config.dormAddress}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-indigo-600">INVOICE</h2>
                    <p className="font-mono text-gray-500 mt-1">#{billing.id.toString().padStart(6, '0')}</p>
                    <p className="text-sm text-gray-500 mt-1">Date: {new Date(billing.createdAt).toLocaleDateString('th-TH')}</p>
                </div>
            </div>

            {/* Bill To */}
            <div className="mb-10">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
                <div className="text-xl font-bold text-gray-900">Room {billing.room.number}</div>
                <p className="text-gray-600">{resident?.fullName || "Guest Resident"}</p>
            </div>

            {/* Table */}
            <div className="mb-12">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="py-3 text-left font-bold text-gray-600">Description</th>
                            <th className="py-3 text-center font-bold text-gray-600">Unit Price</th>
                            <th className="py-3 text-center font-bold text-gray-600">Quantity</th>
                            <th className="py-3 text-right font-bold text-gray-600">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {/* Rent */}
                        <tr>
                            <td className="py-4">Room Rent</td>
                            <td className="py-4 text-center">-</td>
                            <td className="py-4 text-center">1 Month</td>
                            <td className="py-4 text-right font-mono">{billing.rentAmount.toLocaleString()}</td>
                        </tr>
                        {/* Water */}
                        <tr>
                            <td className="py-4">
                                Water Usage
                                <div className="text-xs text-gray-400 mt-1">
                                    Meter: {billing.waterMeterBefore} → {billing.waterMeterAfter}
                                </div>
                            </td>
                            <td className="py-4 text-center">{billing.waterRate}</td>
                            <td className="py-4 text-center">{billing.waterUsage} Unit</td>
                            <td className="py-4 text-right font-mono">{billing.waterAmount.toLocaleString()}</td>
                        </tr>
                        {/* Electric */}
                        <tr>
                            <td className="py-4">
                                Electric Usage
                                <div className="text-xs text-gray-400 mt-1">
                                    Meter: {billing.electricMeterBefore} → {billing.electricMeterAfter}
                                </div>
                            </td>
                            <td className="py-4 text-center">{billing.electricRate}</td>
                            <td className="py-4 text-center">{billing.electricUsage} Unit</td>
                            <td className="py-4 text-right font-mono">{billing.electricAmount.toLocaleString()}</td>
                        </tr>
                        {/* Others */}
                        {billing.trashAmount > 0 && (
                            <tr>
                                <td className="py-4">Trash Collection Fee</td>
                                <td className="py-4 text-center">-</td>
                                <td className="py-4 text-center">-</td>
                                <td className="py-4 text-right font-mono">{billing.trashAmount.toLocaleString()}</td>
                            </tr>
                        )}
                        {billing.otherAmount > 0 && (
                            <tr>
                                <td className="py-4">Other Fees</td>
                                <td className="py-4 text-center">-</td>
                                <td className="py-4 text-center">-</td>
                                <td className="py-4 text-right font-mono">{billing.otherAmount.toLocaleString()}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Summary & Payment */}
            <div className="flex justify-between items-end border-t-2 border-gray-800 pt-8">
                <div>
                    {promptPayPayload && (
                        <div className="flex gap-4 items-center">
                            <div className="bg-white p-2 border border-gray-200 rounded-lg">
                                <QRCodeCanvas value={promptPayPayload} size={100} />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-gray-900">Scan to Pay</p>
                                <p className="text-xs text-gray-500">{config.bankName} - {config.bankAccountName}</p>
                                <p className="text-xs text-gray-500 font-mono">{config.bankAccountNumber}</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-gray-500 mb-2">Total Amount Due</p>
                    <p className="text-5xl font-bold text-indigo-600">฿{billing.totalAmount.toLocaleString()}</p>
                    <p className="text-sm text-gray-400 mt-2 italic">Thank you for your business</p>
                </div>
            </div>
        </div>
    );
}
