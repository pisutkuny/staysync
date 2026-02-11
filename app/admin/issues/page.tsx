"use client";

import { useState, useEffect } from "react";
import { Loader2, Wrench, CheckCircle, Clock, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Issue {
    id: number;
    category: string;
    description: string;
    photo: string | null;
    afterPhoto?: string | null;
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
    const [completingIssue, setCompletingIssue] = useState<Issue | null>(null);

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

    const updateStatus = async (id: number, newStatus: string, afterPhoto?: string) => {
        setUpdating(id);
        try {
            const body: any = { status: newStatus };
            if (afterPhoto) body.afterPhoto = afterPhoto;

            const res = await fetch(`/api/issues/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                // Optimistic update
                setIssues(prev => prev.map(issue =>
                    issue.id === id ? { ...issue, status: newStatus as any, afterPhoto: afterPhoto || issue.afterPhoto } : issue
                ));
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            alert("Error updating status");
        } finally {
            setUpdating(null);
            setCompletingIssue(null);
        }
    };

    const handleComplete = (issue: Issue) => {
        setCompletingIssue(issue);
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
        <div className="space-y-6">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-2xl p-8 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                    <div>
                        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center justify-center md:justify-start gap-3">
                            <Wrench size={32} className="md:w-10 md:h-10" />
                            Repair Requests
                        </h2>
                        <p className="text-orange-100 mt-2 text-lg">Manage and track maintenance issues</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-white font-medium flex-1 md:flex-none text-center whitespace-nowrap">
                            ⏳ Pending: {columns.Pending.length}
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-white font-medium flex-1 md:flex-none text-center whitespace-nowrap">
                            🔨 In Progress: {columns.InProgress.length}
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-white font-medium flex-1 md:flex-none text-center whitespace-nowrap">
                            ✅ Done: {columns.Done.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="h-[calc(100vh-280px)] flex flex-col relative w-full min-h-0">
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
                                onMove={() => handleComplete(issue)}
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

            {/* Completion Modal */}
            {completingIssue && (
                <CompletionModal
                    issue={completingIssue}
                    onClose={() => setCompletingIssue(null)}
                    onComplete={(url) => updateStatus(completingIssue.id, "Done", url)}
                />
            )}
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
                <div className="mb-2">
                    <a href={issue.photo} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 underline">View Issue Photo</a>
                </div>
            )}

            {issue.afterPhoto && (
                <div className="mb-3">
                    <a href={issue.afterPhoto} target="_blank" rel="noreferrer" className="text-xs text-green-600 underline font-bold">View Completion Photo</a>
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

function CompletionModal({ issue, onClose, onComplete }: { issue: Issue, onClose: () => void, onComplete: (url?: string) => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!file) {
            onComplete(); // Complete without photo
            return;
        }

        setUploading(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        try {
            const formData = new FormData();
            formData.append("file", file);

            // Add Folder ID if configured
            const repairFolderId = process.env.NEXT_PUBLIC_REPAIR_FOLDER_ID;
            if (repairFolderId) {
                formData.append("folderId", repairFolderId);
            }

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Upload failed with status ${res.status}`);
            }

            const data = await res.json();

            if (data.success) {
                setUploadedUrl(data.url);
                setUploading(false);
            } else {
                throw new Error(data.error || "Unknown upload error");
            }
        } catch (e: any) {
            clearTimeout(timeoutId);
            console.error("Upload Error:", e);
            if (e.name === 'AbortError') {
                alert("Upload timed out. Please check your internet or Google Drive script.");
            } else {
                alert(`Upload failed: ${e.message}`);
            }
            setUploading(false);
        }
    };

    // Success View
    if (uploadedUrl) {
        return (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4 rounded-xl">
                <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-green-100 p-3 rounded-full">
                            <CheckCircle size={32} className="text-green-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-bold mb-2">Upload Successful!</h3>
                    <p className="text-gray-500 text-sm mb-4">The completion photo has been saved.</p>

                    <div className="mb-6 p-2 bg-gray-50 rounded border border-gray-200">
                        <img src={uploadedUrl} alt="Uploaded" className="w-full h-32 object-cover rounded mb-2" />
                        <a href={uploadedUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 underline block break-all">
                            {uploadedUrl}
                        </a>
                    </div>

                    <button
                        onClick={() => onComplete(uploadedUrl)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold"
                    >
                        Finish Job & Notify User
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4 rounded-xl">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-lg font-bold mb-4">Complete Job #{issue.id}</h3>

                <p className="text-gray-600 mb-4 text-sm">Upload a photo of the completed repair (Optional).</p>
                <input
                    type="file"
                    accept="image/*"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mb-6"
                />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} disabled={uploading} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-bold">Cancel</button>
                    <button onClick={handleSubmit} disabled={uploading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                        {uploading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                        Confirm Done
                    </button>
                </div>

            </div>
        </div>
    );
}
