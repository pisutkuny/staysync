"use client";

import { LogOut } from "lucide-react";

export default function LogoutButton({ label = "Sign Out" }: { label?: string }) {
    const handleLogout = async () => {
        if (!confirm("Are you sure you want to sign out?")) return;

        try {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/";
        } catch (error) {
            console.error("Logout failed:", error);
            window.location.href = "/";
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium mt-auto"
        >
            <LogOut size={20} />
            {label}
        </button>
    );
}
