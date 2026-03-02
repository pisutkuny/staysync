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

    // Start fetching data without awaiting — Suspense will stream it
    const billingData = getBillingData();

    return (
        <Suspense fallback={<BillingLoading />}>
            <BillingContent billingData={billingData} />
        </Suspense>
    );
}

async function BillingContent({ billingData }: { billingData: ReturnType<typeof getBillingData> }) {
    const { rooms, bills, config } = await billingData;
    const occupiedRooms = rooms.filter((r: any) => r.status === "Occupied");

    return (
        <BillingClient
            rooms={occupiedRooms}
            bills={bills}
            allRooms={rooms}
            config={config}
        />
    );
}
