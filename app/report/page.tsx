"use client";

import { useState } from "react";
import { Loader2, Send, Image as ImageIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReportIssuePage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [formData, setFormData] = useState({
        category: "Water",
        description: "",
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [residents, setResidents] = useState<any[]>([]);
    const [selectedResidentId, setSelectedResidentId] = useState<string>("");

    // Fetch Residents on Mount
    useState(() => {
        fetch("/api/residents")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setResidents(data);
            })
            .catch(err => console.error(err));
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedResidentId) {
            alert("Please select your room.");
            return;
        }
        setLoading(true);

        try {
            let photoUrl = null;

            // 1. Upload Image if exists
            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append("file", selectedFile);

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: uploadData,
                });

                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    photoUrl = data.url;
                }
            }

            // 2. Create Issue
            const res = await fetch("/api/issues", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: formData.category,
                    description: formData.description,
                    photo: photoUrl,
                    residentId: parseInt(selectedResidentId),
                }),
            });

            if (!res.ok) throw new Error("Failed");

            alert("Issue reported successfully!");
            router.push("/");
        } catch (error) {
            alert("Error reporting issue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Mobile Header */}
            <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
                <h1 className="text-xl font-bold text-center text-gray-900">Report Issue</h1>
            </div>

            <div className="p-4 max-w-md mx-auto">
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Room Selection */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Your Room / เลือกห้อง</label>
                        <select
                            required
                            value={selectedResidentId}
                            onChange={(e) => setSelectedResidentId(e.target.value)}
                            className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">-- Click to Select Room --</option>
                            {residents.map(r => (
                                <option key={r.id} value={r.id}>
                                    Room {r.room?.number} - {r.fullName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category Selection */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <div className="grid grid-cols-2 gap-2">
                            {["Water", "Electricity", "Internet", "Other"].map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: cat })}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${formData.category === cat
                                        ? "bg-indigo-600 text-white shadow-md"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            required
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe the problem..."
                            className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                        />
                    </div>

                    {/* Photo Upload */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Photo (Optional)</label>

                        {!previewUrl ? (
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
                                    <ImageIcon size={32} className="mb-2" />
                                    <span className="text-sm">Tap to upload photo</span>
                                </div>
                            </div>
                        ) : (
                            <div className="relative rounded-lg overflow-hidden border border-gray-200">
                                <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                        Submit Report
                    </button>
                </form>
            </div>
        </div>
    );
}
