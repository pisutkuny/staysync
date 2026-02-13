"use client";

import { useState, useEffect } from "react";
import { Loader2, Megaphone, Send, Users } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function BroadcastPage() {
    const { t } = useLanguage();
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

            setStatus({ type: 'success', text: t.broadcast.success.replace("{count}", data.count) });
            setMessage(""); // Clear form
        } catch (error) {
            setStatus({ type: 'error', text: t.broadcast.error });
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
                            {t.broadcast.title}
                        </h1>
                        <p className="text-indigo-100 mt-2 text-sm md:text-base">{t.broadcast.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30">
                        <Users className="text-white" size={20} />
                        <span className="text-white font-bold">{t.broadcast.totalRooms.replace("{count}", rooms.length.toString())}</span>
                    </div>
                </div>
            </div>

            {/* Main Form Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-xl">
                <form onSubmit={handleBroadcast} className="space-y-6">

                    {/* Target Audience Section */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-700">{t.broadcast.target}</label>
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
                                <option value="all">{t.broadcast.floors.all}</option>
                                <option value="1">{t.broadcast.floors.floor.replace("{floor}", "1")}</option>
                                <option value="2">{t.broadcast.floors.floor.replace("{floor}", "2")}</option>
                                <option value="3">{t.broadcast.floors.floor.replace("{floor}", "3")}</option>
                                <option value="4">{t.broadcast.floors.floor.replace("{floor}", "4")}</option>
                            </select>

                            <select
                                value={roomNumber}
                                onChange={(e) => {
                                    setRoomNumber(e.target.value);
                                    if (e.target.value) setFloor('all');
                                }}
                                className={`flex-1 rounded-xl border border-gray-300 p-3 bg-white focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer`}
                            >
                                <option value="">{t.broadcast.rooms.select}</option>
                                {rooms.map((room) => (
                                    <option key={room.id} value={room.number}>
                                        {t.broadcast.rooms.room.replace("{number}", room.number)}
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
                                <span className="font-medium text-sm">{t.broadcast.unpaid}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.broadcast.message}</label>
                        <textarea
                            rows={6}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={t.broadcast.placeholder}
                            className="w-full rounded-xl border border-gray-300 p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 font-medium resize-none text-lg"
                            required
                        />
                        <p className="text-sm text-gray-400 mt-2 text-right">{t.broadcast.chars.replace("{count}", message.length.toString())}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-gray-500 text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            <Users size={16} />
                            <span>
                                {roomNumber ? t.broadcast.sending.room.replace("{number}", roomNumber) :
                                    floor !== 'all' ? t.broadcast.sending.floor.replace("{floor}", floor) :
                                        t.broadcast.sending.all}
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !message.trim()}
                            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md hover:shadow-lg text-sm"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                            {t.broadcast.send}
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
