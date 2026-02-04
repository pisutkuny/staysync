import prisma from "@/lib/prisma";
import PaymentForm from "./PaymentForm";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch System Config
    const config = await prisma.systemConfig.findFirst();

    // Verify bill exists (Optional but good practice)
    const billing = await prisma.billing.findUnique({
        where: { id: Number(id) }
    });

    if (!billing) {
        return notFound();
    }

    return <PaymentForm id={id} config={config} />;
}
