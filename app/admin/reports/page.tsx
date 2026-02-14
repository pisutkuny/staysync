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
    const [dormName, setDormName] = useState("StaySync Dormitory");

    useEffect(() => {
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                if (data.dormName) setDormName(data.dormName);
            })
            .catch(err => console.error("Failed to load settings", err));
    }, []);

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
            <div className="mb-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 md:p-8 shadow-xl print:hidden text-white relative overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-32 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full -ml-10 -mb-20 blur-2xl pointer-events-none"></div>

                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 relative z-10">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold flex items-center gap-3 drop-shadow-md">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm shadow-inner">
                                <FileText className="text-white" size={24} />
                            </div>
                            Monthly Financial Report
                        </h1>
                        <p className="text-indigo-100 mt-2 text-sm md:text-base font-medium opacity-90 pl-1">
                            รายงานสรุปรายรับ-รายจ่ายประจำเดือน
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto bg-white/10 p-2 md:p-3 rounded-2xl backdrop-blur-md border border-white/20 shadow-lg">
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="border border-indigo-200/50 bg-white/95 text-indigo-900 rounded-xl px-4 py-2.5 text-sm w-full sm:w-auto focus:ring-4 focus:ring-indigo-500/30 outline-none font-semibold shadow-sm"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={fetchReport}
                                className="bg-white text-indigo-700 px-5 py-2.5 rounded-xl hover:bg-indigo-50 font-bold shadow-sm hover:shadow-md transition-all text-sm flex-1 sm:flex-none flex items-center gap-2 justify-center"
                            >
                                <Loader2 size={16} className={loading ? "animate-spin" : "hidden"} />
                                Refresh
                            </button>
                            <button
                                onClick={handlePrint}
                                className="bg-indigo-900/40 text-white border border-white/30 px-5 py-2.5 rounded-xl hover:bg-indigo-900/60 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none transition-all font-semibold"
                            >
                                <Printer size={18} /> Print
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>
            ) : data ? (
                /* Report Container - Visible on Print */
                <div id="printable-area" className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-gray-900 print:shadow-none print:border-none print:p-0 print:absolute print:top-0 print:left-0 print:w-full print:m-0 print:text-sm">

                    {/* Report Header - Print Only Formal Header */}
                    <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            {/* Optional: Add Logo here if available */}
                            <h1 className="text-2xl font-bold text-black uppercase tracking-wide">{dormName}</h1>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">Monthly Financial Report (รายงานสรุปรายรับ-รายจ่าย)</h2>
                        <div className="mt-4 flex justify-between text-sm text-gray-600">
                            <span>Month: {format(new Date(month + "-01"), "MMMM yyyy", { locale: th })}</span>
                            <span>Printed on: {new Date().toLocaleString('th-TH')}</span>
                        </div>
                    </div>

                    {/* Report Header - Web Only (Hidden in Print) */}
                    <div className="text-center mb-8 border-b-2 border-gray-800 pb-4 print:hidden">
                        <h2 className="text-xl md:text-3xl font-bold uppercase tracking-wide">รายงานสรุปประจำเดือน</h2>
                        <p className="text-lg text-gray-600 mt-2">
                            {format(new Date(month + "-01"), "MMMM yyyy", { locale: th })}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">Generated: {new Date().toLocaleString('th-TH')}</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 print:mb-2 print-grid-3">
                        <div className="bg-green-50 p-3 md:p-4 rounded-xl border border-green-100 print:print-no-border print:p-0">
                            <h3 className="text-green-800 text-xs md:text-sm font-semibold uppercase flex items-center gap-2">
                                <TrendingUp size={14} className="md:hidden" />
                                <TrendingUp size={16} className="hidden md:block" />
                                <span className="truncate">รายรับรวม (Total Income)</span>
                            </h3>
                            <p className="text-2xl md:text-3xl font-bold text-green-700 mt-2 print:text-xl">฿{data.income?.total?.toLocaleString()}</p>
                            <p className="text-xs text-green-600 mt-1">จากบิลที่ชำระแล้ว ({data.stats?.paidBills} บิล)</p>
                        </div>
                        <div className="bg-red-50 p-3 md:p-4 rounded-xl border border-red-100 print:print-no-border print:p-0">
                            <h3 className="text-red-800 text-xs md:text-sm font-semibold uppercase flex items-center gap-2">
                                <TrendingDown size={14} className="md:hidden" />
                                <TrendingDown size={16} className="hidden md:block" />
                                <span className="truncate">รายจ่าย (Expenses)</span>
                            </h3>
                            <p className="text-2xl md:text-3xl font-bold text-red-700 mt-2 print:text-xl">฿{data.expenses?.total?.toLocaleString()}</p>
                            <p className="text-xs text-red-600 mt-1 truncate">ค่าน้ำ/ไฟ ส่วนกลาง</p>
                        </div>
                        <div className="bg-blue-50 p-3 md:p-4 rounded-xl border border-blue-100 print:print-no-border print:p-0">
                            <h3 className="text-blue-800 text-xs md:text-sm font-semibold uppercase flex items-center gap-2">
                                <DollarSign size={14} className="md:hidden" />
                                <DollarSign size={16} className="hidden md:block" />
                                <span className="truncate">กำไรสุทธิ (Net Profit)</span>
                            </h3>
                            <p className="text-2xl md:text-3xl font-bold text-blue-700 mt-2 print:text-xl">
                                ฿{(data.income?.total - data.expenses?.total).toLocaleString()}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">รายรับ - รายจ่าย</p>
                        </div>
                    </div>

                    {/* Power Bar Chart Section */}
                    <div className="mb-8 p-6 border rounded-3xl bg-white shadow-sm print:shadow-none print:border-gray-300 print:break-inside-avoid print:p-2 print:mb-4">
                        <h4 className="font-bold text-lg mb-6 text-center print:text-base print:mb-4 flex items-center justify-center gap-2">
                            <TrendingUp className="text-indigo-600 print:hidden" size={20} />
                            เปรียบเทียบ รายรับ-รายจ่าย (Financial Overview)
                        </h4>

                        {(() => {
                            const maxVal = Math.max(data.income?.total || 0, data.expenses?.total || 0, 1);
                            const incomePercent = Math.min(((data.income?.total || 0) / maxVal) * 100, 100);
                            const expensePercent = Math.min(((data.expenses?.total || 0) / maxVal) * 100, 100);

                            return (
                                <div className="space-y-8 print:space-y-2">
                                    {/* Income Power Bar */}
                                    <div className="relative">
                                        <div className="flex justify-between text-sm md:text-base font-bold mb-2">
                                            <span className="flex items-center gap-2 text-emerald-700">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500 print:hidden"></div>
                                                รายรับ (Income)
                                            </span>
                                            <span className="text-emerald-700">฿{data.income?.total?.toLocaleString()}</span>
                                        </div>
                                        <div className="h-8 md:h-10 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200 print:border-gray-300 print:bg-white print:h-4 relative">
                                            {/* Pattern Overlay for Texture */}
                                            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] pointer-events-none print:hidden"></div>

                                            <div
                                                style={{ width: `${incomePercent}%` }}
                                                className="h-full bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 rounded-full shadow-lg print:bg-green-600 print:shadow-none transition-all duration-1000 ease-out flex items-center relative"
                                            >
                                                {/* Glossy Effect */}
                                                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30 rounded-t-full pointer-events-none print:hidden"></div>

                                                {/* Percentage Label inside bar if wide enough */}
                                                {incomePercent > 15 && (
                                                    <span className="absolute right-3 text-white text-xs font-bold drop-shadow-md print:hidden">{incomePercent.toFixed(0)}%</span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 text-right print:hidden"> Based on paid bills </p>
                                    </div>

                                    {/* Expense Power Bar */}
                                    <div className="relative">
                                        <div className="flex justify-between text-sm md:text-base font-bold mb-2">
                                            <span className="flex items-center gap-2 text-rose-700">
                                                <div className="w-3 h-3 rounded-full bg-rose-500 print:hidden"></div>
                                                รายจ่าย (Expenses)
                                            </span>
                                            <span className="text-rose-700">฿{data.expenses?.total?.toLocaleString()}</span>
                                        </div>
                                        <div className="h-8 md:h-10 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200 print:border-gray-300 print:bg-white print:h-4 relative">
                                            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] pointer-events-none print:hidden"></div>

                                            <div
                                                style={{ width: `${expensePercent}%` }}
                                                className="h-full bg-gradient-to-r from-rose-400 via-red-500 to-pink-600 rounded-full shadow-lg print:bg-red-600 print:shadow-none transition-all duration-1000 ease-out flex items-center relative"
                                            >
                                                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30 rounded-t-full pointer-events-none print:hidden"></div>

                                                {expensePercent > 15 && (
                                                    <span className="absolute right-3 text-white text-xs font-bold drop-shadow-md print:hidden">{expensePercent.toFixed(0)}%</span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 text-right print:hidden"> Utilities + Common fees </p>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 print:mb-2 print-grid-2">
                        <div className="print:break-inside-avoid border print:border-gray-200 p-4 rounded-lg">
                            <h4 className="font-bold text-base md:text-lg mb-4 border-b pb-2 print:text-sm print:mb-2">รายรับ (Income Breakdown)</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs md:text-sm print:text-xs">
                                    <tbody>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-600 pr-2 print:py-1">ค่าเช่าห้อง</td>
                                            <td className="py-2 text-right font-medium whitespace-nowrap print:py-1">฿{data.income?.rent?.toLocaleString()}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-600 pr-2 print:py-1">ค่าน้ำ</td>
                                            <td className="py-2 text-right font-medium whitespace-nowrap print:py-1">฿{data.income?.water?.toLocaleString()}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-600 pr-2 print:py-1">ค่าไฟ</td>
                                            <td className="py-2 text-right font-medium whitespace-nowrap print:py-1">฿{data.income?.electric?.toLocaleString()}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-600 pr-2 print:py-1">ค่าส่วนกลาง</td>
                                            <td className="py-2 text-right font-medium whitespace-nowrap print:py-1">฿{data.income?.common?.toLocaleString()}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-600 pr-2 print:py-1">ค่าขยะ/อื่นๆ</td>
                                            <td className="py-2 text-right font-medium whitespace-nowrap print:py-1">฿{(data.income?.trash + data.income?.other + data.income?.internet).toLocaleString()}</td>
                                        </tr>
                                        <tr className="font-bold text-sm md:text-base bg-gray-50 print:bg-gray-100">
                                            <td className="py-2 pl-2 print:py-1">รวมรายรับ</td>
                                            <td className="py-2 pr-2 text-right whitespace-nowrap print:py-1">฿{data.income?.total?.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="print:break-inside-avoid border print:border-gray-200 p-4 rounded-lg">
                            <h4 className="font-bold text-base md:text-lg mb-4 border-b pb-2 print:text-sm print:mb-2">รายจ่าย (Expenses)</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs md:text-sm print:text-xs">
                                    <tbody>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-600 pr-2 print:py-1">บิลค่าน้ำ (ประปา)</td>
                                            <td className="py-2 text-right font-medium text-red-600 whitespace-nowrap print:py-1">-฿{data.expenses?.waterBill?.toLocaleString()}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-600 pr-2 print:py-1">บิลค่าไฟ (การไฟฟ้า)</td>
                                            <td className="py-2 text-right font-medium text-red-600 whitespace-nowrap print:py-1">-฿{data.expenses?.electricBill?.toLocaleString()}</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-600 pr-2 print:py-1">ค่าขยะ/เน็ต</td>
                                            <td className="py-2 text-right font-medium text-red-600 whitespace-nowrap print:py-1">-฿{(data.expenses?.trashBill + data.expenses?.internetBill).toLocaleString()}</td>
                                        </tr>
                                        <tr className="font-bold text-sm md:text-base bg-gray-50 print:bg-gray-100">
                                            <td className="py-2 pl-2 print:py-1">รวมรายจ่าย</td>
                                            <td className="py-2 pr-2 text-right text-red-700 whitespace-nowrap print:py-1">-฿{data.expenses?.total?.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 md:mt-8 print:mt-4">
                                <h4 className="font-bold text-base md:text-lg mb-4 border-b pb-2 print:text-sm print:mb-2">สถิติ (Stats)</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs md:text-sm print:text-xs">
                                        <tbody>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 text-gray-600 pr-2 print:py-1">น้ำรวม</td>
                                                <td className="py-2 text-right font-medium whitespace-nowrap print:py-1">{data.usage?.waterUnits?.toLocaleString()} หน่วย</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 text-gray-600 pr-2 print:py-1">ไฟรวม</td>
                                                <td className="py-2 text-right font-medium whitespace-nowrap print:py-1">{data.usage?.electricUnits?.toLocaleString()} หน่วย</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 text-gray-600 pr-2 print:py-1">สถานะบิล</td>
                                                <td className="py-2 text-right whitespace-nowrap print:py-1">
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
                    <div className="text-center text-xs text-gray-400 mt-12 border-t py-4 hidden print:block print:mt-4 print:py-2">
                        Monthly Report generated by StaySync Dorm Management System
                    </div>
                </div>
            ) : null}

            @media print {
                @page {size: A4; margin: 10mm; }
            body {-webkit - print - color - adjust: exact; background-color: white !important; font-size: 14px; }
            nav, header, aside, .print\\:hidden {display: none !important; }
            #printable-area {width: 100% !important; margin: 0 !important; margin-top: 20px !important; padding: 0 !important; }
            .recharts-wrapper { break-inside: avoid; }

            /* Force Grid for Print */
            .print-grid-3 {
                display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 12px !important;
                    }
            .print-grid-2 {
                display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
                    }

            /* Hide borders on summary cards for cleaner look if requested */
            .print-no-border {
                border: none !important;
            background: none !important;
                    }

            /* Compact Headings but larger than before */
            h1 {font - size: 20px !important; margin-bottom: 8px !important; }
            h2 {font - size: 16px !important; margin-bottom: 6px !important; }
            h3 {font - size: 15px !important; }
            h4 {font - size: 15px !important; margin-bottom: 6px !important; }
            p {margin - bottom: 4px !important; }
            td, th {padding - top: 4px !important; padding-bottom: 4px !important; }
                }
            `}</style>
        </div >
    );
}
