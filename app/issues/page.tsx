import prisma from "@/lib/prisma";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

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
                        <div key={issue.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg uppercase">
                                        {issue.category}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(issue.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-gray-900 font-medium mb-1">{issue.description}</p>
                                {issue.photo && (
                                    <div className="mb-2 mt-2">
                                        <a href={issue.photo} target="_blank" rel="noopener noreferrer">
                                            <img src={issue.photo} alt="Issue" className="w-full h-32 object-cover rounded-lg border border-gray-100 hover:opacity-90 transition-opacity" />
                                        </a>
                                    </div>
                                )}
                                <p className="text-sm text-gray-600">
                                    Reported by <span className="font-medium text-indigo-600">{issue.resident?.fullName}</span> (Room {issue.resident?.room?.number || "N/A"})
                                </p>
                            </div>

                            <div className="flex gap-2">
                                {/* Action Buttons */}
                                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors">
                                    <CheckCircle2 size={18} />
                                    Mark Done
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
