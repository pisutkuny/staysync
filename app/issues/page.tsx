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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        {currentStatus === "Pending" ? "Pending Issues" : "Maintenance History"}
                    </h2>
                    <p className="text-gray-500 mt-2">
                        {currentStatus === "Pending" ? "Manage active requests." : "View resolved issues."}
                    </p>
                </div>
                <Link href="/report" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                    + New Issue
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
                <Link
                    href="/issues?status=Pending"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentStatus === "Pending"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                        }`}
                >
                    Pending
                </Link>
                <Link
                    href="/issues?status=Done"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentStatus === "Done"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                        }`}
                >
                    History
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
