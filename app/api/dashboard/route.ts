import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const today = new Date();
        const startOfCurrentMonth = startOfMonth(today);
        const endOfCurrentMonth = endOfMonth(today);

        // 1. Summary Cards Data
        // Total Revenue (This Month) - Only Paid bills
        const revenueAgg = await prisma.billing.aggregate({
            _sum: { totalAmount: true },
            where: {
                paymentStatus: 'Paid',
                paymentDate: {
                    gte: startOfCurrentMonth,
                    lte: endOfCurrentMonth
                }
            }
        });

        // Outstanding Debt (All Time)
        const outstandingAgg = await prisma.billing.aggregate({
            _sum: { totalAmount: true },
            where: {
                paymentStatus: {
                    in: ['Pending', 'Review']
                }
            }
        });

        // Occupancy Rate
        const totalRooms = await prisma.room.count();
        const occupiedRooms = await prisma.room.count({ where: { status: 'Occupied' } });
        const availableRooms = totalRooms - occupiedRooms;

        // Active Maintenance Requests
        const activeIssues = await prisma.issue.count({
            where: {
                status: {
                    in: ['Pending', 'InProgress']
                }
            }
        });

        // 2. Revenue Trend (Last 6 Months)
        const monthlyRevenue = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(today, i);
            const start = startOfMonth(date);
            const end = endOfMonth(date);

            const agg = await prisma.billing.aggregate({
                _sum: { totalAmount: true },
                where: {
                    paymentStatus: 'Paid',
                    paymentDate: {
                        gte: start,
                        lte: end
                    }
                }
            });

            monthlyRevenue.push({
                month: format(date, 'MMM'), // Jan, Feb, etc.
                fullDate: format(date, 'MMM yyyy'),
                amount: agg._sum.totalAmount || 0
            });
        }

        // 3. Occupancy Data (Pie Chart)
        const occupancyData = [
            { name: 'Occupied', value: occupiedRooms, color: '#10B981' }, // Emerald-500
            { name: 'Available', value: availableRooms, color: '#E5E7EB' }, // Gray-200
        ];

        // 4. Recent Activity (Feed)
        // Combine Bills and Issues, sort by date
        const recentBills = await prisma.billing.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { room: true },
            where: { createdAt: { gte: subMonths(today, 1) } }
        });

        const recentIssues = await prisma.issue.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { resident: { include: { room: true } } }
        });

        const recentActivity = [
            ...recentBills.map(b => ({
                id: `bill-${b.id}`,
                type: 'bill_created',
                title: `New Bill: Room ${b.room.number}`,
                desc: `${b.totalAmount.toLocaleString()} THB`,
                date: b.createdAt,
                status: b.paymentStatus
            })),
            ...recentIssues.map(i => ({
                id: `issue-${i.id}`,
                type: 'issue_reported',
                title: `Repair: ${i.category}`,
                desc: `Room ${i.resident?.room?.number || 'Guest'} - ${i.description}`,
                date: i.createdAt,
                status: i.status
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10); // Take top 10 combined

        // 5. Top Spenders (Water/Electric) - This Month's Bills
        const topSpenders = await prisma.billing.findMany({
            take: 5,
            where: {
                month: {
                    gte: startOfCurrentMonth,
                    lte: endOfCurrentMonth
                }
            },
            orderBy: { totalAmount: 'desc' },
            include: { room: true }
        });

        const topSpendersData = topSpenders.map(b => ({
            room: b.room.number,
            water: b.waterMeterCurrent - b.waterMeterLast,
            electric: b.electricMeterCurrent - b.electricMeterLast,
            total: b.totalAmount
        }));

        return NextResponse.json({
            summary: {
                revenue: revenueAgg._sum.totalAmount || 0,
                outstanding: outstandingAgg._sum.totalAmount || 0,
                occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
                activeIssues
            },
            charts: {
                revenue: monthlyRevenue,
                occupancy: occupancyData
            },
            activity: recentActivity,
            topSpenders: topSpendersData
        });

    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
    }
}
