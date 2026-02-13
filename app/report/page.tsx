"use client";

import { useState } from "react";
import Script from "next/script";
import { Loader2, Send, Image as ImageIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

declare global {
    interface Window {
        liff: any;
    }
}

export default function ReportIssuePage() {
    const { t } = useLanguage();
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

            if (!res.ok) throw new Error("Failed");

            alert(t.issues.success);
            // Close window if in LIFF
            if (window.liff?.isInClient()) {
                window.liff.closeWindow();
            } else {
                router.push("/dashboard");
            }
        } catch (error) {
            alert(t.issues.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Script
                src="https://static.line-scdn.net/liff/edge/2/sdk.js"
                strategy="afterInteractive"
                onLoad={initLiff}
            />

            {/* Enhanced Gradient Header - Card Style */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl text-center">
                <h1 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center justify-center gap-3">
                    🔧 {t.issues.reportTitle}
                </h1>
                <p className="text-indigo-100 mt-2 text-sm md:text-base">{t.issues.reportDesc}</p>
            </div>

            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-1">
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Room Selection */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t.issues.selectRoom}</label>
                            <select
                                required
                                value={selectedRoomId}
                                onChange={(e) => handleRoomChange(e.target.value)}
                                className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:border-indigo-300"
                            >
                                <option value="">{t.issues.selectRoomPlaceholder}</option>
                                <option value="public">{t.issues.publicOption}</option>
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t.issues.selectName}</label>
                                <select
                                    required={!isGuest}
                                    disabled={!selectedRoomId}
                                    value={selectedResidentId}
                                    onChange={(e) => setSelectedResidentId(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-400 transition-all hover:border-indigo-300"
                                >
                                    <option value="">
                                        {selectedRoomId ? t.issues.selectNamePlaceholder : t.issues.selectRoomFirst}
                                    </option>
                                    {filteredResidents.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.fullName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-4 bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
                                <div>
                                    <label className="block text-sm font-medium text-indigo-900 mb-1.5">{t.issues.yourName}</label>
                                    <input
                                        required
                                        type="text"
                                        value={guestInfo.name}
                                        onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                        placeholder={t.issues.enterName}
                                        className="w-full p-3 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white/80"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-indigo-900 mb-1.5">{t.issues.contact}</label>
                                    <input
                                        required
                                        type="text"
                                        value={guestInfo.contact}
                                        onChange={(e) => setGuestInfo({ ...guestInfo, contact: e.target.value })}
                                        placeholder={t.issues.enterContact}
                                        className="w-full p-3 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white/80"
                                    />
                                </div>
                                {guestInfo.lineUserId && (
                                    <div className="text-xs text-green-600 flex items-center gap-1 font-medium bg-green-50 px-2 py-1 rounded w-fit">
                                        ✅ {t.issues.lineConnected}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Category Selection */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-3">{t.issues.category}</label>
                        <div className="grid grid-cols-2 gap-3">
                            {["Water", "Electricity", "Internet", "Other"].map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: cat })}
                                    className={`py-3 px-4 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${formData.category === cat
                                        ? "bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-200"
                                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                                        }`}
                                >

                                    {cat === "Water" && t.issues.catWater}
                                    {cat === "Electricity" && t.issues.catElectric}
                                    {cat === "Internet" && t.issues.catInternet}
                                    {cat === "Other" && t.issues.catOther}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.issues.description}</label>
                        <textarea
                            required
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={t.issues.descPlaceholder}
                            className="w-full rounded-xl border border-gray-300 p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base shadow-inner transition-all hover:border-indigo-300"
                        />
                    </div>

                    {/* Photo Upload */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.issues.photo}</label>

                        {!previewUrl ? (
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 group-hover:bg-gray-50 group-hover:border-indigo-300 transition-all duration-300">
                                    <div className="bg-gray-50 p-3 rounded-full mb-3 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                        <ImageIcon size={32} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-500 group-hover:text-indigo-600">{t.issues.tapToUpload}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-md group">
                                <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    className="absolute top-3 right-3 bg-white/90 text-gray-700 p-2 rounded-full hover:bg-red-500 hover:text-white shadow-lg transition-all transform hover:scale-110"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:from-indigo-700 hover:to-violet-700 active:scale-98 transition-all flex items-center justify-center gap-3 text-lg"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Send size={22} />}
                        {t.issues.submit}
                    </button>
                    {liffError && <p className="text-xs text-red-500 text-center bg-red-50 py-1 rounded">{liffError}</p>}
                </form>
            </div>
        </div>
    );
}
