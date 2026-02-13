"use client";

import { useState, useEffect, use } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import UploadForm from "./UploadForm";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function UploadDocumentPage({ params }: { params: Promise<{ id: string }> }) {
    const { t } = useLanguage();
    const { id } = use(params);
    const [resident, setResident] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/residents/${id}`)
            .then(res => res.json())
            .then(data => {
                setResident(data.error ? null : data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
    if (!resident) return <div className="p-8">{t.residents.notFound}</div>;

    const roomNumber = resident.room ? resident.room.number : "Unknown Room";
    const roomFolder = `Room ${roomNumber}`;
    const profileFolder = resident.fullName;

    return (
        <div className="max-w-md mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/residents/${id}`} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-white" />
                </Link>
                <h1 className="text-2xl font-bold text-white">{t.residents.uploadDocument}</h1>
            </div>

            <UploadForm
                residentId={resident.id}
                roomFolder={roomFolder}
                profileFolder={profileFolder}
            />
        </div>
    );
}
