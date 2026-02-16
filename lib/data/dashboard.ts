import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { SessionPayload } from '@/lib/auth/session';
import { unstable_cache } from 'next/cache';

export interface DashboardSummary {
    revenue: number;
    outstanding: number;
    occupancyRate: number;
    activeIssues: number;
}

export interface RevenueChartData {
    month: string;
    fullDate: string;
    amount: number;
    expense?: number;
}

export interface OccupancyChartData {
    name: string;
    value: number;
}

export interface ActivityItem {
    id: string;
    type: string;
    title: string;
    desc: string;
    date: string;
    status: string;
}

export interface TopSpenderItem {
    room: string;
    water: number;
    electric: number;
    total: number;
}

export interface DashboardData {
    userRole: string;
    dormName: string;
    summary: DashboardSummary;
    charts: {
        revenue: RevenueChartData[];
        occupancy: OccupancyChartData[];
    };
    activity: ActivityItem[];
    topSpenders: TopSpenderItem[];
}

export async function getDormName() {
    const config = await prisma.systemConfig.findFirst({
        select: { dormName: true }
    });
    return config?.dormName || "หอพัก";
}

// Cached: 60 seconds
export const getDashboardSummary = unstable_cache(
    async (): Promise<DashboardSummary> => {
        try {
            const today = new Date();
            const startOfCurrentMonth = startOfMonth(today);
            const endOfCurrentMonth = endOfMonth(today);

            const [revenueAgg, outstandingAgg, totalRooms, occupiedRooms, activeIssues] = await Promise.all([
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
                prisma.billing.aggregate({
                    _sum: { totalAmount: true },
                    where: {
                        paymentStatus: { in: ['Pending', 'Review'] }
                    }
                }),
                prisma.room.count(),
                prisma.room.count({ where: { status: 'Occupied' } }),
                prisma.issue.count({
                    where: { status: { in: ['Pending', 'InProgress'] } }
                })
            ]);

            return {
                revenue: revenueAgg._sum.totalAmount || 0,
                outstanding: outstandingAgg._sum.totalAmount || 0,
                occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
                activeIssues
            };
        } catch (error) {
            console.error("Failed to fetch dashboard summary:", error);
            return {
                revenue: 0,
                outstanding: 0,
                occupancyRate: 0,
                activeIssues: 0
            };
        }
    },
    ['dashboard-summary'],
    { revalidate: 60 }
);

// Cached: 5 minutes (Historical data changes slowly)
export const getRevenueChartData = unstable_cache(
    async (): Promise<RevenueChartData[]> => {
        try {
            const today = new Date();
            // 6 months ago (start of that month)
            const sixMonthsAgo = startOfMonth(subMonths(today, 5));

            // Use raw query for much faster aggregation at database level
            const [revenueResult, expenseResult] = await Promise.all([
                prisma.$queryRaw`
                    SELECT 
                        to_char("month" + interval '7 hours', 'YYYY-MM') as month_key,
                        SUM("totalAmount") as total
                    FROM "Billing"
                    WHERE "paymentStatus" = 'Paid'
                    AND "month" >= ${sixMonthsAgo}
                    GROUP BY month_key
                    ORDER BY month_key ASC
                ` as Promise<{ month_key: string, total: number }[]>,

                prisma.$queryRaw`
                    SELECT 
                        to_char("date" + interval '7 hours', 'YYYY-MM') as month_key,
                        SUM("amount") as total
                    FROM "Expense"
                    WHERE "date" >= ${sixMonthsAgo}
                    GROUP BY month_key
                    ORDER BY month_key ASC
                ` as Promise<{ month_key: string, total: number }[]>
            ]);

            // Fill in missing months with 0
            const filledData = [];
            for (let i = 5; i >= 0; i--) {
                const date = subMonths(today, i);
                const key = format(date, 'yyyy-MM');

                const revMatch = revenueResult.find(r => r.month_key === key);
                const expMatch = expenseResult.find(r => r.month_key === key);

                filledData.push({
                    month: format(date, 'MMM'),
                    fullDate: format(date, 'MMM yyyy'),
                    amount: revMatch ? Number(revMatch.total) : 0,
                    expense: expMatch ? Number(expMatch.total) : 0
                });
            }

            return filledData;
        } catch (error) {
            console.error("Failed to fetch revenue chart data:", error);
            // Return last 6 months with 0 values to prevent crash
            const today = new Date();
            const fallbackData = [];
            for (let i = 5; i >= 0; i--) {
                const date = subMonths(today, i);
                fallbackData.push({
                    month: format(date, 'MMM'),
                    fullDate: format(date, 'MMM yyyy'),
                    amount: 0,
                    expense: 0
                });
            }
            return fallbackData;
        }
    },
    ['dashboard-revenue-chart-v4'], // Bump cache version
    { revalidate: 300 }
);

