import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { SessionPayload } from '@/lib/auth/session';

export interface DashboardData {
    userRole: string;
    dormName: string;
    summary: {
        revenue: number;
        outstanding: number;
        occupancyRate: number;
        activeIssues: number;
    };
    charts: {
        revenue: { month: string; fullDate: string; amount: number }[];
        occupancy: { name: string; value: number; color: string }[];
    };
    activity: {
        id: string;
        type: string;
        title: string;
        desc: string;
        date: string;
        status: string;
    }[];
    topSpenders: {
        room: string;
        water: number;
        electric: number;
        total: number;
    }[];
}

export async function getDashboardData(session: SessionPayload): Promise<DashboardData | null> {
    try {
        const today = new Date();
        const startOfCurrentMonth = startOfMonth(today);
        const endOfCurrentMonth = endOfMonth(today);

        // Fetch System Config for Dorm Name
        const config = await prisma.systemConfig.findFirst();
        const dormName = config?.dormName || "หอพัก";

        // If user is a TENANT, return simplified/empty data
        if (session.role === 'TENANT') {
            return {
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
            };
        }

        // --- OWNER / ADMIN LOGIC BELOW ---

        // Prepare all promises for parallel execution
        const sixMonthsAgo = subMonths(today, 5);

        const [
            revenueAgg,
            outstandingAgg,
            totalRooms,
            occupiedRooms,
            activeIssues,
            allBills,
            recentBills,
            recentIssues,
            topSpenders
        ] = await Promise.all([
            // 1. Revenue
            prisma.billing.aggregate({
                _sum: { totalAmount: true },
                where: {
                    paymentStatus: 'Paid',
                    paymentDate: {
                        gte: startOfCurrentMonth,
                        lte: endOfCurrentMonth
                    }
                }
            }),
            // 2. Outstanding
            prisma.billing.aggregate({
                _sum: { totalAmount: true },
                where: {
                    paymentStatus: {
                        in: ['Pending', 'Review']
                    }
                }
            }),
            // 3. Rooms Total
            prisma.room.count(),
            // 4. Rooms Occupied
            prisma.room.count({ where: { status: 'Occupied' } }),
            // 5. Active Issues
            prisma.issue.count({
                where: {
                    status: {
                        in: ['Pending', 'InProgress']
                    }
                }
            }),
            // 6. Revenue Trend Source Data
            prisma.billing.findMany({
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
            }),
            // 7. Recent Bills
            prisma.billing.findMany({
                take: 10,
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
            }),
            // 8. Recent Issues
            prisma.issue.findMany({
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
            }),
            // 9. Top Spenders
            prisma.billing.findMany({
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
            })
        ]);

        // Process Revenue Trend
        const monthlyRevenueMap = new Map<string, number>();
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(today, i);
            const key = format(date, 'yyyy-MM');
            monthlyRevenueMap.set(key, 0);
        }

        allBills.forEach(bill => {
            if (bill.paymentDate) {
                const key = format(new Date(bill.paymentDate), 'yyyy-MM');
                if (monthlyRevenueMap.has(key)) {
                    monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) || 0) + bill.totalAmount);
                }
            }
        });

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

        // Process Occupancy
        const availableRooms = totalRooms - occupiedRooms;
        const occupancyData = [
            { name: 'Occupied', value: occupiedRooms, color: '#10B981' },
            { name: 'Available', value: availableRooms, color: '#E5E7EB' },
        ];

        // Process Recent Activity
        const recentActivity = [
            ...recentBills.map(b => ({
                id: `bill-${b.id}`,
                type: 'bill_created',
                title: `New Bill: Room ${b.room.number}`,
                desc: `${b.totalAmount.toLocaleString()} THB`,
                date: b.createdAt.toISOString(),
                status: b.paymentStatus
            })),
            ...recentIssues.map(i => ({
                id: `issue-${i.id}`,
                type: 'issue_reported',
                title: `Repair: ${i.category}`,
                desc: `Room ${i.resident?.room?.number || 'Guest'} - ${i.description}`,
                date: i.createdAt.toISOString(),
                status: i.status
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);

        // Process Top Spenders
        const topSpendersData = topSpenders.map(b => ({
            room: b.room.number,
            water: b.waterMeterCurrent - b.waterMeterLast,
            electric: b.electricMeterCurrent - b.electricMeterLast,
            total: b.totalAmount
        }));

        return {
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
        };

    } catch (error) {
        console.error("Dashboard Data Error:", error);
        return null;
    }
}
