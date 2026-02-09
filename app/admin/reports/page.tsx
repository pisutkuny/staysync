"use client";

import { useState, useEffect } from "react";
import { Loader2, Printer, FileText, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function ReportsPage() {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/monthly?month=${month}`);
            if (res.ok) {
                const reportData = await res.json();
                console.log("Report Data:", reportData);
                setData(reportData);
            }
        } catch (error) {
            console.error("Failed to load report", error);
            alert("Failed to load report");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [month]);

    const handlePrint = () => {
        window.print();
    };

    // Prepare chart data for single month
    const chartData = data ? [
        { name: 'รายรับ (Income)', amount: data.income?.total || 0, color: '#10b981' },
        { name: 'รายจ่าย (Expense)', amount: data.expenses?.total || 0, color: '#ef4444' }
    ] : [];

    return (
        <div className="p-6">
            {/* Controls - Hidden on Print */}
            <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4 print:hidden">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="text-indigo-600" size={20} />
                        Monthly Financial Report
                    </h1>
                    <p className="text-sm md:text-base text-gray-500">รายงานสรุปรายรับ-รายจ่ายประจำเดือน</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full md:w-auto">
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={fetchReport}
                            className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 text-sm flex-1 sm:flex-none"
                        >
                            Refresh
                        </button>
                        <button
                            onClick={handlePrint}
                            className="bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-900 flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
                        >
                            <Printer size={16} /> Print
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>
            ) : data ? (
                /* Report Container - Visible on Print */
                <div id="printable-area" className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-gray-900 print:shadow-none print:border-none print:p-0 print:absolute print:top-0 print:left-0 print:w-full print:m-0">

                    {/* Report Header */}
                    <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
                        <h2 className="text-3xl font-bold uppercase tracking-wide">รายงานสรุปประจำเดือน</h2>
                        <p className="text-lg text-gray-600 mt-2">
                            {format(new Date(month + "-01"), "MMMM yyyy", { locale: th })}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">Generated: {new Date().toLocaleString('th-TH')}</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                        <div className="bg-green-50 p-3 md:p-4 rounded-xl border border-green-100 print:border print:border-gray-300">
                            <h3 className="text-green-800 text-xs md:text-sm font-semibold uppercase flex items-center gap-2">
                                <TrendingUp size={14} className="md:hidden" />
                                <TrendingUp size={16} className="hidden md:block" />
                                <span className="truncate">รายรับรวม (Total Income)</span>
                            </h3>
                            <p className="text-2xl md:text-3xl font-bold text-green-700 mt-2">฿{data.income?.total?.toLocaleString()}</p>
                            <p className="text-xs text-green-600 mt-1">จากบิลที่ชำระแล้ว ({data.stats?.paidBills} บิล)</p>
                        </div>
                        <div className="bg-red-50 p-3 md:p-4 rounded-xl border border-red-100 print:border print:border-gray-300">
                            <h3 className="text-red-800 text-xs md:text-sm font-semibold uppercase flex items-center gap-2">
                                <TrendingDown size={14} className="md:hidden" />
                                <TrendingDown size={16} className="hidden md:block" />
                                <span className="truncate">รายจ่าย (Expenses)</span>
                            </h3>
                            <p className="text-2xl md:text-3xl font-bold text-red-700 mt-2">฿{data.expenses?.total?.toLocaleString()}</p>
                            <p className="text-xs text-red-600 mt-1 truncate">ค่าน้ำ/ไฟ ส่วนกลาง</p>
                        </div>
                        <div className="bg-blue-50 p-3 md:p-4 rounded-xl border border-blue-100 print:border print:border-gray-300">
                            <h3 className="text-blue-800 text-xs md:text-sm font-semibold uppercase flex items-center gap-2">
                                <DollarSign size={14} className="md:hidden" />
                                <DollarSign size={16} className="hidden md:block" />
                                <span className="truncate">กำไรสุทธิ (Net Profit)</span>
                            </h3>
                            <p className="text-2xl md:text-3xl font-bold text-blue-700 mt-2">
                                ฿{(data.income?.total - data.expenses?.total).toLocaleString()}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">รายรับ - รายจ่าย</p>
                        </div>
                    </div>

                    {/* Single Month Chart Section */}
                    <div className="mb-8 p-4 border rounded-xl print:break-inside-avoid">
                        <h4 className="font-bold text-lg mb-4 text-center">แผนภูมิเปรียบเทียบ รายรับ-รายจ่าย (Financial Overview)</h4>
                        <div className="h-[300px] w-full flex justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 20,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    {/* @ts-ignore */}
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                                    <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
                        <div className="print:break-inside-avoid">
                            <h4 className="font-bold text-base md:text-lg mb-4 border-b pb-2">รายรับ (Income Breakdown</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs md:text-sm">
                                    <tbody>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-600 pr-2">ค่าเช่าห้อง</td>
                                            <td className="py-2 text-right font-medium whitespace-nowrap">฿{data.income?.rent?.toLocaleString()}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-600 pr-2">ค่าน้ำ</td>
                                            <td className="py-2 text-right font-medium whitespace-nowrap">฿{data.income?.water?.toLocaleString()}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-600 pr-2">ค่าไฟ</td>
                                            <td className="py-2 text-right font-medium whitespace-nowrap">฿{data.income?.electric?.toLocaleString()}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-600 pr-2">ค่าส่วนกลาง</td>
                                            <td className="py-2 text-right font-medium whitespace-nowrap">฿{data.income?.common?.toLocaleString()}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-600 pr-2">ค่าขยะ/อื่นๆ</td>
                                            <td className="py-2 text-right font-medium whitespace-nowrap">฿{(data.income?.trash + data.income?.other + data.income?.internet).toLocaleString()}</td>
                                        </tr>
                                        <tr className="font-bold text-sm md:text-base bg-gray-50">
                                            <td className="py-2 pl-2">รวมรายรับ</td>
                                            <td className="py-2 pr-2 text-right whitespace-nowrap">฿{data.income?.total?.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="print:break-inside-avoid">
                            <h4 className="font-bold text-base md:text-lg mb-4 border-b pb-2">รายจ่าย (Expenses)</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs md:text-sm">
                                    <tbody>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-600 pr-2">บิลค่าน้ำ (ประปา)</td>
                                            <td className="py-2 text-right font-medium text-red-600 whitespace-nowrap">-฿{data.expenses?.waterBill?.toLocaleString()}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-600 pr-2">บิลค่าไฟ (การไฟฟ้า)</td>
                                            <td className="py-2 text-right font-medium text-red-600 whitespace-nowrap">-฿{data.expenses?.electricBill?.toLocaleString()}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-600 pr-2">ค่าขยะ/เน็ต</td>
                                            <td className="py-2 text-right font-medium text-red-600 whitespace-nowrap">-฿{(data.expenses?.trashBill + data.expenses?.internetBill).toLocaleString()}</td>
                                        </tr>
                                        <tr className="font-bold text-sm md:text-base bg-gray-50">
                                            <td className="py-2 pl-2">รวมรายจ่าย</td>
                                            <td className="py-2 pr-2 text-right text-red-700 whitespace-nowrap">-฿{data.expenses?.total?.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 md:mt-8">
                                <h4 className="font-bold text-base md:text-lg mb-4 border-b pb-2">สถิติ (Stats)</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs md:text-sm">
                                        <tbody>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 text-gray-600 pr-2">น้ำรวม</td>
                                                <td className="py-2 text-right font-medium whitespace-nowrap">{data.usage?.waterUnits?.toLocaleString()} หน่วย</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 text-gray-600 pr-2">ไฟรวม</td>
                                                <td className="py-2 text-right font-medium whitespace-nowrap">{data.usage?.electricUnits?.toLocaleString()} หน่วย</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 text-gray-600 pr-2">สถานะบิล</td>
                                                <td className="py-2 text-right whitespace-nowrap">
                                                    <span className="text-green-600 font-bold">{data.stats?.paidBills} จ่าย</span> /
                                                    <span className="text-red-500 font-bold ml-1">{data.stats?.unpaidBills} ค้าง</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer for Print */}
                    <div className="text-center text-xs text-gray-400 mt-12 border-t py-4 hidden print:block">
                        Monthly Report generated by StaySync Dorm Management System
                    </div>
                </div>
            ) : null}

            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; }
                    nav, header, aside, .print\\:hidden { display: none !important; }
                    #printable-area { display: block !important; position: absolute; top: 0; left: 0; width: 100%; margin: 0; padding: 20px; box-shadow: none; border: none; }
                    .recharts-wrapper { break-inside: avoid; }
                }
            `}</style>
        </div>
    );
}
