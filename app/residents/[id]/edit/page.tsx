"use client";

import { useState, use } from "react";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// We need to fetch data client-side or pass it? 
// Next.js 15 recommendation: fetch in Server Component (parent layout/page) or use generic fetch.
// For simplicity in this edit page, I'll fetch client-side using useEffect or just assume simple Edit form.
// Actually, better to make this a Server Component that renders a Client Form?
// Yes. But let's stick to standard "use client" with simple fetch for consistency with other forms I made where I didn't pass initial data (Wait, I passed in checks).
// Let's do a Client Component that fetches data on mount for now to be safe, or Server Component with Client.

// Easier: Server Component fetches data -> passes to Client Form.
import { useEffect } from "react";

export default function EditResidentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const residentId = id;
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        lineUserId: ""
    });

    useEffect(() => {
        // Fetch resident data
        fetch(`/api/residents/${residentId}/checkout`) // Using checkout endpoint just to get data? No, valid endpoint needed.
        // Wait, I strictly don't have a GET /api/residents/[id] unless I implemented it.
        // Check checkout route... it returns... wait it's a POST.
        // I need to implement GET in the route I just created above? 
        // Or just passing data via Server Component is better.

        // Let's refactor this to be a wrapped Server Component? 
        // No, let's just make the API support GET too.
    });

    // Changing strategy: Hybrid.
    // I will add GET to the route I just made.
    return <EditForm residentId={residentId} />;
}

function EditForm({ residentId }: { residentId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        lineUserId: ""
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // I need a GET endpoint. I will add it to the file I just wrote.
                const res = await fetch(`/api/residents/${residentId}`);
                if (!res.ok) throw new Error("Failed");
                const data = await res.json();
                setFormData({
                    fullName: data.fullName,
                    phone: data.phone || "",
                    lineUserId: data.lineUserId || ""
                });
            } catch (e) {
                alert("Failed to load resident data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [residentId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/residents/${residentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error("Failed");

            router.push(`/residents/${residentId}`);
            router.refresh(); // Refresh server data
        } catch (error) {
            alert("Error updating resident");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="max-w-md mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <Link href={`/residents/${residentId}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Edit Resident</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                        type="text"
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                        type="text"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Line User ID</label>
                    <input
                        type="text"
                        value={formData.lineUserId}
                        onChange={e => setFormData({ ...formData, lineUserId: e.target.value })}
                        placeholder="U123..."
                        className="w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-white font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Needed for Line notifications.</p>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
