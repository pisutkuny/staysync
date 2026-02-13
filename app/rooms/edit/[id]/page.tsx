"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Plus, X, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

import { useModal } from "@/app/context/ModalContext";

export default function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { t } = useLanguage();
    const router = useRouter();
    const { showAlert } = useModal();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [roomId, setRoomId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        number: "",
        price: "",
        status: "Available",
        floor: "",
        size: "",
        features: [] as string[],
        images: [] as string[],
        chargeCommonArea: false,
        defaultContractDuration: 12,
        defaultDeposit: 0,
        waterMeterInitial: 0,
        electricMeterInitial: 0,
        checkInDate: "",
        updateActiveResident: false
    });

    const [newImageLink, setNewImageLink] = useState("");
    const [newFeature, setNewFeature] = useState("");

    // Resolve params
    useEffect(() => {
        params.then(unwrappedParams => {
            setRoomId(unwrappedParams.id);
        });
    }, [params]);

    // Fetch room data
    useEffect(() => {
        if (!roomId) return;

        const fetchRoom = async () => {
            try {
                const res = await fetch(`/api/rooms/${roomId}`);
                if (!res.ok) throw new Error(t.rooms.loadError);
                const data = await res.json();

                setFormData({
                    number: data.number,
                    price: data.price.toString(),
                    status: data.status,
                    floor: data.floor ? data.floor.toString() : "",
                    size: data.size ? data.size.toString() : "",
                    features: Array.isArray(data.features) ? data.features : [],
                    images: Array.isArray(data.images) ? data.images : [],
                    chargeCommonArea: data.chargeCommonArea || false,
                    defaultContractDuration: data.defaultContractDuration || 12,
                    defaultDeposit: data.defaultDeposit || 0,
                    waterMeterInitial: data.waterMeterInitial || 0,
                    electricMeterInitial: data.electricMeterInitial || 0,
                    checkInDate: data.residents && data.residents.length > 0 ? data.residents[0].checkInDate.split('T')[0] : "",
                    updateActiveResident: false
                });
            } catch (error) {
                console.error(error);
                showAlert(t.common.error, t.rooms.loadError, "error", () => router.push("/rooms"));
            } finally {
                setLoading(false);
            }
        };

        fetchRoom();
    }, [roomId, router, t, showAlert]);

    // Google Drive Link Converter
    const convertDriveLink = (url: string) => {
        try {
            // Handle standard share links
            // Pattern 1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
            const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
                return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w1000`; // Use thumbnail API for direct image
            }

            // Pattern 2: https://drive.google.com/open?id=FILE_ID
            const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (idParamMatch && idParamMatch[1]) {
                return `https://drive.google.com/thumbnail?id=${idParamMatch[1]}&sz=w1000`;
            }

            return url; // Return original if no match (could be already valid direct link)
        } catch (e) {
            return url;
        }
    };

    const handleAddImage = () => {
        if (!newImageLink) return;
        const convertedLink = convertDriveLink(newImageLink);
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, convertedLink]
        }));
        setNewImageLink("");
    };

    const handleRemoveImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleAddFeature = () => {
        if (!newFeature) return;
        setFormData(prev => ({
            ...prev,
            features: [...prev.features, newFeature]
        }));
        setNewFeature("");
    };

    const handleRemoveFeature = (index: number) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/rooms/${roomId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    floor: formData.floor ? parseInt(formData.floor) : null,
                    size: formData.size ? parseFloat(formData.size) : null,
                    defaultContractDuration: formData.defaultContractDuration,
                    defaultDeposit: formData.defaultDeposit,
                    waterMeterInitial: formData.waterMeterInitial,
                    electricMeterInitial: formData.electricMeterInitial,
                    checkInDate: formData.checkInDate,
                    updateActiveResident: formData.updateActiveResident
                })
            });

            if (!res.ok) throw new Error("Failed to update");

            showAlert(t.common.success, t.rooms.updateSuccess, "success", () => {
                router.push("/rooms");
                router.refresh();
            });
        } catch (error) {
            showAlert(t.common.error, t.rooms.updateError, "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/rooms" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-white" />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">{t.rooms.editRoom} {formData.number}</h2>
                    <p className="text-gray-300">{t.rooms.editRoomDesc}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">{t.rooms.basicInfo}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.rooms.roomNumber}</label>
                            <input
                                required
                                type="text"
                                value={formData.number}
                                onChange={e => setFormData({ ...formData, number: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.rooms.priceThb}</label>
                            <input
                                required
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.rooms.statusLabel}</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="Available">{t.status.Available}</option>
                                <option value="Occupied">{t.status.Occupied}</option>
                                <option value="Maintenance">{t.status.Maintenance}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.rooms.commonAreaCharge}</label>
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    checked={formData.chargeCommonArea}
                                    onChange={e => setFormData({ ...formData, chargeCommonArea: e.target.checked })}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <span className="text-gray-600 text-sm">{t.rooms.enableCommonAreaFee}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.residents.contractDuration} ({t.residents.months})</label>
                            <input
                                type="number"
                                value={formData.defaultContractDuration}
                                onChange={e => setFormData({ ...formData, defaultContractDuration: parseInt(e.target.value) || 0 })}
                                className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {formData.status === 'Occupied' && (
                                <div className="flex items-center gap-2 mt-2 bg-blue-50 p-2 rounded-lg border border-blue-100">
                                    <input
                                        type="checkbox"
                                        id="updateActiveResident"
                                        checked={formData.updateActiveResident || false}
                                        onChange={e => setFormData({ ...formData, updateActiveResident: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="updateActiveResident" className="text-xs text-blue-700 font-medium cursor-pointer select-none">
                                        Update active resident's contract too?
                                    </label>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.residents.deposit} (฿)</label>
                            <input
                                type="number"
                                value={formData.defaultDeposit}
                                onChange={e => setFormData({ ...formData, defaultDeposit: parseFloat(e.target.value) || 0 })}
                                className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Initial Readings & Move In */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">🔄 {t.rooms.initialReadings} & 📅 {t.residents.moveInDate}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {formData.status === 'Occupied' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.residents.moveInDate}</label>
                                <input
                                    type="date"
                                    value={formData.checkInDate}
                                    onChange={e => setFormData({ ...formData, checkInDate: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Updates current resident's start date</p>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">💧 Initial Water Meter</label>
                            <input
                                type="number"
                                value={formData.waterMeterInitial}
                                onChange={e => setFormData({ ...formData, waterMeterInitial: parseFloat(e.target.value) || 0 })}
                                className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">⚡ Initial Electric Meter</label>
                            <input
                                type="number"
                                value={formData.electricMeterInitial}
                                onChange={e => setFormData({ ...formData, electricMeterInitial: parseFloat(e.target.value) || 0 })}
                                className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Details & Features */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">{t.rooms.detailsFeatures}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.rooms.floor}</label>
                            <input
                                type="number"
                                value={formData.floor}
                                onChange={e => setFormData({ ...formData, floor: e.target.value })}
                                placeholder="e.g. 2"
                                className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.rooms.sizeSqm}</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.size}
                                onChange={e => setFormData({ ...formData, size: e.target.value })}
                                placeholder="e.g. 24.5"
                                className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.rooms.features}</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={newFeature}
                                onChange={e => setNewFeature(e.target.value)}
                                placeholder={t.rooms.addFeaturePlaceholder}
                                className="flex-1 rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                            />
                            <button
                                type="button"
                                onClick={handleAddFeature}
                                className="bg-gray-100 text-gray-700 px-4 rounded-lg hover:bg-gray-200"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.features.map((feature, index) => (
                                <span key={index} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                    {feature}
                                    <button type="button" onClick={() => handleRemoveFeature(index)} className="hover:text-red-500">
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                        <ImageIcon size={20} className="text-indigo-600" />
                        {t.rooms.roomPhotos}
                    </h3>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">{t.rooms.addImageDrive}</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newImageLink}
                                onChange={e => setNewImageLink(e.target.value)}
                                placeholder={t.rooms.pasteDriveLink}
                                className="flex-1 rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={handleAddImage}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
                            >
                                {t.rooms.addPhoto}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">{t.rooms.driveLinkDesc}</p>
                    </div>

                    {/* Image Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {formData.images.map((img, index) => (
                            <div key={index} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                <img
                                    src={img}
                                    alt={`Room ${formData.number} photo ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        {formData.images.length === 0 && (
                            <div className="col-span-full py-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                {t.rooms.noPhotos}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                    >
                        {t.rooms.cancel}
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        {t.rooms.saveChanges}
                    </button>
                </div>
            </form>
        </div>
    );
}
