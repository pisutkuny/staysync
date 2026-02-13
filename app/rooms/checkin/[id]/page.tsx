import prisma from "@/lib/prisma";
import CheckInForm from "./CheckInForm";
import { notFound } from "next/navigation";

export default async function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const room = await prisma.room.findUnique({
        where: { id: Number(id) }
    });

    if (!room) {
        return notFound();
    }

    return (
        <CheckInForm
            roomId={id}
            roomNumber={room.number}
            roomPrice={room.price}
            isOccupied={room.status === "Occupied"}
            defaultContractDuration={room.defaultContractDuration}
            defaultDeposit={room.defaultDeposit}
        />
    );
}
