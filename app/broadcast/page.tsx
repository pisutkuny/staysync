"use client";

import { useState } from "react";
import { Loader2, Megaphone, Send, Users } from "lucide-react";

export default function BroadcastPage() {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Filters
    const [floor, setFloor] = useState("all");
    const [unpaidOnly, setUnpaidOnly] = useState(false);

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setLoading(true);
        setStatus(null);

        try {
            const res = await fetch("/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    filters: {
                        floor,
                        unpaidOnly
                    }
                }),
            });

            if (!res.ok) throw new Error("Failed");
            const data = await res.json();

            setStatus({ type: 'success', text: `Sent successfully to ${data.count} residents!` });
            setMessage(""); // Clear form
        } catch (error) {
            setStatus({ type: 'error', text: "Failed to send broadcast." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Megaphone size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Broadcast</h1>
                    <p className="text-gray-500">Send announcements to all residents via Line.</p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
                <form onSubmit={handleBroadcast} className="space-y-6">

                    {/* Target Audience Section */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-700">Target Audience</label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <select
                                value={floor}
                                onChange={(e) => setFloor(e.target.value)}
                                className="flex-1 rounded-xl border border-gray-300 p-3 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="all">All Floors</option>
                                <option value="1">Floor 1</option>
                                <option value="2">Floor 2</option>
                                <option value="3">Floor 3</option>
                                <option value="4">Floor 4</option>
                            </select>

                            <div
                                onClick={() => setUnpaidOnly(!unpaidOnly)}
                                className={`flex-1 flex items-center justify-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${unpaidOnly
                                        ? "bg-red-50 border-red-200 text-red-700 scale-[1.02]"
                                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${unpaidOnly ? "bg-red-500 border-red-500" : "border-gray-400"
                                    }`}>
                                    {unpaidOnly && <Users size={12} className="text-white" />}
                                </div>
                                <span className="font-medium">Unpaid Bills Only</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                        <textarea
                            rows={6}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your announcement here..."
                            className="w-full rounded-xl border border-gray-300 p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-medium resize-none text-lg"
                            required
                        />
                        <p className="text-sm text-gray-400 mt-2 text-right">{message.length} characters</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-gray-500 text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            <Users size={16} />
                            <span>Sends to everyone</span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !message.trim()}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                            Send Broadcast
                        </button>
                    </div>
                </form>
            </div>

            {status && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {status.type === 'success' ? <Megaphone size={20} /> : <Loader2 size={20} className="animate-spin" />}
                    {/* Reusing Loader2 as error icon temporarily or AlertCircle if imported */}
                    <span className="font-medium">{status.text}</span>
                </div>
            )}
        </div>
    );
}
