"use client";

import Link from "next/link";
import { LayoutDashboard, Receipt, FileText, DoorOpen, Megaphone } from "lucide-react";

export default function NavLinks({ userRole, onClick }: { userRole?: string, onClick?: () => void }) {
    const handleClick = () => {
        if (onClick) onClick();
    };

    return (
        <nav className="px-4 space-y-2">
            <Link onClick={handleClick} href="/" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all font-medium">
                <LayoutDashboard size={20} />
                Dashboard
            </Link>
            <Link onClick={handleClick} href="/rooms" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all font-medium">
                <DoorOpen size={20} />
                Rooms
            </Link>

            {/* Billing only for Owner */}
            {userRole === "OWNER" && (
                <Link onClick={handleClick} href="/billing" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all font-medium">
                    <Receipt size={20} />
                    Billing
                </Link>
            )}

            <Link onClick={handleClick} href="/issues" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all font-medium">
                <FileText size={20} />
                Pending Issues
            </Link>

            <Link onClick={handleClick} href="/report" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all font-medium">
                <FileText size={20} />
                Report Issue
            </Link>

            {userRole === "OWNER" && (
                <Link onClick={handleClick} href="/broadcast" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all font-medium">
                    <Megaphone size={20} />
                    Broadcast
                </Link>
            )}
        </nav>
    );
}
