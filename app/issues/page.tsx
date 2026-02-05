import prisma from "@/lib/prisma";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import IssueItem from "./IssueItem";

export const dynamic = 'force-dynamic';

export default async function IssuesPage() {
    const issues = await prisma.issue.findMany({
        where: { status: "Pending" },
        include: { resident: { include: { room: true } } },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Pending Issues</h2>
                    <p className="text-gray-500 mt-2">Manage maintenance requests.</p>
                </div>
                <Link href="/report" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                    + New Issue
                </Link>
            </div>

            <div className="space-y-4">
                {issues.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No pending issues.</p>
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
