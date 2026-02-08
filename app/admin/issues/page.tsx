"use client";

import { useState, useEffect } from "react";
import { Loader2, Wrench, CheckCircle, Clock, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Issue {
    id: number;
    category: string;
    description: string;
    photo: string | null;
    status: "Pending" | "In Progress" | "Done";
    createdAt: string;
    resident: {
        fullName: string;
        room: {
            number: string;
        } | null;
    } | null;
    reporterName?: string;
}

export default function IssuesBoardPage() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<number | null>(null);

    const fetchIssues = async () => {
        try {
            const res = await fetch("/api/issues");
            if (res.ok) {
                const data = await res.json();
                setIssues(data);
            }
        } catch (error) {
            console.error("Failed to fetch issues", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    const updateStatus = async (id: number, newStatus: string) => {
        setUpdating(id);
        try {
            const res = await fetch(`/api/issues/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                // Optimistic update
                setIssues(prev => prev.map(issue =>
                    issue.id === id ? { ...issue, status: newStatus as any } : issue
                ));
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            alert("Error updating status");
        } finally {
            setUpdating(null);
        }
    };

    const getColumns = () => {
        return {
            Pending: issues.filter(i => i.status === "Pending" || !i.status), // Default to pending if null
            InProgress: issues.filter(i => i.status === "In Progress"),
            Done: issues.filter(i => i.status === "Done"),
        };
    };

    const columns = getColumns();

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Wrench className="text-indigo-600" />
                        Repair Requests
                    </h1>
                    <p className="text-gray-500">Manage and track maintenance issues.</p>
                </div>
                <button onClick={fetchIssues} className="text-sm text-indigo-600 hover:underline">
                    Refresh Board
                </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden min-h-0">
                {/* Pending Column */}
                <div className="bg-gray-50 rounded-xl flex flex-col border border-gray-200 h-full">
                    <div className="p-4 border-b border-gray-200 bg-gray-100/50 flex justify-between items-center">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            <AlertCircle size={18} className="text-amber-500" />
                            Pending ({columns.Pending.length})
                        </h2>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto flex-1">
                        {columns.Pending.map(issue => (
                            <IssueCard key={issue.id} issue={issue} onMove={() => updateStatus(issue.id, "In Progress")} updating={updating === issue.id} type="Pending" />
                        ))}
                    </div>
                </div>

                {/* In Progress Column */}
                <div className="bg-blue-50 rounded-xl flex flex-col border border-blue-100 h-full">
                    <div className="p-4 border-b border-blue-200 bg-blue-100/50 flex justify-between items-center">
                        <h2 className="font-bold text-blue-800 flex items-center gap-2">
                            <Clock size={18} className="text-blue-600" />
                            In Progress ({columns.InProgress.length})
                        </h2>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto flex-1">
                        {columns.InProgress.map(issue => (
                            <IssueCard
                                key={issue.id}
                                issue={issue}
                                onMove={() => updateStatus(issue.id, "Done")}
                                onBack={() => updateStatus(issue.id, "Pending")}
                                updating={updating === issue.id}
                                type="InProgress"
                            />
                        ))}
                    </div>
                </div>

                {/* Done Column */}
                <div className="bg-green-50 rounded-xl flex flex-col border border-green-100 h-full">
                    <div className="p-4 border-b border-green-200 bg-green-100/50 flex justify-between items-center">
                        <h2 className="font-bold text-green-800 flex items-center gap-2">
                            <CheckCircle size={18} className="text-green-600" />
                            Done ({columns.Done.length})
                        </h2>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto flex-1">
                        {columns.Done.map(issue => (
                            <IssueCard
                                key={issue.id}
                                issue={issue}
                                onBack={() => updateStatus(issue.id, "In Progress")}
                                updating={updating === issue.id}
                                type="Done"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function IssueCard({ issue, onMove, onBack, updating, type }: {
    issue: Issue,
    onMove?: () => void,
    onBack?: () => void,
    updating: boolean,
    type: "Pending" | "InProgress" | "Done"
}) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">
                    {issue.resident?.room?.number || "Public"}
                </span>
                <span className="text-xs text-gray-400">
                    {new Date(issue.createdAt).toLocaleDateString()}
                </span>
            </div>

            <h3 className="font-bold text-gray-900 text-sm mb-1">{issue.category}</h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{issue.description}</p>

            {issue.photo && (
                <div className="mb-3">
                    <a href={issue.photo} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 underline">View Photo</a>
                </div>
            )}

            <div className="flex gap-2 mt-2">
                {onBack && (
                    <button
                        onClick={onBack}
                        disabled={updating}
                        className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs font-bold flex justify-center items-center gap-1 transition-colors"
                    >
                        <ArrowLeft size={14} /> Back
                    </button>
                )}
                {onMove && (
                    <button
                        onClick={onMove}
                        disabled={updating}
                        className={`flex-1 py-1.5 rounded text-white text-xs font-bold flex justify-center items-center gap-1 transition-colors ${type === "Pending" ? "bg-indigo-600 hover:bg-indigo-700" :
                                type === "InProgress" ? "bg-green-600 hover:bg-green-700" : "bg-gray-600"
                            }`}
                    >
                        {updating ? <Loader2 className="animate-spin" size={14} /> : (
                            <>
                                {type === "Pending" ? "Start Job" : "Finish"} <ArrowRight size={14} />
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
