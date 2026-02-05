"use client";

import { useState, use, useEffect } from "react";
import { Loader2, Save, ArrowLeft, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [formData, setFormData] = useState({
        number: "",
        price: 0
    });

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const res = await fetch(`/api/rooms/${id}`);
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setFormData({ number: data.number, price: data.price });
            } catch (e) {
                alert("Failed to load room data");
            } finally {
                setLoading(false);
            }
        };
        fetchRoom();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/rooms/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to update");
            }

            alert("Room updated successfully!");
            router.push("/rooms");
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    // We already have a Delete Button component, but adding one here for convenience/completeness is good UX
    const handleDelete = async () => {
        if (!confirm("Are you sure? This action cannot be undone.")) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/rooms/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to delete");
            }
            alert("Room deleted!");
            router.push("/rooms");
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="max-w-md mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <Link href="/rooms" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Edit Room</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Room Number/Name</label>
                    <input
                        type="text"
                        value={formData.number}
                        onChange={e => setFormData({ ...formData, number: e.target.value })}
                        required
                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (THB/Month)</label>
                    <input
                        type="number"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                        required
                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>

                <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        Save Changes
                    </button>

                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="w-full py-3 text-red-600 bg-red-50 rounded-lg font-bold hover:bg-red-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {deleting ? <Loader2 className="animate-spin" /> : <Trash2 size={20} />}
                        Delete Room
                    </button>
                </div>
            </form>
        </div>
    );
}
