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
import { useLanguage } from "@/lib/i18n/LanguageContext";

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
    const { t } = useLanguage();
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
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                                <FileText className="text-white" size={32} />
                                {t.audit.title}
                            </h1>
                            <p className="text-indigo-100 mt-2 text-sm md:text-base">{t.audit.subtitle}</p>
                        </div>
                        <button className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl border border-white/30 hover:scale-105 text-sm">
                            <Download size={20} />
                            {t.audit.export}
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
                            <option value="">{t.audit.filter.allEntities}</option>
                            <option value="User">{t.audit.entities.User}</option>
                            <option value="Room">{t.audit.entities.Room}</option>
                            <option value="Resident">{t.audit.entities.Resident}</option>
                            <option value="Billing">{t.audit.entities.Billing}</option>
                            <option value="Issue">{t.audit.entities.Issue}</option>
                            <option value="Expense">{t.audit.entities.Expense}</option>
                        </select>
                        <select
                            value={filters.action}
                            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">{t.audit.filter.allActions}</option>
                            <option value="CREATE">{t.audit.actions.CREATE}</option>
                            <option value="UPDATE">{t.audit.actions.UPDATE}</option>
                            <option value="DELETE">{t.audit.actions.DELETE}</option>
                            <option value="LOGIN">{t.audit.actions.LOGIN}</option>
                            <option value="LOGOUT">{t.audit.actions.LOGOUT}</option>
                        </select>
                        <div className="ml-auto text-sm text-gray-500">
                            {t.audit.filter.showing.replace("{count}", logs.length.toString())}
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
                                                {t.audit.actions[log.action as keyof typeof t.audit.actions] || log.action}
                                            </span>
                                            <span className="text-sm font-medium text-gray-700">
                                                {t.audit.entities[log.entity as keyof typeof t.audit.entities] || log.entity}
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
                            <p className="text-gray-500">{t.audit.noData}</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {t.audit.noDataTip}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
