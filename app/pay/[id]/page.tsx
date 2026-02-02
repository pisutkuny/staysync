"use client";

import { useState, use } from "react";
import { Loader2, Upload, FileCheck, Banknote } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;
        setLoading(true);

        try {
            // 1. Upload Slip
            const uploadData = new FormData();
            uploadData.append("file", selectedFile);
            const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadData });

            if (!uploadRes.ok) throw new Error("Upload failed");
            const { url } = await uploadRes.json();

            // 2. Submit Payment
            const res = await fetch(`/api/billing/${id}/pay`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slipImage: url }),
            });

            if (!res.ok) throw new Error("Failed to submit");
            setSubmitted(true);
        } catch (error) {
            alert("Failed to submit payment.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center space-y-4">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileCheck size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Payment Submitted!</h1>
                    <p className="text-gray-500">Thank you. The admin will verify your payment slip shortly.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md w-full space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Banknote size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Confirm Payment</h1>
                    <p className="text-gray-500">Upload your transfer slip to verify payment.</p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <h3 className="font-bold text-indigo-900 mb-2">Bank Transfer Details</h3>
                    <p className="text-sm text-indigo-700">Bank: <span className="font-bold">Kasikorn Bank (KBank)</span></p>
                    <p className="text-sm text-indigo-700">Account: <span className="font-bold">123-4-56789-0</span></p>
                    <p className="text-sm text-indigo-700">Name: <span className="font-bold">Dormitory MeeTung</span></p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Transfer Slip</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            required
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !selectedFile}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Submit Payment"}
                    </button>
                </form>
            </div>
        </div>
    );
}
