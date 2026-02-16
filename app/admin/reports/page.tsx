"use client";

import { useState, useEffect } from "react";
import { Loader2, Printer, FileText, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ReportsPage() {
    const { language, t } = useLanguage();
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [dormName, setDormName] = useState("StaySync Dormitory");

    // Derived locale for date formatting
    const dateLocale = language === 'TH' ? th : enUS;

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
        { name: language === 'TH' ? 'รายรับ (Income)' : 'Income', amount: data.income?.total || 0, color: '#10b981' },
        { name: language === 'TH' ? 'รายจ่าย (Expense)' : 'Expense', amount: data.expenses?.total || 0, color: '#ef4444' }
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
                            {language === 'TH' ? 'รายงานรายรับ-รายจ่ายประจำเดือน' : 'Monthly Financial Report'}
                        </h1>
                        <p className="text-indigo-100 mt-2 text-sm md:text-base font-medium opacity-90 pl-1">
                            {language === 'TH' ? 'สรุปข้อมูลการเงินของหอพัก' : 'Dormitory Financial Summary'}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto bg-white/10 p-2 md:p-3 rounded-2xl backdrop-blur-md border border-white/20 shadow-lg">
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="border border-indigo-200/50 bg-white/95 text-indigo-900 rounded-xl px-4 py-2.5 text-sm w-full sm:w-auto focus:ring-4 focus:ring-indigo-500/30 outline-none font-semibold shadow-sm [color-scheme:light]"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={fetchReport}
                                className="bg-white text-indigo-700 px-5 py-2.5 rounded-xl hover:bg-indigo-50 font-bold shadow-sm hover:shadow-md transition-all text-sm flex-1 sm:flex-none flex items-center gap-2 justify-center"
                            >
                                <Loader2 size={16} className={loading ? "animate-spin" : "hidden"} />
                                {language === 'TH' ? 'รีเฟรช' : 'Refresh'}
                            </button>
                            <button
                                onClick={handlePrint}
                                className="bg-indigo-900/40 text-white border border-white/30 px-5 py-2.5 rounded-xl hover:bg-indigo-900/60 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none transition-all font-semibold"
                            >
                                <Printer size={18} /> {language === 'TH' ? 'พิมพ์' : 'Print'}
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
                    <div className="hidden print:block text-center mb-8">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            {/* Optional: Add Logo here if available */}
                            <h1 className="text-2xl font-bold text-black uppercase tracking-wide">{dormName}</h1>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            {language === 'TH' ? 'รายงานสรุปรายรับ-รายจ่ายประจำเดือน' : 'Monthly Financial Report'}
                        </h2>
                        <div className="mt-4 flex justify-between text-sm text-gray-600">
                            <span>{language === 'TH' ? 'เดือน:' : 'Month:'} {format(new Date(month + "-01"), "MMMM yyyy", { locale: dateLocale })}</span>
                            <span>{language === 'TH' ? 'พิมพ์เมื่อ:' : 'Printed on:'} {new Date().toLocaleString(language === 'TH' ? 'th-TH' : 'en-US')}</span>
                        </div>
                        <hr className="mt-4 border-gray-300" />
                    </div>

                    {/* Report Header - Web Only (Hidden in Print) */}
                    <div className="text-center mb-8 border-b-2 border-gray-800 pb-4 print:hidden">
                        <h2 className="text-xl md:text-3xl font-bold uppercase tracking-wide">
                            {language === 'TH' ? 'รายงานสรุปประจำเดือน' : 'Monthly Financial Report'}
                        </h2>
                        <p className="text-lg text-gray-600 mt-2">
                            {format(new Date(month + "-01"), "MMMM yyyy", { locale: dateLocale })}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">Generated: {new Date().toLocaleString(language === 'TH' ? 'th-TH' : 'en-US')}</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 print:mb-2 print-grid-4">
                        <div className="bg-green-50 p-3 md:p-4 rounded-xl border border-green-100 print:print-no-border print:p-0 print:pt-2 print:pb-2">
                            <h3 className="text-green-800 text-xs md:text-sm font-semibold uppercase flex items-center gap-2">
                                <TrendingUp size={14} className="md:hidden" />
                                <TrendingUp size={16} className="hidden md:block" />
                                <span className="truncate">{language === 'TH' ? 'รายรับรวม (Total Income)' : 'Total Income'}</span>
                            </h3>
                            <p className="text-2xl md:text-3xl font-bold text-green-700 mt-2 print:text-xl">฿{data.income?.total?.toLocaleString()}</p>
                            <p className="text-xs text-green-600 mt-1">
                                {language === 'TH' ? `จากบิลที่ชำระแล้ว (${data.stats?.paidBills} บิล)` : `From paid bills (${data.stats?.paidBills} bills)`}
                            </p>
                        </div>
                        <div className="bg-red-50 p-3 md:p-4 rounded-xl border border-red-100 print:print-no-border print:p-0 print:pt-2 print:pb-2">
                            <h3 className="text-red-800 text-xs md:text-sm font-semibold uppercase flex items-center gap-2">
                                <TrendingDown size={14} className="md:hidden" />
                                <TrendingDown size={16} className="hidden md:block" />
                                <span className="truncate">{language === 'TH' ? 'รายจ่ายตามบิล (Bill Expenses)' : 'Bill Expenses'}</span>
                            </h3>
                            <p className="text-2xl md:text-3xl font-bold text-red-700 mt-2 print:text-xl">฿{data.expenses?.total?.toLocaleString()}</p>
                            <p className="text-xs text-red-600 mt-1 truncate">
                                {language === 'TH' ? 'ค่าน้ำ/ไฟ ส่วนกลาง (หลวง)' : 'Utilities + Common fees'}
                            </p>
                        </div>
                        <div className="bg-orange-50 p-3 md:p-4 rounded-xl border border-orange-100 print:print-no-border print:p-0 print:pt-2 print:pb-2">
                            <h3 className="text-orange-800 text-xs md:text-sm font-semibold uppercase flex items-center gap-2">
                                <TrendingDown size={14} className="md:hidden" />
                                <TrendingDown size={16} className="hidden md:block" />
                                <span className="truncate">{language === 'TH' ? 'รายจ่ายทั่วไป (General Expenses)' : 'General Expenses'}</span>
                            </h3>
                            <p className="text-2xl md:text-3xl font-bold text-orange-700 mt-2 print:text-xl">฿{data.expenses?.generalExpenses?.toLocaleString()}</p>
                            <p className="text-xs text-orange-600 mt-1 truncate">
                                {language === 'TH' ? 'จากบันทึกรายจ่าย' : 'From Expense Tracking'}
                            </p>
                        </div>
                        <div className="bg-blue-50 p-3 md:p-4 rounded-xl border border-blue-100 print:print-no-border print:p-0 print:pt-2 print:pb-2">
                            <h3 className="text-blue-800 text-xs md:text-sm font-semibold uppercase flex items-center gap-2">
                                <DollarSign size={14} className="md:hidden" />
                                <DollarSign size={16} className="hidden md:block" />
                                <span className="truncate">{language === 'TH' ? 'กำไรสุทธิ (Net Profit)' : 'Net Profit'}</span>
                            </h3>
                            <p className="text-2xl md:text-3xl font-bold text-blue-700 mt-2 print:text-xl">
                                ฿{(data.income?.total - data.expenses?.total).toLocaleString()}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                {language === 'TH' ? 'รายรับ - รายจ่าย' : 'Income - Expenses'}
                            </p>
                        </div>
                    </div>

                    {/* Power Bar Chart Section */}
                    <div className="mb-8 p-6 border rounded-3xl bg-white shadow-sm print:shadow-none print:border-gray-300 print:break-inside-avoid print:p-2 print:mb-4">
                        <h4 className="font-bold text-lg mb-6 text-center print:text-base print:mb-4 flex items-center justify-center gap-2">
                            <TrendingUp className="text-indigo-600 print:hidden" size={20} />
                            {language === 'TH' ? 'เปรียบเทียบ รายรับ-รายจ่าย (Financial Overview)' : 'Financial Overview (Income vs Expenses)'}
                        </h4>

                        {(() => {
                            const totalVolume = (data.income?.total || 0) + (data.expenses?.total || 0);
                            // Avoid division by zero
                            const safeTotal = totalVolume === 0 ? 1 : totalVolume;
                            const incomePercent = ((data.income?.total || 0) / safeTotal) * 100;
                            const expensePercent = ((data.expenses?.total || 0) / safeTotal) * 100;

                            return (
                                <div className="space-y-4 print:space-y-4 pt-4 pb-2">
                                    {/* Labels Row */}
                                    <div className="flex justify-between items-end text-sm md:text-base font-bold mb-2">
                                        {/* Income Label (Left) */}
                                        <div className="flex flex-col items-start">
                                            <span className="flex items-center gap-2 text-emerald-700">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500 print:bg-emerald-500 print-force-color"></div>
                                                {language === 'TH' ? 'รายรับ (Income)' : 'Income'}
                                            </span>
                                            <span className="text-xl text-emerald-700 mt-1">฿{data.income?.total?.toLocaleString()}</span>
                                        </div>

                                        {/* Expense Label (Right) */}
                                        <div className="flex flex-col items-end">
                                            <span className="flex items-center gap-2 text-rose-700">
                                                {language === 'TH' ? 'รายจ่าย (Expenses)' : 'Expenses'}
                                                <div className="w-3 h-3 rounded-full bg-rose-500 print:bg-rose-500 print-force-color"></div>
                                            </span>
                                            <span className="text-xl text-rose-700 mt-1">฿{data.expenses?.total?.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Single Split Bar Container */}
                                    <div className="h-10 md:h-12 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200 print:border-gray-300 print:bg-white print:h-8 relative flex">
                                        {/* Pattern Overlay for Texture (Background) */}
                                        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] pointer-events-none print:hidden"></div>

                                        {/* Income Segment (Left to Right) */}
                                        <div
                                            style={{ width: `${incomePercent}%` }}
                                            className="h-full bg-emerald-500 shadow-md print:bg-emerald-500 print-force-bg-green transition-all duration-1000 ease-out flex items-center justify-start pl-4 relative"
                                        >
                                            {incomePercent > 10 && (
                                                <span className="text-white text-xs md:text-sm font-bold drop-shadow-md z-10 print:text-white print-force-color">{incomePercent.toFixed(0)}%</span>
                                            )}
                                        </div>

                                        {/* Expense Segment (Right to Left visual - actually just taking remaining space) */}
                                        <div
                                            style={{ width: `${expensePercent}%` }}
                                            className="h-full bg-rose-500 shadow-md print:bg-rose-500 print-force-bg-red transition-all duration-1000 ease-out flex items-center justify-end pr-4 relative"
                                        >
                                            {expensePercent > 10 && (
                                                <span className="text-white text-xs md:text-sm font-bold drop-shadow-md z-10 print:text-white print-force-color">{expensePercent.toFixed(0)}%</span>
                                            )}
                                        </div>

                                        {/* Center dividing line (optional, for visual clarity when they meet) */}
                                        <div className="absolute left-[calc(var(--income-pct))] top-0 bottom-0 w-0.5 bg-white opacity-50 z-20 print:hidden" style={{ left: `${incomePercent}%` }}></div>
                                    </div>

                                    <div className="flex justify-between text-xs text-gray-400 mt-1 print:hidden">
                                        <span>Based on paid bills</span>
                                        <span>Utilities + Common fees</span>
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
                                        {/* General Expenses Details */}
                                        {data.expenses?.items && data.expenses.items.length > 0 && (
                                            <>
                                                <tr className="bg-gray-50/50">
                                                    <td colSpan={2} className="py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider pl-2 print:py-1">
                                                        {language === 'TH' ? 'รายการรายจ่ายทั่วไป' : 'General Expense Items'}
                                                    </td>
                                                </tr>
                                                {data.expenses.items.map((item: any, index: number) => (
                                                    <tr key={item.id || index} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                                        <td className="py-2 text-gray-600 pr-2 print:py-1 pl-4 text-sm">
                                                            <div className="flex flex-col md:flex-row md:items-center gap-1">
                                                                <span className="text-xs text-gray-400 font-mono min-w-[40px]">
                                                                    {new Date(item.date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' })}
                                                                </span>
                                                                <span>{item.title}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-2 text-right font-medium text-red-500 whitespace-nowrap print:py-1 text-sm">
                                                            -฿{item.amount.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </>
                                        )}
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

            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 10mm; }
                    
                    /* Use visibility to hide everything but keep the target element visible */
                    body * {
                        visibility: hidden;
                    }
                    
                    /* Reset visibility for the printable area */
                    #printable-area, #printable-area * {
                        visibility: visible;
                    }

                    /* Position the printable area to fill the page, ignoring hidden parents' spacing */
                    #printable-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background-color: white !important;
                        border: none !important;
                        box-shadow: none !important;
                    }

                    /* 
                       Specific overrides to ensure no background colors leak from parents 
                       if they are somehow still rendering background 
                    */
                    body {
                        background-color: white !important;
                        font-size: 16px !important;
                    }

                    .recharts-wrapper { break-inside: avoid; }
                    
                    /* Force Grid for Print */
                    .print-grid-3 {
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 12px !important;
                        visibility: visible !important;
                    }
                    .print-grid-4 {
                        display: grid !important;
                        grid-template-columns: repeat(4, 1fr) !important;
                        gap: 12px !important;
                        visibility: visible !important;
                    }
                    .print-grid-2 {
                        display: grid !important;
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 16px !important;
                        visibility: visible !important;
                    }
                    
                    /* Hide borders on summary cards */
                    .print-no-border {
                        border: none !important;
                        background: none !important;
                        box-shadow: none !important;
                    }
                    
                    /* Typography Adjustments - Increased size by +2px as requested */
                    h1 { font-size: 22px !important; margin-bottom: 8px !important; }
                    h2 { font-size: 18px !important; margin-bottom: 6px !important; }
                    h3 { font-size: 15px !important; } /* Reduced by 2px as requested */
                    h4 { font-size: 17px !important; margin-bottom: 6px !important; }
                    p { margin-bottom: 4px !important; }
                    td, th { padding-top: 4px !important; padding-bottom: 4px !important; }

                    /* Center align summary cards text and flex items */
                    .print-grid-3 > div {
                        text-align: center !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                    }
                    /* Ensure headers in summary cards are centered */
                    .print-grid-3 h3 {
                        justify-content: center !important;
                        justify-content: center !important;
                        width: 100% !important;
                    }
                    .print-grid-4 > div {
                        text-align: center !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                    }
                    .print-grid-4 h3 {
                        justify-content: center !important;
                        width: 100% !important;
                    }
                    
                    /* Force Colors for Bars */
                    .print-force-bg-green {
                        background-color: #10b981 !important; /* emerald-500 */
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print-force-bg-red {
                        background-color: #ef4444 !important; /* red-500 */
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print-force-color {
                         -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div >
    );
}
