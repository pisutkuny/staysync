"use client";

import { Users, DoorOpen, BadgeAlert, Wallet, TrendingUp, AlertCircle, Activity, Droplets, Zap } from "lucide-react";
import Link from "next/link";
import RevenueChart from "../components/RevenueChart";
import OccupancyChart from "../components/OccupancyChart";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { DashboardData } from "@/lib/data/dashboard";

export default function DashboardClient({ data }: { data: DashboardData }) {
    const { t } = useLanguage();

    // Tenant View (Simplified)
    if (data.userRole === 'TENANT') {
        return (
            <div className="space-y-8 pb-10">
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl text-white">
                    <h2 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight drop-shadow-lg mb-2">👋 {t.dashboard.welcomeTo} {data.dormName || "StaySync"}</h2>
                    <p className="text-indigo-100 text-sm md:text-base">{t.dashboard.tenantSystem}</p>
                </div>

                <div className="bg-white rounded-xl shadow p-8 text-center border border-gray-100">
                    <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                        <DoorOpen size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t.dashboard.pendingRoom}</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        {t.dashboard.contactAdmin} <br />
                        {t.dashboard.afterLink}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/report" className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition-shadow border border-gray-100 group">
                        <div className="flex items-center gap-4">
                            <div className="bg-orange-100 p-3 rounded-lg text-orange-600 group-hover:bg-orange-200 transition-colors">
                                <BadgeAlert size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{t.dashboard.generalIssue}</h3>
                                <p className="text-sm text-gray-500">{t.dashboard.generalIssueDesc}</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/settings" className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition-shadow border border-gray-100 group">
                        <div className="flex items-center gap-4">
                            <div className="bg-gray-100 p-3 rounded-lg text-gray-600 group-hover:bg-gray-200 transition-colors">
                                <div className="w-6 h-6 flex items-center justify-center">⚙️</div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{t.dashboard.accountSettings}</h3>
                                <p className="text-sm text-gray-500">{t.dashboard.manageProfile}</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        );
    }

    // Owner View (Full Dashboard)
    const { summary, charts, activity, topSpenders } = data;

    return (
        <div className="space-y-8 pb-10">
            {/* Enhanced Gradient Header */}
            <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 rounded-2xl p-8 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg">👋 {t.dashboard.welcomeTo} {data.dormName || "StaySync"}</h2>
                        <p className="text-cyan-100 mt-2 text-lg">{t.dashboard.realtimeOverview}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/30 shadow-lg w-full md:w-auto text-center md:text-right">
                        <p className="text-sm font-bold text-white/90 uppercase tracking-wider">{t.dashboard.outstandingBalance}</p>
                        <p className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">฿{summary.outstanding.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Enhanced KPI Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Revenue */}
                <Link href="/billing">
                    <div className="p-6 bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-lg border-2 border-green-200 flex items-center justify-between hover:shadow-xl hover:scale-105 transition-all cursor-pointer h-full group">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t.dashboard.revenue}</p>
                            <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mt-2">฿{summary.revenue.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                            <Wallet size={28} />
                        </div>
                    </div>
                </Link>

                {/* Occupancy */}
                <Link href="/rooms">
                    <div className="p-6 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border-2 border-blue-200 flex items-center justify-between hover:shadow-xl hover:scale-105 transition-all cursor-pointer h-full group">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t.dashboard.occupancyRate}</p>
                            <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mt-2">{summary.occupancyRate}%</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                            <Users size={28} />
                        </div>
                    </div>
                </Link>

                {/* Active Issues */}
                <Link href="/admin/issues">
                    <div className="p-6 bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-lg border-2 border-orange-200 flex items-center justify-between hover:shadow-xl hover:scale-105 transition-all cursor-pointer h-full group">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t.dashboard.activeRepair}</p>
                            <p className="text-2xl md:text-3xl font-bold text-orange-600 mt-2">{summary.activeIssues}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                            <BadgeAlert size={28} />
                        </div>
                    </div>
                </Link>

                {/* Expenses */}
                <Link href="/expenses">
                    <div className="p-6 bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-lg border-2 border-purple-200 flex items-center justify-between hover:shadow-xl hover:scale-105 transition-all cursor-pointer h-full group">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t.dashboard.manageExpenses}</p>
                            <p className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-2">{t.dashboard.viewDetails} →</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
                            <TrendingUp size={28} className="rotate-180" />
                        </div>
                    </div>
                </Link>
            </div>

            {/* Enhanced Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-gradient-to-br from-white to-indigo-50 p-6 rounded-2xl border-2 border-indigo-200 shadow-xl">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
                        <TrendingUp className="text-indigo-600" size={22} />
                        {t.dashboard.revenueTrend}
                    </h3>
                    <RevenueChart data={charts.revenue} />
                </div>

                {/* Occupancy Donut */}
                <div className="bg-gradient-to-br from-white to-teal-50 p-6 rounded-2xl border-2 border-teal-200 shadow-xl flex flex-col">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
                        <AlertCircle className="text-teal-600" size={22} />
                        {t.dashboard.roomStatus}
                    </h3>
                    <div className="flex-1 flex items-center justify-center">
                        <OccupancyChart data={charts.occupancy} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
                    <div className="p-6 border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Activity className="text-indigo-600" size={22} />
                            {t.dashboard.recentActivity}
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {activity.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">{t.dashboard.noActivity}</div>
                        ) : (
                            activity.map((item: any) => (
                                <div key={item.id} className="p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all flex items-center gap-4">
                                    <div className={`p-3 rounded-xl shadow-md ${item.type === 'bill_created' ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' : 'bg-gradient-to-br from-orange-400 to-red-500 text-white'}`}>
                                        {item.type === 'bill_created' ? <Wallet size={18} /> : <BadgeAlert size={18} />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                        <p className="text-xs text-gray-500">{item.desc}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">
                                            {new Date(item.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                        </p>
                                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${item.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                            item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Top Spenders */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
                    <div className="p-6 border-b-2 border-gray-100 bg-gradient-to-r from-yellow-50 to-white">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Zap className="text-yellow-500" size={22} />
                            {t.dashboard.topSpenders}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">{t.dashboard.currentMonthBill}</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {topSpenders.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">-</div>
                        ) : (
                            topSpenders.map((room: any, idx: number) => (
                                <div key={idx} className="p-4 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-white transition-all flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl font-bold bg-gradient-to-br from-yellow-400 to-orange-500 bg-clip-text text-transparent w-10">{room.room}</span>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1 text-xs font-medium text-blue-600">
                                                <Droplets size={14} /> {room.water.toFixed(0)} {t.dashboard.unit}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs font-medium text-yellow-600">
                                                <Zap size={14} /> {room.electric.toFixed(0)} {t.dashboard.unit}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">฿{room.total.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Enhanced Quick Actions */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    {t.dashboard.quickActions}
                </h3>
                <div className="grid grid-cols-2 lg:flex gap-3 lg:gap-4">
                    <Link href="/rooms/add">
                        <button className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 font-bold transition-all shadow-md hover:shadow-lg hover:scale-105 text-sm flex items-center justify-center gap-2">
                            ➕ {t.dashboard.addRoom}
                        </button>
                    </Link>
                    <Link href="/billing">
                        <button className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-bold transition-all shadow-sm hover:shadow-md hover:scale-105 text-sm flex items-center justify-center gap-2">
                            💰 {t.dashboard.manageBill}
                        </button>
                    </Link>
                    <Link href="/billing/bulk">
                        <button className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 font-bold transition-all shadow-md hover:shadow-lg hover:scale-105 text-sm flex items-center justify-center gap-2">
                            📝 {t.dashboard.recordMeter}
                        </button>
                    </Link>
                    <Link href="/broadcast">
                        <button className="w-full px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 font-bold transition-all shadow-md hover:shadow-lg hover:scale-105 text-sm flex items-center justify-center gap-2">
                            📢 {t.dashboard.broadcast}
                        </button>
                    </Link>
                    <Link href="/expenses">
                        <button className="w-full px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 font-bold transition-all shadow-md hover:shadow-lg hover:scale-105 text-sm flex items-center justify-center gap-2">
                            📉 {t.dashboard.expenses}
                        </button>
                    </Link>
                    <Link href="/settings">
                        <button className="w-full px-4 py-2.5 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 font-bold transition-all shadow-md hover:shadow-lg hover:scale-105 text-sm flex items-center justify-center gap-2">
                            ⚙️ {t.common.settings}
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
