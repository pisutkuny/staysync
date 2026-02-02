import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, FileText, Upload, Trash2, Download } from "lucide-react";
import GenerateCodeButton from "./GenerateCodeButton";
import BillingHistory from "./BillingHistory";

export default async function ResidentProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const residentId = Number(id);
    const resident = await prisma.resident.findUnique({
        where: { id: residentId },
        include: {
            room: true,
            documents: true,
            billings: { orderBy: { createdAt: 'desc' } }
        }
    });

    if (!resident) {
        return <div className="p-8">Resident not found</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/rooms" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        {resident.fullName}
                        <Link href={`/residents/${resident.id}/edit`} className="text-gray-400 hover:text-indigo-600 transition-colors" title="Edit Profile">
                            <span className="sr-only">Edit</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                        </Link>
                    </h1>
                    <p className="text-gray-500">Room {resident.room?.number || 'N/A'} • {resident.phone}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Info & Documents & Verification */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Documents Section */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="text-indigo-600" size={20} />
                                Documents
                            </h2>
                            <Link
                                href={`/residents/${resident.id}/upload`}
                                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2"
                            >
                                <Upload size={16} />
                                Upload New
                            </Link>
                        </div>

                        {resident.documents.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <p className="text-gray-500 text-sm">No documents uploaded (Contracts, ID Cards, etc.)</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {resident.documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 shadow-sm text-red-500">
                                                {doc.url.endsWith('.pdf') ? "PDF" : "IMG"}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{doc.type}</p>
                                                <p className="text-xs text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <a href={doc.url} target="_blank" className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all" title="Download/View">
                                                <Download size={18} />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Verification Code Section */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Line Connection</h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Status</p>
                                {resident.lineUserId ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        Connected
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                        Not Connected
                                    </span>
                                )}
                            </div>
                            {/* Generate Code Component */}
                            <GenerateCodeButton residentId={resident.id} initialCode={resident.lineVerifyCode} />
                        </div>
                    </div>

                    {/* Management Actions */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Management</h2>
                        <Link
                            href={`/residents/${resident.id}/checkout`}
                            className="w-full py-3 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={20} />
                            Check Out Resident
                        </Link>
                    </div>

                </div>

                {/* Right Column: Billing History Summary */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Billing History</h2>
                        <BillingHistory billings={resident.billings} />
                    </div>
                </div>
            </div>
        </div>
    );
}
