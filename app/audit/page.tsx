"use client";

import { useEffect, useState } from "react";
import {
    FileText,
    Filter,
    Download,
    Calendar,
    User,
    Edit,
    Trash2,
    Plus,
    Eye,
} from "lucide-react";

interface AuditLog {
    id: number;
    action: string;
    entity: string;
    entityId: number | null;
    changes: any;
    createdAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    user: {
        id: number;
        email: string;
        fullName: string;
        role: string;
    };
}

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        entity: "",
        action: "",
    });

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.entity) params.append("entity", filters.entity);
            if (filters.action) params.append("action", filters.action);

            const res = await fetch(`/api/audit?${params.toString()}`);
            const data = await res.json();
            setLogs(data.logs || []);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case "CREATE":
                return <Plus size={16} className="text-green-600" />;
            case "UPDATE":
                return <Edit size={16} className="text-blue-600" />;
            case "DELETE":
                return <Trash2 size={16} className="text-red-600" />;
            case "LOGIN":
                return <User size={16} className="text-indigo-600" />;
            default:
                return <Eye size={16} className="text-gray-600" />;
        }
    };

    const getActionBadgeColor = (action: string) => {
        switch (action) {
            case "CREATE":
                return "bg-green-100 text-green-700 border-green-300";
            case "UPDATE":
                return "bg-blue-100 text-blue-700 border-blue-300";
            case "DELETE":
                return "bg-red-100 text-red-700 border-red-300";
            case "LOGIN":
            case "LOGOUT":
                return "bg-indigo-100 text-indigo-700 border-indigo-300";
            default:
                return "bg-gray-100 text-gray-700 border-gray-300";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <FileText className="text-indigo-600" size={32} />
                                Audit Logs
                            </h1>
                            <p className="text-gray-500 mt-1">Track all changes and user activities</p>
                        </div>
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl">
                            <Download size={20} />
                            Export Logs
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <Filter className="text-gray-400" size={20} />
                        <select
                            value={filters.entity}
                            onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Entities</option>
                            <option value="User">User</option>
                            <option value="Room">Room</option>
                            <option value="Resident">Resident</option>
                            <option value="Billing">Billing</option>
                            <option value="Issue">Issue</option>
                            <option value="Expense">Expense</option>
                        </select>
                        <select
                            value={filters.action}
                            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Actions</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="DELETE">Delete</option>
                            <option value="LOGIN">Login</option>
                            <option value="LOGOUT">Logout</option>
                        </select>
                        <div className="ml-auto text-sm text-gray-500">
                            Showing {logs.length} logs
                        </div>
                    </div>
                </div>

                {/* Audit Log List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-200">
                        {logs.map((log) => (
                            <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">{getActionIcon(log.action)}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium border ${getActionBadgeColor(
                                                    log.action
                                                )}`}
                                            >
                                                {log.action}
                                            </span>
                                            <span className="text-sm font-medium text-gray-700">
                                                {log.entity}
                                                {log.entityId && (
                                                    <span className="text-gray-400"> #{log.entityId}</span>
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">
                                            <span className="font-medium">{log.user.fullName}</span>
                                            <span className="text-gray-400"> ({log.user.email})</span>
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(log.createdAt).toLocaleString()}
                                            </span>
                                            {log.ipAddress && (
                                                <span>IP: {log.ipAddress.split(",")[0]}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {logs.length === 0 && (
                        <div className="text-center py-12">
                            <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                            <p className="text-gray-500">No audit logs found</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Logs will appear here as users make changes
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
