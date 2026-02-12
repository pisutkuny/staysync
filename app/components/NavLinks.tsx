"use client";

import Link from "next/link";
import { NAV_ITEMS } from "../constants/navigation";
import { usePathname } from "next/navigation";

export default function NavLinks({ userRole, onClick }: { userRole?: string, onClick?: () => void }) {
    const pathname = usePathname();
    const handleClick = () => {
        if (onClick) onClick();
    };

    // Filter items based on role
    const effectiveRole = userRole === 'ADMIN' ? 'OWNER' : userRole;

    const filteredItems = NAV_ITEMS.filter(item => {
        if (!effectiveRole) return false;
        const allowedRoles = item.roles || [];
        return (allowedRoles as readonly string[]).includes(effectiveRole);
    });

    return (
        <nav className="px-3 pb-2 space-y-1">
            {filteredItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                    <Link
                        key={item.href}
                        onClick={handleClick}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive
                                ? "bg-indigo-50 text-indigo-600"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                    >
                        <div className={`transition-colors ${isActive ? "text-indigo-600" : "text-gray-500 group-hover:text-gray-700"
                            }`}>
                            <Icon size={20} strokeWidth={2} />
                        </div>
                        <span className="text-sm font-medium leading-none">
                            {item.label}
                        </span>
                        {isActive && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
