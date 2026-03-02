import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import MaintenanceClient from "./MaintenanceClient";

export default async function MaintenancePage() {
    const session = await getCurrentSession();

    if (!session) {
        redirect("/login");
    }

    return <MaintenanceClient />;
}
