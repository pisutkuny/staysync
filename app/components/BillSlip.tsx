"use client";

import { format } from "date-fns";
import { th } from "date-fns/locale";
import { QRCodeCanvas } from "qrcode.react";
import generatePayload from "promptpay-qr";

type Props = {
    roomNumber: string;
    residentName: string;
    billDate: Date;
    prevDate: Date;
    water: { last: number; curr: number; rate: number; total: number; unit: number };
    electric: { last: number; curr: number; rate: number; total: number; unit: number };
    trash: number;
    internet: number;
    other: number;
    total: number;
    header: { name: string; address: string };
    bankInfo: { name: string; acc: string; bank: string; promptPayId?: string | null };
};

export default function BillSlip({ data }: { data: Props }) {
    // Format Month/Year like the image: "11/68" (Thai Year)
    const thaiYear = data.billDate.getFullYear() + 543;
    const shortYear = thaiYear.toString().slice(-2);
    const month = data.billDate.getMonth() + 1;
    const dateStr = `${month}/${shortYear}`;

    // Prev Month for meters
    const prevMonthIdx = data.prevDate.getMonth() + 1;
    const prevDateStr = `${prevMonthIdx}/${shortYear}`;

    return (
        <div className="bg-white p-6 max-w-[400px] border border-slate-300 font-sans text-sm text-gray-900 mx-auto" id="bill-slip">
            <div className="text-center mb-4">
                <h3 className="font-bold text-lg">{data.header.name}</h3>
                <p className="text-xs">{data.header.address}</p>
                <h2 className="font-bold text-xl mt-2 underline decoration-double">ใบแจ้งค่าเช่า</h2>
            </div>

            <div className="flex justify-between border border-black p-2 mb-0 border-b-0">
                <div className="flex gap-2">
                    <span className="font-bold">ชื่อผู้เช่า</span>
                    <span>{data.residentName}</span>
                </div>
                <div className="flex gap-2">
                    <span className="font-bold">วันที่</span>
                    <span>{format(data.billDate, 'd/M/yy')}</span>
                </div>
            </div>
            <div className="flex gap-2 border border-black p-2 border-t-0 mb-4">
                <span className="font-bold">ห้องอยู่</span>
                <span className="font-bold text-lg">{data.roomNumber}</span>
            </div>

            <table className="w-full border-collapse border border-black text-center mb-4">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-1 w-12">ลำดับ</th>
                        <th className="border border-black p-1">รายการ</th>
                        <th className="border border-black p-1 w-16">หน่วย</th>
                        <th className="border border-black p-1 w-16">ราคา/หน่วย</th>
                        <th className="border border-black p-1 w-20">จำนวนเงิน</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border border-black p-1">1</td>
                        <td className="border border-black p-1 text-left px-2">ค่าเช่าเดือน {dateStr}</td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1">2,200</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1">2</td>
                        <td className="border border-black p-1 text-left px-2">
                            <div>ค่าไฟฟ้าเดือน {prevDateStr}</div>
                            <div className="text-xs text-gray-500">({data.electric.last} - {data.electric.curr})</div>
                        </td>
                        <td className="border border-black p-1">{data.electric.unit}</td>
                        <td className="border border-black p-1">{data.electric.rate}</td>
                        <td className="border border-black p-1">{data.electric.total.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1">3</td>
                        <td className="border border-black p-1 text-left px-2">
                            <div>ค่าน้ำเดือน {prevDateStr}</div>
                            <div className="text-xs text-gray-500">({data.water.last} - {data.water.curr})</div>
                        </td>
                        <td className="border border-black p-1">{data.water.unit}</td>
                        <td className="border border-black p-1">{data.water.rate}</td>
                        <td className="border border-black p-1">{data.water.total.toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1">4</td>
                        <td className="border border-black p-1 text-left px-2">ค่าเก็บขยะเดือน {dateStr}</td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1">{data.trash.toLocaleString()}</td>
                    </tr>
                    {data.internet > 0 && (
                        <tr>
                            <td className="border border-black p-1">5</td>
                            <td className="border border-black p-1 text-left px-2">ค่าอินเทอร์เน็ต</td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1">{data.internet.toLocaleString()}</td>
                        </tr>
                    )}
                    {data.other > 0 && (
                        <tr>
                            <td className="border border-black p-1">6</td>
                            <td className="border border-black p-1 text-left px-2">ค่าส่วนกลาง/อื่นๆ</td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1">{data.other.toLocaleString()}</td>
                        </tr>
                    )}
                    <tr className="font-bold bg-gray-100">
                        <td className="border border-black p-1" colSpan={4} align="right">จำนวนเงินรวม</td>
                        <td className="border border-black p-1">{data.total.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            <div className="text-xs mt-4 space-y-2">
                <p>1. กรณีโอนเงิน กรุณาโอนเงินเข้าบัญชี {data.bankInfo.name} และนำสลิปโอนเงินแจ้งทางผู้ให้เช่า</p>
                <div className="indent-8 text-sm">
                    <p className="font-bold">{data.bankInfo.bank} เลขบัญชี {data.bankInfo.acc}</p>
                    {data.bankInfo.promptPayId && (
                        <div className="mt-2 flex flex-col items-start">
                            <p className="font-bold text-indigo-800 mb-1">สแกนจ่าย (PromptPay):</p>
                            <QRCodeCanvas
                                value={generatePayload(data.bankInfo.promptPayId, { amount: data.total })}
                                size={120}
                                level={"L"}
                                includeMargin={false}
                            />
                            <p className="text-[10px] text-gray-700 mt-1">ยอดชำระ: {data.total.toLocaleString()} บาท</p>
                        </div>
                    )}
                </div>
                <p>2. ค่าเช่าชำระไม่เกิน 5 วัน หลังจากวันที่ครบกำหนดจ่าย</p>
            </div>

            <div className="mt-8 flex justify-end">
                <div className="text-center w-40">
                    <div className="border-b border-black mb-1 p-2"></div>
                    <span className="text-xs">ลงชื่อผู้รับเงิน</span>
                </div>
            </div>
        </div>
    );
}
