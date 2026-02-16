import { Suspense } from "react";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
    getDormName,
    getDashboardSummary,
    getRevenueChartData,
    getOccupancyChartData,
    getRecentActivity,
    getTopSpenders,
    DashboardSummary,
    RevenueChartData,
    OccupancyChartData,
    ActivityItem,
    TopSpenderItem
} from "@/lib/data/dashboard";

// Components
import DashboardHeader from "./components/DashboardHeader";
import SummaryCards from "./components/SummaryCards";
import RevenueChartSection from "./components/RevenueChartSection";
import OccupancySection from "./components/OccupancySection";
import RecentActivityList from "./components/RecentActivityList";
import TopSpendersList from "./components/TopSpendersList";
import QuickActions from "./components/QuickActions";
import TenantDashboard from "./components/TenantDashboard";

export default async function DashboardPage() {
    const session = await getCurrentSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role === 'TENANT') {
        const dormName = await getDormName();
        return <TenantDashboard dormName={dormName} />;
    }

    // Initiate fetching in parallel
    const dormNameData = getDormName(session.organizationId);
    const summaryData = getDashboardSummary(session.organizationId);
    const revenueData = getRevenueChartData(session.organizationId);
    const occupancyData = getOccupancyChartData(session.organizationId);
    const activityData = getRecentActivity(session.organizationId);
    const topSpendersData = getTopSpenders(session.organizationId);

    return (
        <div className="space-y-8 pb-10">
            <Suspense fallback={<div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />}>
                <HeaderSection dormNameData={dormNameData} summaryData={summaryData} />
            </Suspense>

            <Suspense fallback={<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />)}</div>}>
                <SummarySection summaryData={summaryData} />
            </Suspense>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Suspense fallback={<div className="lg:col-span-2 h-96 bg-gray-200 rounded-2xl animate-pulse" />}>
                    <RevenueSection revenueData={revenueData} />
                </Suspense>

                <Suspense fallback={<div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />}>
                    <OccupancySectionWrapper occupancyData={occupancyData} />
                </Suspense>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Suspense fallback={<div className="lg:col-span-2 h-80 bg-gray-200 rounded-2xl animate-pulse" />}>
                    <ActivitySection activityData={activityData} />
                </Suspense>

                <Suspense fallback={<div className="h-80 bg-gray-200 rounded-2xl animate-pulse" />}>
                    <TopSpendersSection topSpendersData={topSpendersData} />
                </Suspense>
            </div>

            <QuickActions />
        </div>
    );
}

// --- Server Component Wrappers ---

async function HeaderSection({ dormNameData, summaryData }: { dormNameData: Promise<string>, summaryData: Promise<DashboardSummary> }) {
    const [dormName, summary] = await Promise.all([dormNameData, summaryData]);
    return <DashboardHeader dormName={dormName} outstanding={summary.outstanding} />;
}

async function SummarySection({ summaryData }: { summaryData: Promise<DashboardSummary> }) {
    const summary = await summaryData;
    return <SummaryCards summary={summary} />;
}

async function RevenueSection({ revenueData }: { revenueData: Promise<RevenueChartData[]> }) {
    const data = await revenueData;
    return <RevenueChartSection data={data} />;
}

async function OccupancySectionWrapper({ occupancyData }: { occupancyData: Promise<OccupancyChartData[]> }) {
    const data = await occupancyData;
    return <OccupancySection data={data} />;
}

async function ActivitySection({ activityData }: { activityData: Promise<ActivityItem[]> }) {
    const data = await activityData;
    return <RecentActivityList activity={data} />;
}

async function TopSpendersSection({ topSpendersData }: { topSpendersData: Promise<TopSpenderItem[]> }) {
    const data = await topSpendersData;
    return <TopSpendersList topSpenders={data} />;
}

