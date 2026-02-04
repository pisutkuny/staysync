"use client";

import { useState } from "react";
import { Loader2, UserCheck, UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CheckInFormProps {
    roomId: string; // ID as string for API path
    roomNumber: string;
    isOccupied: boolean;
}

export default function CheckInForm({ roomId, roomNumber, isOccupied }: CheckInFormProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        lineUserId: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/rooms/${roomId}/checkin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed");

            alert(isOccupied ? "Resident added successfully!" : "Check-in successful!");
            router.push("/rooms");
            router.refresh();
        } catch (error) {
            alert("Error processing request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/rooms" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={20} className="text-gray-500" />
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        {isOccupied ? "Add Resident" : "Check In Resident"}
                    </h2>
                    <p className="text-gray-500 mt-2">
                        {isOccupied
                            ? `Add another resident/family member to Room ${roomNumber}.`
                            : `Assign a new main tenant to Room ${roomNumber}.`
                        }
                    </p>
                </div>
            </div>

            <div className="max-w-md bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                            required
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="John Doe"
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                            required
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="081XXXXXXX"
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Line User ID (Optional)</label>
                        <input
                            type="text"
                            value={formData.lineUserId}
                            onChange={(e) => setFormData({ ...formData, lineUserId: e.target.value })}
                            placeholder="U1234..."
                            className="w-full rounded-lg border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">Needed for Line notifications.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full mt-4 text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${isOccupied
                                ? "bg-indigo-600 hover:bg-indigo-700"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isOccupied ? <UserPlus size={20} /> : <UserCheck size={20} />)}
                        {isOccupied ? "Add Resident" : "Confirm Check In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