// Cached: 60 seconds
export const getOccupancyChartData = unstable_cache(
    async (): Promise<OccupancyChartData[]> => {
        const [totalRooms, occupiedRooms] = await Promise.all([
            prisma.room.count(),
            prisma.room.count({ where: { status: 'Occupied' } })
        ]);

        const availableRooms = totalRooms - occupiedRooms;

        return [
            { name: 'Occupied', value: occupiedRooms },
            { name: 'Available', value: availableRooms },
        ];
    },
    ['dashboard-occupancy'],
    { revalidate: 60 }
);

// Cached: 30 seconds (More real-time)
export const getRecentActivity = unstable_cache(
    async (): Promise<ActivityItem[]> => {
        try {
            const [recentBills, recentIssues] = await Promise.all([
                prisma.billing.findMany({
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        createdAt: true,
                        totalAmount: true,
                        paymentStatus: true,
                        room: { select: { number: true } }
                    }
                }),
                prisma.issue.findMany({
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        createdAt: true,
                        category: true,
                        description: true,
                        status: true,
                        resident: {
                            select: {
                                room: { select: { number: true } }
                            }
                        }
                    }
                })
            ]);

            return [
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
        } catch (error) {
            console.error("Failed to fetch recent activity:", error);
            return [];
        }
    },
    ['dashboard-activity'],
    { revalidate: 30 }
);

// Cached: 5 minutes
export const getTopSpenders = unstable_cache(
    async (): Promise<TopSpenderItem[]> => {
        try {
            const today = new Date();
            const startOfCurrentMonth = startOfMonth(today);
            const endOfCurrentMonth = endOfMonth(today);

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
                    room: { select: { number: true } }
                }
            });

            return topSpenders.map(b => ({
                room: b.room.number,
                water: b.waterMeterCurrent - b.waterMeterLast,
                electric: b.electricMeterCurrent - b.electricMeterLast,
                total: b.totalAmount
            }));
        } catch (error) {
            console.error("Failed to fetch top spenders:", error);
            return [];
        }
    },
    ['dashboard-top-spenders'],
    { revalidate: 300 }
);

// Keep the old function for backward compatibility until refactor is complete
// Or just export it as a wrapper around the new functions
export async function getDashboardData(session: SessionPayload): Promise<DashboardData | null> {
    if (session.role === 'TENANT') {
        const dormName = await getDormName();
        return {
            userRole: 'TENANT',
            dormName,
            summary: { revenue: 0, outstanding: 0, occupancyRate: 0, activeIssues: 0 },
            charts: { revenue: [], occupancy: [] },
            activity: [],
            topSpenders: []
        };
    }

    const [dormName, summary, revenueChart, occupancyChart, activity, topSpenders] = await Promise.all([
        getDormName(),
        getDashboardSummary(),
        getRevenueChartData(),
        getOccupancyChartData(),
        getRecentActivity(),
        getTopSpenders()
    ]);

    return {
        userRole: session.role,
        dormName,
        summary,
        charts: {
            revenue: revenueChart,
            occupancy: occupancyChart
        },
        activity,
        topSpenders
    };
}



