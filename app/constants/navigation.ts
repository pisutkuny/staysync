
import { LayoutDashboard, Receipt, FileText, DoorOpen, Megaphone, Settings, Wrench, Calculator, Database, AlertCircle, Users, BedDouble, PieChart, Activity } from "lucide-react";

export interface NavItem {
    label: string;
    href?: string;
    icon?: any;
    roles?: string[];
    children?: NavItem[];
    color?: string; // Tailwind color class prefix e.g. "blue", "green"
}

export const NAV_ITEMS: NavItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["OWNER", "STAFF", "TENANT"],
        color: "indigo"
    },
    {
        label: "Room Management",
        icon: DoorOpen,
        roles: ["OWNER", "STAFF", "TENANT"],
        color: "blue",
        children: [
            {
                label: "Book Room",
                href: "/booking",
                roles: ["OWNER", "STAFF", "TENANT"]
            },
            {
                label: "Bookings",
                href: "/admin/bookings",
                roles: ["OWNER", "STAFF"]
            },
            {
                label: "Rooms",
                href: "/rooms",
                roles: ["OWNER", "STAFF"]
            }
        ]
    },
    {
        label: "Billing & Utilities",
        icon: Receipt,
        roles: ["OWNER"],
        color: "emerald",
        children: [
            {
                label: "Billing",
                href: "/billing",
                roles: ["OWNER"]
            },
            {
                label: "Bulk Meter Entry",
                href: "/billing/bulk",
                roles: ["OWNER"]
            },
            {
                label: "Monthly Report",
                href: "/admin/reports",
                roles: ["OWNER"]
            },
            {
                label: "Central Meter",
                href: "/admin/central-meter",
                roles: ["OWNER"]
            },
            {
                label: "Utility Analysis",
                href: "/admin/utility-analysis",
                roles: ["OWNER"]
            },
            {
                label: "Expense Tracking",
                href: "/expenses",
                roles: ["OWNER"]
            }
        ]
    },
    {
        label: "Maintenance",
        icon: Wrench,
        roles: ["OWNER", "STAFF", "TENANT"],
        color: "orange",
        children: [
            {
                label: "Report Issue",
                href: "/report",
                roles: ["OWNER", "STAFF", "TENANT"]
            },
            {
                label: "Repair Requests",
                href: "/admin/issues",
                roles: ["OWNER", "STAFF"]
            },
            {
                label: "Issues Log",
                href: "/issues",
                roles: ["OWNER", "STAFF"]
            }
        ]
    },
    {
        label: "System",
        icon: Settings,
        roles: ["OWNER"],
        color: "slate",
        children: [
            {
                label: "User Management",
                href: "/admin/users",
                roles: ["OWNER"]
            },
            {
                label: "Broadcast",
                href: "/broadcast",
                roles: ["OWNER"]
            },
            {
                label: "Audit Logs",
                href: "/audit",
                roles: ["OWNER"]
            },
            {
                label: "Backup & Restore",
                href: "/admin/backup",
                roles: ["OWNER"]
            },
            {
                label: "Settings",
                href: "/settings",
                roles: ["OWNER"]
            }
        ]
    }
];
