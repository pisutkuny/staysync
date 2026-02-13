import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { getCurrentSession } from '@/lib/auth/session';

// Enable caching with 2-minute revalidation
export const revalidate = 120; // Cache for 2 minutes (120 seconds)

export async function GET() {
    try {
        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const today = new Date();
        const startOfCurrentMonth = startOfMonth(today);
        const endOfCurrentMonth = endOfMonth(today);

        // Fetch System Config for Dorm Name
        const config = await prisma.systemConfig.findFirst();
        const dormName = config?.dormName || "หอพัก";

        // If user is a TENANT, return simplified/empty data to prevent crash
        if (session.role === 'TENANT') {
            // Fetch logged-in user's room info if needed, or just return empty for now
            // For now, return a safe "empty" structure
            return NextResponse.json({
                userRole: 'TENANT',
                dormName,
                summary: {
                    revenue: 0,
                    outstanding: 0,
                    occupancyRate: 0,
                    activeIssues: 0
                },
                charts: {
                    revenue: [],
                    occupancy: []
                },
                activity: [],
                topSpenders: []
            });
        }

        // --- OWNER / ADMIN LOGIC BELOW ---

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

        // 2. Revenue Trend (Last 6 Months) - Optimized with single query
        const sixMonthsAgo = subMonths(today, 5);
        const allBills = await prisma.billing.findMany({
            where: {
                paymentStatus: 'Paid',
                paymentDate: {
                    gte: startOfMonth(sixMonthsAgo),
                    lte: endOfCurrentMonth
                }
            },
            select: {
                paymentDate: true,
                totalAmount: true
            }
        });

        // Group by month
        const monthlyRevenueMap = new Map<string, number>();
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(today, i);
            const key = format(date, 'yyyy-MM');
            monthlyRevenueMap.set(key, 0);
        }

        // Aggregate manually
        allBills.forEach(bill => {
            if (bill.paymentDate) {
                const key = format(new Date(bill.paymentDate), 'yyyy-MM');
                if (monthlyRevenueMap.has(key)) {
                    monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) || 0) + bill.totalAmount);
                }
            }
        });

        // Build result array
        const monthlyRevenue = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(today, i);
            const key = format(date, 'yyyy-MM');
            monthlyRevenue.push({
                month: format(date, 'MMM'),
                fullDate: format(date, 'MMM yyyy'),
                amount: monthlyRevenueMap.get(key) || 0
            });
        }

        // 3. Occupancy Data (Pie Chart)
        const occupancyData = [
            { name: 'Occupied', value: occupiedRooms, color: '#10B981' }, // Emerald-500
            { name: 'Available', value: availableRooms, color: '#E5E7EB' }, // Gray-200
        ];

        // 4. Recent Activity (Feed) - Optimized
        // Fetch only what we need with proper limits
        const recentBills = await prisma.billing.findMany({
            take: 10,  // Increased to ensure we get enough after filtering
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                createdAt: true,
                totalAmount: true,
                paymentStatus: true,
                room: {
                    select: { number: true }
                }
            }
        });

        const recentIssues = await prisma.issue.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                createdAt: true,
                category: true,
                description: true,
                status: true,
                resident: {
                    select: {
                        room: {
                            select: { number: true }
                        }
                    }
                }
            }
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

        // 5. Top Spenders (Water/Electric) - Optimized
        const topSpenders = await prisma.billing.findMany({
            take: 5,
            where: {
                month: {
                    gte: startOfCurrentMonth,
                    lte: endOfCurrentMonth
                }
            },
            orderBy: { totalAmount: 'desc' },
            select: {
                waterMeterCurrent: true,
                waterMeterLast: true,
                electricMeterCurrent: true,
                electricMeterLast: true,
                totalAmount: true,
                room: {
                    select: { number: true }
                }
            }
        });

        const topSpendersData = topSpenders.map(b => ({
            room: b.room.number,
            water: b.waterMeterCurrent - b.waterMeterLast,
            electric: b.electricMeterCurrent - b.electricMeterLast,
            total: b.totalAmount
        }));

        return NextResponse.json({
            userRole: session.role,
            dormName,
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
