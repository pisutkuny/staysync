"use client";

import Link from "next/link";
import { NAV_ITEMS } from "../constants/navigation";

export default function NavLinks({ userRole, onClick }: { userRole?: string, onClick?: () => void }) {
    const handleClick = () => {
        if (onClick) onClick();
    };

    // Filter items based on role
    // Treat ADMIN same as OWNER (full access)
    const effectiveRole = userRole === 'ADMIN' ? 'OWNER' : userRole;

    const filteredItems = NAV_ITEMS.filter(item => {
        // If no role specified, show limited access (none)
        if (!effectiveRole) return false;

        // Check if user's role is in the allowed roles for this item
        // Safely handle if roles is undefined (though it should be defined in constants)
        const allowedRoles = item.roles || [];
        return (allowedRoles as readonly string[]).includes(effectiveRole);
    });

    return (
        <nav className="px-2 pb-2">
            {/* Compact Grid Layout - 2 columns, minimal spacing */}
            <div className="grid grid-cols-2 gap-1.5">
                {filteredItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            onClick={handleClick}
                            href={item.href}
                            className="flex flex-col items-center gap-1.5 p-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all group"
                        >
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 group-hover:bg-indigo-100 transition-colors">
                                <Icon size={18} className="text-gray-600 group-hover:text-indigo-600 transition-colors" />
                            </div>
                            <span className="text-[10px] font-medium text-center leading-tight">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
