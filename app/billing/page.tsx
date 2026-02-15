import { Suspense } from "react";
import { getBillingData } from "@/lib/data/billing";
import BillingClient from "./BillingClient";
import BillingLoading from "./loading";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function BillingPage() {
    const session = await getCurrentSession();

    if (!session) {
        redirect("/login");
    }

    const { rooms, bills, config } = await getBillingData();

    // Filter occupied rooms for billing form (matching original logic)
    const occupiedRooms = rooms.filter((r: any) => r.status === "Occupied");

    return (
        <Suspense fallback={<BillingLoading />}>
            <BillingClient
                rooms={occupiedRooms}
                bills={bills}
                allRooms={rooms}
                config={config}
            />
        </Suspense>
    );
}

