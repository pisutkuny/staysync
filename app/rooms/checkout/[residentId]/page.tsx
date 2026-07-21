import CheckoutWizardClient from "./CheckoutWizardClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CheckoutPage({
    params,
}: {
    params: Promise<{ residentId: string }>;
}) {
    const { residentId } = await params;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                            🚪 Check-out Wizard
                        </h1>
                        <p className="text-red-100 mt-1 text-sm">ดำเนินการย้ายออกแบบขั้นตอน</p>
                    </div>
                    <Link href="/rooms">
                        <button className="bg-white text-red-700 px-5 py-2.5 rounded-xl font-bold hover:bg-red-50 transition flex items-center gap-2 shadow-md">
                            <ArrowLeft size={18} /> กลับหน้าห้องพัก
                        </button>
                    </Link>
                </div>
            </div>

            {/* Wizard */}
            <CheckoutWizardClient residentId={parseInt(residentId)} />
        </div>
    );
}
