"use client";

import { LogOut } from "lucide-react";

export default function LogoutButton() {
    const handleLogout = async () => {
        if (!confirm("Are you sure you want to sign out?")) return;

        try {
            await fetch("/api/logout", { method: "POST" });
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout failed:", error);
            window.location.href = "/login";
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium mt-auto"
        >
            <LogOut size={20} />
            Sign Out
        </button>
    );
}
