import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/data/dashboard";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
    const session = await getCurrentSession();

    if (!session) {
        redirect("/login");
    }

    const data = await getDashboardData(session);

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-red-500 gap-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-alert-circle"
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                Failed to load dashboard data. Please try again later.
            </div>
        );
    }

    return <DashboardClient data={data} />;
}
