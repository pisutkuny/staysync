"use client";

import { useState } from "react";
import Script from "next/script";
import { Loader2, Send, Image as ImageIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";

declare global {
    interface Window {
        liff: any;
    }
}

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
    const [selectedRoomId, setSelectedRoomId] = useState<string>("");
    const [selectedResidentId, setSelectedResidentId] = useState<string>("");

    // Guest State
    const [isGuest, setIsGuest] = useState(false);
    const [guestInfo, setGuestInfo] = useState({ name: "", contact: "", lineUserId: "" });
    const [liffError, setLiffError] = useState<string | null>(null);

    // Initialize LIFF
    const initLiff = async () => {
        try {
            if (!process.env.NEXT_PUBLIC_LINE_LIFF_ID) {
                console.warn("LIFF ID not found");
                return;
            }
            await window.liff.init({ liffId: process.env.NEXT_PUBLIC_LINE_LIFF_ID });
            if (window.liff.isLoggedIn()) {
                const profile = await window.liff.getProfile();
                setGuestInfo(prev => ({ ...prev, lineUserId: profile.userId }));
                // Auto-fill name if empty
                if (!guestInfo.name) {
                    setGuestInfo(prev => ({ ...prev, name: profile.displayName }));
                }
            } else {
                // Determine checking logic later
            }
        } catch (error) {
            console.error("LIFF Init Error", error);
            setLiffError("Failed to connect to Line.");
        }
    };

    // Fetch Residents on Mount
    useState(() => {
        fetch("/api/residents")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setResidents(data);
            })
            .catch(err => console.error(err));
    });

    // Derived State
    const uniqueRooms = Array.from(new Map(residents.map(r => [r.room?.id, r.room])).values())
        .filter(r => r) // Remove nulls
        .sort((a: any, b: any) => a.number.localeCompare(b.number));

    const filteredResidents = residents.filter(r => r.room?.id?.toString() === selectedRoomId);

    const handleRoomChange = (roomId: string) => {
        if (roomId === "public") {
            setIsGuest(true);
            setSelectedRoomId("public");
            setSelectedResidentId("");
        } else {
            setIsGuest(false);
            setSelectedRoomId(roomId);
            setSelectedResidentId("");
        }
    };

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

        if (!isGuest && !selectedResidentId) {
            alert("Please select your name.");
            return;
        }
        if (isGuest && (!guestInfo.name || !guestInfo.contact)) {
            alert("Please fill in your name and contact info.");
            return;
        }

        setLoading(true);

        try {
            let photoUrl = null;

            // 1. Upload Image if exists
            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append("file", selectedFile);

                // Add Folder ID if configured
                const repairFolderId = process.env.NEXT_PUBLIC_REPAIR_FOLDER_ID;
                if (repairFolderId) {
                    uploadData.append("folderId", repairFolderId);
                }

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
            const payload = isGuest ? {
                category: formData.category,
                description: formData.description,
                photo: photoUrl,
                residentId: null,
                reporterName: guestInfo.name,
                reporterContact: guestInfo.contact,
                reporterLineUserId: guestInfo.lineUserId || null
            } : {
                category: formData.category,
                description: formData.description,
                photo: photoUrl,
                residentId: parseInt(selectedResidentId),
            };

            const res = await fetch("/api/issues", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed");

            alert("Issue reported successfully!");
            // Close window if in LIFF
            if (window.liff?.isInClient()) {
                window.liff.closeWindow();
            } else {
                router.push("/");
            }
        } catch (error) {
            alert("Error reporting issue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-red-50 pb-20">
            <Script
                src="https://static.line-scdn.net/liff/edge/2/sdk.js"
                strategy="afterInteractive"
                onLoad={initLiff}
            />

            {/* Enhanced Gradient Header */}
            <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 p-6 md:p-8 shadow-xl sticky top-0 z-10">
                <div className="max-w-md mx-auto">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                        🔧 Report Issue
                    </h1>
                    <p className="text-red-100 mt-2 text-sm md:text-base">แจ้งซ่อม / รายงานปัญหา</p>
                </div>
            </div>

            <div className="p-4 max-w-md mx-auto mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Room Selection */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">1. Select Room / เลือกห้อง</label>
                            <select
                                required
                                value={selectedRoomId}
                                onChange={(e) => handleRoomChange(e.target.value)}
                                className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="">-- Select Room --</option>
                                <option value="public">🔔 Public / บุคคลทั่วไป (แจ้งเหตุภายนอก)</option>
                                <option disabled>──────────────</option>
                                {uniqueRooms.map((room: any) => (
                                    <option key={room.id} value={room.id}>
                                        Room {room.number}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Resident Selection OR Guest Input */}
                        {!isGuest ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">2. Select Your Name / เลือกชื่อผู้เช่า</label>
                                <select
                                    required={!isGuest}
                                    disabled={!selectedRoomId}
                                    value={selectedResidentId}
                                    onChange={(e) => setSelectedResidentId(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    <option value="">
                                        {selectedRoomId ? "-- Select Name --" : "-- Select Room First --"}
                                    </option>
                                    {filteredResidents.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.fullName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-3 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                <div>
                                    <label className="block text-sm font-medium text-indigo-900 mb-1">Your Name / ชื่อผู้แจ้ง</label>
                                    <input
                                        required
                                        type="text"
                                        value={guestInfo.name}
                                        onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                        placeholder="Enter your name"
                                        className="w-full p-2.5 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-indigo-900 mb-1">Contact / เบอร์ติดต่อ</label>
                                    <input
                                        required
                                        type="text"
                                        value={guestInfo.contact}
                                        onChange={(e) => setGuestInfo({ ...guestInfo, contact: e.target.value })}
                                        placeholder="Phone number or Line ID"
                                        className="w-full p-2.5 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                {guestInfo.lineUserId && (
                                    <div className="text-xs text-green-600 flex items-center gap-1">
                                        ✅ Line Connected (Notifications Enabled)
                                    </div>
                                )}
                            </div>
                        )}
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
                    {liffError && <p className="text-xs text-red-500 text-center">{liffError}</p>}
                </form>
            </div>
        </div>
    );
}
