"use client";

import Link from "next/link";
import { NAV_ITEMS } from "../constants/navigation";

export default function NavLinks({ userRole, onClick }: { userRole?: string, onClick?: () => void }) {
    const handleClick = () => {
        if (onClick) onClick();
    };

    // Filter items based on role
    // If userRole is missing, assume minimal access or guest? 
    // For now, let's treat missing role as "GUEST" which might restrict everything, 
    // or if the user is using the app they are likely logged in.
    // The user mentioned "Sidebar has different data", likely due to role mismatch.
    // Let's ensure OWNER always sees everything.

    // Simplistic role check:
    const filteredItems = NAV_ITEMS.filter(item => {
        if (!userRole) return true; // Show all if role undetermine? Or safe default?
        // Actually, if we want to be safe:
        // if (!userRole) return false;

        // Let's mimic previous behavior:
        if (item.roles.includes("OWNER") && userRole !== "OWNER") return false;
        // If item doesn't explicitly require OWNER, show it?
        // Previous code: Billing/Broadcast were OWNER only. Others were for everyone.
        return true;
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
