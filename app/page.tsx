import prisma from "@/lib/prisma";
import { Users, DoorOpen, BadgeAlert, Wallet, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import RevenueChart from "./components/RevenueChart";
import OccupancyChart from "./components/OccupancyChart";

export const dynamic = 'force-dynamic';

async function getStats() {
  const totalRooms = await prisma.room.count();
  const occupiedRooms = await prisma.room.count({ where: { status: "Occupied" } });
  const maintenanceRooms = await prisma.room.count({ where: { status: "Maintenance" } });
  const availableRooms = totalRooms - occupiedRooms - maintenanceRooms;

  const pendingIssues = await prisma.issue.count({ where: { status: "Pending" } });

  // Calculate revenue for current month (Paid bills)
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

  const paidBills = await prisma.billing.findMany({
    where: { paymentStatus: "Paid", createdAt: { gte: firstDay } },
    select: { totalAmount: true }
  });
  const revenue = paidBills.reduce((sum: number, bill) => sum + bill.totalAmount, 0);

  // Calculate Outstanding Debt (Pending/Review)
  const unpaidBills = await prisma.billing.findMany({
    where: { paymentStatus: { in: ["Pending", "Review", "Rejected"] } },
    select: { totalAmount: true }
  });
  const outstanding = unpaidBills.reduce((sum: number, bill) => sum + bill.totalAmount, 0);

  // Calculate expenses for current month
  const expensesAgg = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: { date: { gte: firstDay } }
  });
  const totalExpenses = expensesAgg._sum.amount || 0;
  const netProfit = revenue - totalExpenses;

  // Calculate Revenue History (Last 6 Months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // Go back 5 months + current = 6 months
  sixMonthsAgo.setDate(1); // Start of that month

  const historicBills = await prisma.billing.findMany({
    where: {
      paymentStatus: "Paid",
      createdAt: { gte: sixMonthsAgo }
    },
    select: { totalAmount: true, createdAt: true }
  });

  // Group by month
  const monthlyRevenue = new Map<string, number>();

  // Initialize last 6 months with 0
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleString('en-US', { month: 'short' });
    monthlyRevenue.set(key, 0);
  }

  // Fill real data
  historicBills.forEach(bill => {
    const monthKey = bill.createdAt.toLocaleString('en-US', { month: 'short' });
    const current = monthlyRevenue.get(monthKey) || 0;
    monthlyRevenue.set(monthKey, current + bill.totalAmount);
  });

  // Convert to array for Recharts
  const revenueData = Array.from(monthlyRevenue.entries()).map(([name, total]) => ({ name, total }));

  const occupancyData = [
    { name: 'Occupied', value: occupiedRooms },
    { name: 'Available', value: availableRooms },
    { name: 'Maintenance', value: maintenanceRooms },
  ];

  return { totalRooms, occupiedRooms, availableRooms, pendingIssues, revenue, outstanding, revenueData, occupancyData, totalExpenses, netProfit };
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h2>
          <p className="text-gray-500 mt-2">Overview of your dormitory status.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Outstanding</p>
          <p className="text-2xl font-bold text-red-500">฿{stats.outstanding.toLocaleString()}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Available Rooms</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.availableRooms}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-full text-green-600">
            <DoorOpen size={24} />
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Occupied</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.occupiedRooms}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Users size={24} />
          </div>
        </div>

        {/* Revenue */}
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Revenue (This Month)</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">฿{stats.revenue.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Wallet size={24} />
          </div>
        </div>

        {/* Expenses */}
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Expenses (This Month)</p>
            <p className="text-3xl font-bold text-red-600 mt-2">-฿{stats.totalExpenses.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-red-100 rounded-full text-red-600">
            <TrendingUp size={24} className="rotate-180" />
          </div>
        </div>
      </div>

      {/* Financial Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-md text-white">
          <p className="text-indigo-100 font-medium">Net Profit (This Month)</p>
          <h3 className="text-4xl font-bold mt-2">฿{stats.netProfit.toLocaleString()}</h3>
          <p className="text-sm text-indigo-200 mt-4 opacity-80">Revenue - Expenses</p>
        </div>

        <div className="md:col-span-2 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Pending Issues</h3>
            <p className="text-gray-500">{stats.pendingIssues} issues require attention</p>
          </div>
          <Link href="/issues">
            <button className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-bold hover:bg-orange-200 transition-colors">
              View Issues
            </button>
          </Link>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={20} />
            Revenue Trends
          </h3>
          <RevenueChart data={stats.revenueData} />
        </div>

        {/* Occupancy Donut */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <AlertCircle className="text-indigo-600" size={20} />
            Occupancy Rate
          </h3>
          <OccupancyChart data={stats.occupancyData} />
          <div className="text-center mt-4 text-sm text-gray-500">
            Total {stats.totalRooms} Rooms
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:flex gap-3 lg:gap-4">
          <Link href="/rooms/add">
            <button className="w-full px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-all shadow-sm hover:shadow-md">
              + Add Room
            </button>
          </Link>
          <Link href="/billing">
            <button className="w-full px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-all">
              Manage Billing
            </button>
          </Link>
          <Link href="/billing/bulk">
            <button className="w-full px-5 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-100 font-bold transition-all">
              📝 Bulk Recording
            </button>
          </Link>
          <Link href="/broadcast">
            <button className="w-full px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 font-bold transition-all shadow-sm hover:shadow-md">
              Broadcast
            </button>
          </Link>
          <Link href="/expenses">
            <button className="w-full px-5 py-2.5 bg-red-50 border border-red-100 text-red-700 rounded-xl hover:bg-red-100 font-bold transition-all">
              📉 Expenses
            </button>
          </Link>
          <Link href="/settings">
            <button className="w-full px-5 py-2.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-200 font-bold transition-all">
              ⚙️ Settings
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
