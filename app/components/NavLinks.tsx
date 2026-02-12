"use client";

import Link from "next/link";
import { NAV_ITEMS, NavItem } from "../constants/navigation";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Circle } from "lucide-react";

export default function NavLinks({ userRole, onClick }: { userRole?: string, onClick?: () => void }) {
    const pathname = usePathname();
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

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
        // Only set if not already set to avoid overriding user interaction
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

    return (
        <nav className="px-3 pb-2 space-y-1">
            {NAV_ITEMS.map((item) => {
                if (!hasRole(item.roles)) return null;

                // Single Item
                if (!item.children) {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            onClick={handleClick}
                            href={item.href!}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive
                                    ? "bg-indigo-50 text-indigo-600"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            <div className={`transition-colors ${isActive ? "text-indigo-600" : "text-gray-500 group-hover:text-gray-700"
                                }`}>
                                {Icon && <Icon size={20} strokeWidth={2} />}
                            </div>
                            <span className="text-sm font-medium leading-none">
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                            )}
                        </Link>
                    );
                }

                // Group Item
                const isExpanded = expandedGroups.includes(item.label);
                const Icon = item.icon;
                const hasActiveChild = item.children.some(child => child.href === pathname);

                return (
                    <div key={item.label} className="space-y-1">
                        <button
                            onClick={() => toggleGroup(item.label)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${hasActiveChild
                                    ? "text-indigo-700 bg-indigo-50/50"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            <div className={`transition-colors ${hasActiveChild ? "text-indigo-600" : "text-gray-500 group-hover:text-gray-700"
                                }`}>
                                {Icon && <Icon size={20} strokeWidth={2} />}
                            </div>
                            <span className="text-sm font-medium leading-none flex-1 text-left">
                                {item.label}
                            </span>
                            <div className="text-gray-400">
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </div>
                        </button>

                        {/* Submenu */}
                        {isExpanded && (
                            <div className="pl-4 space-y-1">
                                {item.children.map(child => {
                                    if (!hasRole(child.roles)) return null;
                                    const isChildActive = pathname === child.href;

                                    return (
                                        <Link
                                            key={child.href}
                                            onClick={handleClick}
                                            href={child.href!}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ml-5 border-l border-gray-100 ${isChildActive
                                                    ? "text-indigo-600 font-medium"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                                }`}
                                        >
                                            <span className="text-sm leading-none">
                                                {child.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
