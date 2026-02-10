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
        return item.roles.includes(effectiveRole);
    });

    return (
        <nav className="px-4 space-y-2">
            {filteredItems.map((item) => {
                const Icon = item.icon;
                return (
                    <Link
                        key={item.href}
                        onClick={handleClick}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all font-medium"
                    >
                        <Icon size={20} />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
