import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import MaintenancePrintClient from "./MaintenancePrintClient";

export default async function MaintenancePrintPage() {
    const session = await getCurrentSession();

    if (!session) {
        redirect("/login");
    }

    const rooms = await prisma.room.findMany({
        where: { status: "Occupied" },
        orderBy: { number: "asc" },
        select: { id: true, number: true }
    });

    return <MaintenancePrintClient rooms={rooms} />;
}
