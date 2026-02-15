import { Suspense } from "react";
import { getResidentById } from "@/lib/data/residents";
import ResidentProfileClient from "./ResidentProfileClient";
import ResidentProfileLoading from "./loading";

export default async function ResidentProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Parse ID because params are always strings, but our DB uses Int
    const residentId = parseInt(id);

    // Fetch data directly in Server Component
    const resident = await getResidentById(residentId);

    return (
        <Suspense fallback={<ResidentProfileLoading />}>
            <ResidentProfileClient resident={resident} />
        </Suspense>
    );
}

