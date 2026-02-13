import { LogOut } from "lucide-react";
import { useModal } from "../context/ModalContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LogoutButton({ label = "Sign Out" }: { label?: string }) {
    const { showConfirm } = useModal();
    const { t } = useLanguage();

    const handleLogout = async () => {
        const confirmed = await showConfirm(
            t.common.logout,
            t.common.confirmDelete ? t.common.confirmDelete.replace("delete this item", "sign out").replace("ลบรายการนี้", "ออกจากระบบ") : "Are you sure you want to sign out?",
            true
        );

        if (!confirmed) return;

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
