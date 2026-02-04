"use client";

import { useState } from "react";
import { Loader2, Upload, File, ArrowLeft, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { use } from "react";

export default function UploadDocumentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const residentId = id;
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [docType, setDocType] = useState("Contract");

    // Mode Selection: 'file' or 'link'
    const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [externalLink, setExternalLink] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let finalUrl = "";

        if (uploadMode === 'file') {
            if (!selectedFile) return;
            setLoading(true);
            try {
                // 1. Upload File
                const uploadData = new FormData();
                uploadData.append("file", selectedFile);
                const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadData });

                if (!uploadRes.ok) {
                    const errorData = await uploadRes.json();
                    throw new Error(errorData.error || "Upload failed");
                }

                const { url } = await uploadRes.json();
                finalUrl = url;
            } catch (error: any) {
                alert("Upload Error: " + error.message);
                setLoading(false);
                return;
            }
        } else {
            // Link Mode
            if (!externalLink) return;
            finalUrl = externalLink;
        }

        try {
            setLoading(true);
            // 2. Save Document Record
            const res = await fetch("/api/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: docType,
                    url: finalUrl,
                    residentId: residentId,
                }),
            });

            if (!res.ok) throw new Error("Failed to save record");

            alert("Document saved successfully!");
            router.push(`/residents/${residentId}`);
        } catch (error) {
            alert("Error saving document record.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/residents/${residentId}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">

                {/* Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                    <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="Contract">Contract (สัญญาเช่า)</option>
                        <option value="ID Card">ID Card (สำเนาบัตรประชาชน)</option>
                        <option value="House Registration">House Registration (ทะเบียนบ้าน)</option>
                        <option value="Other">Other (อื่นๆ)</option>
                    </select>
                </div>

                {/* Mode Toggle */}
                <div className="flex p-1 bg-gray-100 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setUploadMode('file')}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${uploadMode === 'file' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Upload File
                    </button>
                    <button
                        type="button"
                        onClick={() => setUploadMode('link')}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${uploadMode === 'link' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        External Link
                    </button>
                </div>

                {/* Inputs based on Mode */}
                {uploadMode === 'file' ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">File (PDF or Image)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors relative cursor-pointer">
                            <input
                                type="file"
                                accept="application/pdf,image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {selectedFile ? (
                                <div className="flex flex-col items-center text-indigo-600">
                                    <File size={32} className="mb-2" />
                                    <span className="font-medium text-sm text-center px-4 truncate max-w-full">{selectedFile.name}</span>
                                </div>
                            ) : (
                                <>
                                    <Upload size={32} className="mb-2" />
                                    <span className="text-sm">Click to choose file</span>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">Stores in database (Max 5MB)</p>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Google Drive / External Link</label>
                        <input
                            type="url"
                            required={uploadMode === 'link'}
                            value={externalLink}
                            onChange={(e) => setExternalLink(e.target.value)}
                            placeholder="https://drive.google.com/file/d/..."
                            className="w-full rounded-lg border border-gray-300 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-2">Paste the shareable link of your document here.</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || (uploadMode === 'file' && !selectedFile) || (uploadMode === 'link' && !externalLink)}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : (uploadMode === 'file' ? "Upload & Save" : "Save Link")}
                </button>
            </form>
        </div>
    );
}
