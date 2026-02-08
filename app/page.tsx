"use client";

import { useEffect, useState } from "react";
import { Users, DoorOpen, BadgeAlert, Wallet, TrendingUp, AlertCircle, Activity, Droplets, Zap } from "lucide-react";
import Link from "next/link";
import RevenueChart from "./components/RevenueChart";
import OccupancyChart from "./components/OccupancyChart";

interface DashboardData {
  summary: {
    revenue: number;
    outstanding: number;
    occupancyRate: number;
    activeIssues: number;
  };
  charts: {
    revenue: any[];
    occupancy: any[];
  };
  activity: any[];
  topSpenders: any[];
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard data", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500">Failed to load data.</div>;
  }

  const { summary, charts, activity, topSpenders } = data;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h2>
          <p className="text-gray-500 mt-2">ภาพรวมหอพักของคุณ (Real-time)</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">ยอดรอเก็บ (Unpaid)</p>
          <p className="text-2xl font-bold text-red-500">฿{summary.outstanding.toLocaleString()}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">รายรับเดือนนี้</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">฿{summary.revenue.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-full text-green-600">
            <Wallet size={24} />
          </div>
        </div>

        {/* Occupancy */}
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">อัตราการเข้าพัก</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{summary.occupancyRate}%</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Users size={24} />
          </div>
        </div>

        {/* Active Issues */}
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">แจ้งซ่อมรอจัดการ</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{summary.activeIssues}</p>
          </div>
          <div className="p-3 bg-orange-100 rounded-full text-orange-600">
            <BadgeAlert size={24} />
          </div>
        </div>

        {/* Expenses (Placeholder / To implement later) */}
        <Link href="/expenses">
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer h-full">
            <div>
              <p className="text-sm font-medium text-gray-500">จัดการรายจ่าย</p>
              <p className="text-sm font-bold text-indigo-600 mt-2">ดูรายละเอียด &rarr;</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
              <TrendingUp size={24} className="rotate-180" />
            </div>
          </div>
        </Link>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={20} />
            แนวโน้มรายรับ (6 เดือนล่าสุด)
          </h3>
          <RevenueChart data={charts.revenue} />
        </div>

        {/* Occupancy Donut */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <AlertCircle className="text-indigo-600" size={20} />
            สถานะห้องพัก
          </h3>
          <div className="flex-1 flex items-center justify-center">
            <OccupancyChart data={charts.occupancy} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity className="text-indigo-600" size={20} />
              กิจกรรมล่าสุด
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {activity.length === 0 ? (
              <div className="p-8 text-center text-gray-500">ไม่มีกิจกรรมล่าสุด</div>
            ) : (
              activity.map((item) => (
                <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                  <div className={`p-2 rounded-full ${item.type === 'bill_created' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {item.type === 'bill_created' ? <Wallet size={16} /> : <BadgeAlert size={16} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {new Date(item.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.status === 'Paid' ? 'bg-green-100 text-green-700' :
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Zap className="text-yellow-500" size={20} />
              การใช้น้ำ/ไฟ สูงสุด
            </h3>
            <p className="text-xs text-gray-500 mt-1">(บิลเดือนปัจจุบัน)</p>
          </div>
          <div className="divide-y divide-gray-100">
            {topSpenders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">-</div>
            ) : (
              topSpenders.map((room, idx) => (
                <div key={idx} className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-700 w-8">{room.room}</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Droplets size={12} /> {room.water.toFixed(0)} หน่วย
                      </div>
                      <div className="flex items-center gap-1 text-xs text-yellow-600">
                        <Zap size={12} /> {room.electric.toFixed(0)} หน่วย
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

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">เมนูลัด (Quick Actions)</h3>
        <div className="grid grid-cols-2 lg:flex gap-3 lg:gap-4">
          <Link href="/rooms/add">
            <button className="w-full px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-all shadow-sm hover:shadow-md">
              + เพิ่มห้องพัก
            </button>
          </Link>
          <Link href="/billing">
            <button className="w-full px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-all">
              จัดการบิล
            </button>
          </Link>
          <Link href="/billing/bulk">
            <button className="w-full px-5 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-100 font-bold transition-all">
              📝 จดมิเตอร์
            </button>
          </Link>
          <Link href="/broadcast">
            <button className="w-full px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 font-bold transition-all shadow-sm hover:shadow-md">
              Broadcast
            </button>
          </Link>
          <Link href="/expenses">
            <button className="w-full px-5 py-2.5 bg-red-50 border border-red-100 text-red-700 rounded-xl hover:bg-red-100 font-bold transition-all">
              📉 รายจ่าย
            </button>
          </Link>
          <Link href="/settings">
            <button className="w-full px-5 py-2.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition-all">
              ⚙️ ตั้งค่า
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
