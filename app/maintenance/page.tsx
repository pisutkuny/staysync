import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import MaintenanceClient from "./MaintenanceClient";

export default async function MaintenancePage() {
    const session = await getCurrentSession();

    if (!session) {
        redirect("/login");
    }

    // Fetch rooms for per-room view
    const rooms = await prisma.room.findMany({
        where: { status: "Occupied" },
        orderBy: { number: "asc" },
        select: { id: true, number: true }
    });

    return <MaintenanceClient rooms={rooms} />;
}
