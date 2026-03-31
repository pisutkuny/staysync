import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { SessionPayload } from '@/lib/auth/session';
import { unstable_cache } from 'next/cache';

export interface DashboardSummary {
    revenue: number;
    outstanding: number;
    occupancyRate: number;
    activeIssues: number;
    expenses: number;
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

/**
 * Helper: Ensures organizationId is a valid number, defaults to 1.
 */
function safeOrgId(organizationId?: number): number {
    if (!organizationId || isNaN(organizationId) || organizationId <= 0) return 1;
    return organizationId;
}

// Cached: 1 hour (Config rarely changes)
export async function getDormName(organizationId?: number) {
    const orgId = safeOrgId(organizationId);
    return unstable_cache(
        async () => {
            const config = await prisma.systemConfig.findFirst({
                where: { organizationId: orgId },
                select: { dormName: true }
            });
            return config?.dormName || "หอพัก";
        },
        ['dashboard-dorm-name-v7', String(orgId)],
        { revalidate: 3600 }
    )();
}

// Cached: 60 seconds
export async function getDashboardSummary(organizationId: number): Promise<DashboardSummary> {
    const orgId = safeOrgId(organizationId);

    // Fetch OUTSIDE the cache — if it throws, result won't be cached
    const fetchSummary = async (): Promise<DashboardSummary> => {
        const today = new Date();
        const startOfCurrentMonth = startOfMonth(today);
        const endOfCurrentMonth = endOfMonth(today);

        const [revenueAgg, outstandingAgg, totalRooms, occupiedRooms, activeIssues, expenseAgg] = await Promise.all([
            prisma.billing.aggregate({
                _sum: { totalAmount: true },
                where: {
                    organizationId: orgId,
                    paymentStatus: 'Paid',
                    month: { gte: startOfCurrentMonth, lte: endOfCurrentMonth }
                }
            }),
            prisma.billing.aggregate({
                _sum: { totalAmount: true },
                where: {
                    organizationId: orgId,
                    paymentStatus: { in: ['Pending', 'Review'] }
                }
            }),
            prisma.room.count({ where: { organizationId: orgId } }),
            prisma.room.count({ where: { organizationId: orgId, status: 'Occupied' } }),
            prisma.issue.count({
                where: { organizationId: orgId, status: { in: ['Pending', 'InProgress'] } }
            }),
            prisma.expense.aggregate({
                _sum: { amount: true },
                where: {
                    organizationId: orgId,
                    date: { gte: startOfCurrentMonth, lte: endOfCurrentMonth }
                }
            })
        ]);

        return {
            revenue: revenueAgg._sum.totalAmount || 0,
            outstanding: outstandingAgg._sum.totalAmount || 0,
            occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
            activeIssues,
            expenses: expenseAgg._sum.amount || 0
        };
    };

    return unstable_cache(
        fetchSummary,
        ['dashboard-summary-v8', String(orgId)],
        { revalidate: 60 }
    )();
}

// Cached: 5 minutes (Historical data changes slowly)
export async function getRevenueChartData(organizationId: number): Promise<RevenueChartData[]> {
    const orgId = safeOrgId(organizationId);

    const fetchRevenue = async (): Promise<RevenueChartData[]> => {
        const today = new Date();
        const sixMonthsAgo = startOfMonth(subMonths(today, 5));

        const [revenueResult, expenseResult] = await Promise.all([
            prisma.$queryRaw`
                SELECT 
                    to_char("month" + interval '7 hours', 'YYYY-MM') as month_key,
                    SUM("totalAmount") as total
                FROM "Billing"
                WHERE "organizationId" = ${orgId}
                AND "paymentStatus" = 'Paid'
                AND "month" >= ${sixMonthsAgo}
                GROUP BY month_key
                ORDER BY month_key ASC
            ` as Promise<{ month_key: string, total: number }[]>,

            prisma.$queryRaw`
                SELECT 
                    to_char("date" + interval '7 hours', 'YYYY-MM') as month_key,
                    SUM("amount") as total
                FROM "Expense"
                WHERE "organizationId" = ${orgId}
                AND "date" >= ${sixMonthsAgo}
                GROUP BY month_key
                ORDER BY month_key ASC
            ` as Promise<{ month_key: string, total: number }[]>
        ]);

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
    };

    return unstable_cache(
        fetchRevenue,
        ['dashboard-revenue-chart-v11', String(orgId)],
        { revalidate: 300 }
    )();
}

// Cached: 60 seconds
export async function getOccupancyChartData(organizationId: number): Promise<OccupancyChartData[]> {
    const orgId = safeOrgId(organizationId);

    const fetchOccupancy = async (): Promise<OccupancyChartData[]> => {
        const [totalRooms, occupiedRooms] = await Promise.all([
            prisma.room.count({ where: { organizationId: orgId } }),
            prisma.room.count({ where: { organizationId: orgId, status: 'Occupied' } })
        ]);

        return [
            { name: 'Occupied', value: occupiedRooms },
            { name: 'Available', value: totalRooms - occupiedRooms },
        ];
    };

    return unstable_cache(
        fetchOccupancy,
        ['dashboard-occupancy-v7', String(orgId)],
        { revalidate: 60 }
    )();
}

// Cached: 30 seconds (More real-time)
export async function getRecentActivity(organizationId: number): Promise<ActivityItem[]> {
    const orgId = safeOrgId(organizationId);

    const fetchActivity = async (): Promise<ActivityItem[]> => {
        const [recentBills, recentIssues] = await Promise.all([
            prisma.billing.findMany({
                where: { organizationId: orgId },
                take: 15, // Increased to capture bulk billings
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
                where: { organizationId: orgId },
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
            .slice(0, 15); // Show up to 15 items on dashboard
    };

    return unstable_cache(
        fetchActivity,
        ['dashboard-activity-v7', String(orgId)],
        { revalidate: 30 }
    )();
}

// Cached: 5 minutes
export async function getTopSpenders(organizationId: number): Promise<TopSpenderItem[]> {
    const orgId = safeOrgId(organizationId);

    const fetchTopSpenders = async (): Promise<TopSpenderItem[]> => {
        const today = new Date();
        const startOfCurrentMonth = startOfMonth(today);
        const endOfCurrentMonth = endOfMonth(today);

        const topSpenders = await prisma.billing.findMany({
            take: 6,
            where: {
                organizationId: orgId,
                month: { gte: startOfCurrentMonth, lte: endOfCurrentMonth }
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
    };

    return unstable_cache(
        fetchTopSpenders,
        ['dashboard-top-spenders-v7', String(orgId)],
        { revalidate: 300 }
    )();
}

// Backward compatibility wrapper
export async function getDashboardData(session: SessionPayload): Promise<DashboardData | null> {
    if (session.role === 'TENANT') {
        const dormName = await getDormName(session.organizationId);
        return {
            userRole: 'TENANT',
            dormName,
            summary: { revenue: 0, outstanding: 0, occupancyRate: 0, activeIssues: 0, expenses: 0 },
            charts: { revenue: [], occupancy: [] },
            activity: [],
            topSpenders: []
        };
    }

    const orgId = safeOrgId(session.organizationId);

    const [dormName, summary, revenueChart, occupancyChart, activity, topSpenders] = await Promise.all([
        getDormName(orgId),
        getDashboardSummary(orgId),
        getRevenueChartData(orgId),
        getOccupancyChartData(orgId),
        getRecentActivity(orgId),
        getTopSpenders(orgId)
    ]);

    return {
        userRole: session.role,
        dormName,
        summary,
        charts: { revenue: revenueChart, occupancy: occupancyChart },
        activity,
        topSpenders
    };
}
