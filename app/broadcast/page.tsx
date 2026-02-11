"use client";

import { useState, useEffect } from "react";
import { Loader2, Megaphone, Send, Users } from "lucide-react";

export default function BroadcastPage() {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Filter Data
    const [rooms, setRooms] = useState<any[]>([]);

    // Filters
    const [floor, setFloor] = useState("all");
    const [unpaidOnly, setUnpaidOnly] = useState(false);
    const [roomNumber, setRoomNumber] = useState("");

    // Fetch rooms on mount
    useEffect(() => {
        fetch('/api/rooms')
            .then(res => res.json())
            .then(data => setRooms(data))
            .catch(err => console.error("Failed to load rooms", err));
    }, []);

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
                        unpaidOnly,
                        roomNumber
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
        <div className="space-y-8 pb-10">
            {/* Enhanced Gradient Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                            <Megaphone size={32} className="md:w-10 md:h-10" />
                            Broadcast
                        </h1>
                        <p className="text-indigo-100 mt-2 text-sm md:text-base">Send announcements to residents via LINE</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30">
                        <Users className="text-white" size={20} />
                        <span className="text-white font-bold">{rooms.length} Total Rooms</span>
                    </div>
                </div>
            </div>

            {/* Main Form Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xl">
                <form onSubmit={handleBroadcast} className="space-y-6">

                    {/* Target Audience Section */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-700">Target Audience</label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <select
                                value={floor}
                                onChange={(e) => {
                                    setFloor(e.target.value);
                                    if (e.target.value !== 'all') setRoomNumber('');
                                }}
                                disabled={!!roomNumber}
                                className={`flex-1 rounded-xl border border-gray-300 p-3 bg-white focus:ring-2 focus:ring-purple-500 outline-none ${roomNumber ? 'opacity-50' : ''}`}
                            >
                                <option value="all">All Floors</option>
                                <option value="1">Floor 1</option>
                                <option value="2">Floor 2</option>
                                <option value="3">Floor 3</option>
                                <option value="4">Floor 4</option>
                            </select>

                            <select
                                value={roomNumber}
                                onChange={(e) => {
                                    setRoomNumber(e.target.value);
                                    if (e.target.value) setFloor('all');
                                }}
                                className={`flex-1 rounded-xl border border-gray-300 p-3 bg-white focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer`}
                            >
                                <option value="">Select Room (Optional)</option>
                                {rooms.map((room) => (
                                    <option key={room.id} value={room.number}>
                                        Room {room.number}
                                    </option>
                                ))}
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
                                <span className="font-medium text-sm">Unpaid Only</span>
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
                            className="w-full rounded-xl border border-gray-300 p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 font-medium resize-none text-lg"
                            required
                        />
                        <p className="text-sm text-gray-400 mt-2 text-right">{message.length} characters</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-gray-500 text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            <Users size={16} />
                            <span>
                                {roomNumber ? `Sending to Room ${roomNumber}` :
                                    floor !== 'all' ? `Sending to Floor ${floor}` :
                                        'Sends to everyone'}
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !message.trim()}
                            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md hover:shadow-lg text-sm"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                            Send Broadcast
                        </button>
                    </div>
                </form>
            </div>

            {status && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {status.type === 'success' ? <Megaphone size={20} /> : <Loader2 size={20} className="animate-spin" />}
                    <span className="font-medium">{status.text}</span>
                </div>
            )}
        </div>
    );
}
