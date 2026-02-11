import prisma from "@/lib/prisma";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import IssueItem from "./IssueItem";

export const dynamic = 'force-dynamic';

export default async function IssuesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { status } = await searchParams;
    const currentStatus = (status as string) || "Pending";

    const issues = await prisma.issue.findMany({
        where: { status: currentStatus },
        include: { resident: { include: { room: true } } },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-8">
            {/* Enhanced Gradient Header */}
            <div className="bg-gradient-to-r from-red-600 via-pink-600 to-rose-600 rounded-2xl p-8 shadow-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg">
                            🔧 {currentStatus === "Pending" ? "Pending Issues" : "Maintenance History"}
                        </h2>
                        <p className="text-pink-100 mt-2 text-lg">
                            {currentStatus === "Pending" ? "Manage active requests." : "View resolved issues."}
                        </p>
                    </div>
                    <Link href="/report" className="bg-white text-red-700 px-6 py-3 rounded-xl font-bold hover:bg-red-50 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 whitespace-nowrap border-2 border-white/30 hover:scale-105">
                        ➕ New Issue
                    </Link>
                </div>
            </div>

            {/* Enhanced Tabs */}
            <div className="flex space-x-2 bg-gradient-to-r from-gray-100 to-gray-200 p-1.5 rounded-2xl w-fit shadow-md">
                <Link
                    href="/issues?status=Pending"
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${currentStatus === "Pending"
                        ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                        }`}
                >
                    🔴 Pending
                </Link>
                <Link
                    href="/issues?status=Done"
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${currentStatus === "Done"
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                        }`}
                >
                    ✅ History
                </Link>
            </div>

            <div className="space-y-4">
                {issues.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No {currentStatus.toLowerCase()} issues found.</p>
                    </div>
                ) : (
                    issues.map((issue: any) => (
                        <IssueItem key={issue.id} issue={issue} />
                    ))
                )}
            </div>
        </div>
    );
}
