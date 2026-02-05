import prisma from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import UploadForm from "./UploadForm";

export default async function UploadDocumentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const residentId = Number(id);

    // Fetch Resident & Room Info for Folder Naming
    const resident = await prisma.resident.findUnique({
        where: { id: residentId },
        include: { room: true }
    });

    if (!resident) {
        return <div>Resident not found</div>;
    }

    // Determine Folder Name: "Room X - [Name]"
    const roomNumber = resident.room ? resident.room.number : "Unknown Room";
    const folderName = `Room ${roomNumber} - ${resident.fullName}`;

    return (
        <div className="max-w-md mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/residents/${residentId}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
            </div>

            {/* Render Client Form with Server Data */}
            <UploadForm residentId={residentId} folderName={folderName} />
        </div>
    );
}
