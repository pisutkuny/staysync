"use client";

import Link from "next/link";
import { NAV_ITEMS, NavItem } from "../constants/navigation";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Circle } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function NavLinks({ userRole, onClick }: { userRole?: string, onClick?: () => void }) {
    const { t } = useLanguage();
    const pathname = usePathname();
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

    // Helper to map labels
    const getLabel = (label: string) => {
        const map: Record<string, string> = {
            "Dashboard": t.sidebar.dashboard,
            "Room Management": t.sidebar.roomManagement,
            "Book Room": t.sidebar.bookRoom,
            "Bookings": t.sidebar.bookings,
            "Rooms": t.sidebar.rooms,
            "Billing & Utilities": t.sidebar.billingUtilities,
            "Billing": t.sidebar.billing,
            "Bulk Meter Entry": t.sidebar.bulkMeter,
            "Monthly Report": t.sidebar.monthlyReport,
            "Central Meter": t.sidebar.centralMeter,
            "Utility Analysis": t.sidebar.utilityAnalysis,
            "Expense Tracking": t.sidebar.expenseTracking,
            "Maintenance": t.sidebar.maintenance,
            "Report Issue": t.sidebar.reportIssue,
            "Repair Requests": t.sidebar.repairRequests,
            "Issues Log": t.sidebar.issuesLog,
            "System": t.sidebar.system,
            "User Management": t.sidebar.users,
            "Broadcast": t.sidebar.broadcast,
            "Audit Logs": t.sidebar.auditLogs,
            "Backup & Restore": t.sidebar.backupRestore,
            "Settings": t.sidebar.generalSettings,
        };
        return map[label] || label;
    };

    // Helper to check role
    const hasRole = (roles?: string[]) => {
        if (!userRole && (!roles || roles.length === 0)) return false;
        if (!roles || roles.length === 0) return true;
        const effectiveRole = userRole === 'ADMIN' ? 'OWNER' : userRole;
        return effectiveRole && roles.includes(effectiveRole);
    };

    // Auto-expand groups based on current path
    useEffect(() => {
        const groupsToExpand: string[] = [];
        NAV_ITEMS.forEach(group => {
            if (group.children) {
                const hasActiveChild = group.children.some(child => child.href === pathname);
                if (hasActiveChild) {
                    groupsToExpand.push(group.label);
                }
            }
        });
        setExpandedGroups(prev => Array.from(new Set([...prev, ...groupsToExpand])));
    }, [pathname]);

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev =>
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        );
    };

    const handleClick = () => {
        if (onClick) onClick();
    };

    // Helper to get color classes based on group color
    const getColorClasses = (color: string | undefined, isActive: boolean, isGroup: boolean = false) => {
        const baseColor = color || "gray";

        // Define color mappings for dynamic classes (Tailwind requires full class names for safe purging, but dynamic string interpolation works if classes are Safelisted or if we Map explicitly)
        // Better approach: explicit mapping for supported colors
        const colorMap: Record<string, any> = {
            indigo: {
                activeBg: "bg-indigo-50",
                activeText: "text-indigo-600",
                icon: "text-indigo-600",
                hoverBg: "hover:bg-indigo-50",
                hoverText: "hover:text-indigo-600"
            },
            blue: {
                activeBg: "bg-blue-50",
                activeText: "text-blue-600",
                icon: "text-blue-600",
                hoverBg: "hover:bg-blue-50",
                hoverText: "hover:text-blue-600"
            },
            emerald: {
                activeBg: "bg-emerald-50",
                activeText: "text-emerald-600",
                icon: "text-emerald-600",
                hoverBg: "hover:bg-emerald-50",
                hoverText: "hover:text-emerald-600"
            },
            orange: {
                activeBg: "bg-orange-50",
                activeText: "text-orange-600",
                icon: "text-orange-600",
                hoverBg: "hover:bg-orange-50",
                hoverText: "hover:text-orange-600"
            },
            slate: {
                activeBg: "bg-slate-100",
                activeText: "text-slate-700",
                icon: "text-slate-600",
                hoverBg: "hover:bg-slate-100",
                hoverText: "hover:text-slate-700"
            },
            gray: {
                activeBg: "bg-gray-100",
                activeText: "text-gray-900",
                icon: "text-gray-600",
                hoverBg: "hover:bg-gray-50",
                hoverText: "hover:text-gray-900"
            }
        };

        const theme = colorMap[baseColor] || colorMap["gray"];

        if (isGroup) {
            // style for Group Header
            if (isActive) { // Group is expanded or has active child
                return `${theme.activeText} ${theme.activeBg} font-bold ring-1 ring-inset ring-current/10`;
            }
            return `text-slate-600 ${theme.hoverBg} ${theme.hoverText}`;
        } else {
            // Style for single link or child link
            if (isActive) {
                // Add border-l-4 for active indication (Accessibility)
                const activeBorder =
                    baseColor === 'indigo' ? 'border-l-4 border-indigo-600 pl-[9px]' :
                        baseColor === 'blue' ? 'border-l-4 border-blue-600' :
                            baseColor === 'emerald' ? 'border-l-4 border-emerald-600' :
                                baseColor === 'orange' ? 'border-l-4 border-orange-600' :
                                    'border-l-4 border-slate-600';

                return `${theme.activeBg} ${theme.activeText} font-bold shadow-sm ${activeBorder} ring-1 ring-inset ring-black/5`;
            }
            return `text-slate-600 ${theme.hoverBg} ${theme.hoverText} border-l-4 border-transparent`;
        }
    };

    return (
        <nav className="px-3 pb-4 space-y-2">
            {NAV_ITEMS.map((item) => {
                if (!hasRole(item.roles)) return null;

                // Single Item
                if (!item.children) {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    const colorClass = getColorClasses(item.color, isActive);

                    return (
                        <Link
                            key={item.href}
                            onClick={handleClick}
                            href={item.href!}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${colorClass}`}
                        >
                            <div className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? "" : "text-gray-400 group-hover:text-current"}`}>
                                {Icon && <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />}
                            </div>
                            <span className="text-sm font-medium leading-none">
                                {item.label}
                            </span>
                            {isActive && (
                                <div className={`ml-auto w-2 h-2 rounded-full ${item.color === 'indigo' ? 'bg-indigo-500' : 'bg-current opacity-60'}`}></div>
                            )}
                        </Link>
                    );
                }

                // Group Item
                const isExpanded = expandedGroups.includes(item.label);
                const Icon = item.icon;
                const hasActiveChild = item.children.some(child => child.href === pathname);
                const colorClass = getColorClasses(item.color, hasActiveChild || isExpanded, true);

                return (
                    <div key={item.label} className="space-y-1">
                        <button
                            onClick={() => toggleGroup(item.label)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${colorClass}`}
                        >
                            {/* Accent line for active groups */}
                            {hasActiveChild && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-current opacity-40"></div>
                            )}

                            <div className={`transition-transform duration-200 group-hover:scale-110 ${hasActiveChild ? "" : "text-gray-400 group-hover:text-current"}`}>
                                {Icon && <Icon size={22} strokeWidth={hasActiveChild ? 2.5 : 2} />}
                            </div>
                            <span className="text-sm font-medium leading-none flex-1 text-left">
                                {item.label}
                            </span>
                            <div className="text-current opacity-50">
                                {isExpanded ? <ChevronDown size={16} strokeWidth={3} /> : <ChevronRight size={16} strokeWidth={3} />}
                            </div>
                        </button>

                        {/* Submenu */}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                            <div className="pl-4 space-y-0.5 mt-1 border-l-2 border-gray-100 ml-4 mb-2">
                                {item.children.map(child => {
                                    if (!hasRole(child.roles)) return null;
                                    const isChildActive = pathname === child.href;

                                    // Child inherits color theme from parent
                                    const theme = getColorClasses(item.color, isChildActive);

                                    return (
                                        <Link
                                            key={child.href}
                                            onClick={handleClick}
                                            href={child.href!}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ml-2 ${isChildActive
                                                ? `${theme} bg-opacity-50` // Softer bg for child
                                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                                }`}
                                        >
                                            <span className={`text-[13px] ${isChildActive ? "font-semibold" : "font-medium"}`}>
                                                {child.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            })}
        </nav>
    );
}
