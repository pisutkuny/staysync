
import { LayoutDashboard, Receipt, FileText, DoorOpen, Megaphone, Settings, Wrench, Calculator } from "lucide-react";

export const NAV_ITEMS = [
    {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        roles: ["OWNER", "STAFF", "TENANT"] // Visible to all (or logic handled in component)
    },
    {
        label: "Rooms",
        href: "/rooms",
        icon: DoorOpen,
        roles: ["OWNER", "STAFF"]
    },
    {
        label: "Billing",
        href: "/billing",
        icon: Receipt,
        roles: ["OWNER"]
    },
    {
        label: "Repair Requests",
        href: "/admin/issues",
        icon: Wrench,
        roles: ["OWNER", "STAFF"]
    },
    {
        label: "Report Issue",
        href: "/report",
        icon: FileText,
        roles: ["OWNER", "STAFF", "TENANT"]
    },
    {
        label: "Broadcast",
        href: "/broadcast",
        icon: Megaphone,
        roles: ["OWNER"]
    },
    {
        label: "Bulk Meter Entry",
        href: "/admin/billing/bulk",
        icon: Calculator,
        roles: ["OWNER"]
    },
    {
        label: "Monthly Report",
        href: "/admin/reports",
        icon: FileText,
        roles: ["OWNER"]
    },
    {
        label: "Central Meter",
        href: "/admin/central-meter",
        icon: Calculator,
        roles: ["OWNER"]
    },
    {
        label: "Utility Analysis",
        href: "/admin/utility-analysis",
        icon: LayoutDashboard,
        roles: ["OWNER"]
    },
    {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        roles: ["OWNER"]
    }
];
