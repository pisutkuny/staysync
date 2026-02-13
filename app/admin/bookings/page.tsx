
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { useModal } from "@/app/context/ModalContext";

interface Booking {
    id: number;
    checkInDate: string;
    status: string;
    specialRequest?: string;
    createdAt: string;
    room: {
        number: string;
        price: number;
    };
    user: {
        id: number;
        fullName: string;
        email: string;
        phone: string;
    } | null;
    guestName?: string;
    guestPhone?: string;
    guestLineId?: string;
}

export default function AdminBookingsPage() {
    const { showAlert, showConfirm } = useModal();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await fetch("/api/admin/bookings");
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            }
        } catch (error) {
            console.error("Failed to fetch bookings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        const confirmed = await showConfirm("Confirm", `Are you sure you want to ${status} this booking?`, true);
        if (!confirmed) return;

        setProcessingId(id);
        try {
            const res = await fetch(`/api/admin/bookings/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                fetchBookings(); // Refresh list
            } else {
                const data = await res.json();
                showAlert("Error", data.error || "Failed to update status", "error");
            }
        } catch (error) {
            console.error("Error updating booking", error);
            showAlert("Error", "An error occurred", "error");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 shadow-xl">
                <h2 className="text-xl md:text-3xl font-bold tracking-tight text-white drop-shadow-lg">
                    📅 Booking Management
                </h2>
                <p className="text-indigo-100 mt-2">Manage room reservation requests.</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Room</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Check-in</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Request</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No bookings found.
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-mono text-gray-500">#{booking.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                {booking.user ? (
                                                    <>
                                                        <span className="font-bold text-gray-900">{booking.user.fullName}</span>
                                                        <span className="text-xs text-gray-500">{booking.user.email}</span>
                                                        <span className="text-xs text-gray-500">{booking.user.phone}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="font-bold text-gray-900">{booking.guestName} <span className="bg-yellow-100 text-yellow-800 text-[10px] px-1 rounded ml-1">GUEST</span></span>
                                                        <span className="text-xs text-gray-500">{booking.guestPhone}</span>
                                                        {booking.guestLineId && <span className="text-xs text-green-600">Line: {booking.guestLineId}</span>}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-bold text-sm">
                                                Room {booking.room.number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {format(new Date(booking.checkInDate), "MMM dd, yyyy")}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge status={booking.status} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                            {booking.specialRequest || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {booking.status === "Pending" && (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateStatus(booking.id, "Confirmed")}
                                                        disabled={!!processingId}
                                                        className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors text-xs font-bold disabled:opacity-50"
                                                    >
                                                        {processingId === booking.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(booking.id, "Rejected")}
                                                        disabled={!!processingId}
                                                        className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors text-xs font-bold disabled:opacity-50"
                                                    >
                                                        <XCircle className="w-3 h-3" />
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {booking.status === "Confirmed" && (
                                                <button
                                                    onClick={() => handleUpdateStatus(booking.id, "Cancelled")}
                                                    disabled={!!processingId}
                                                    className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors text-xs font-bold disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function Badge({ status }: { status: string }) {
    const styles = {
        Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
        Confirmed: "bg-green-100 text-green-800 border-green-200",
        Rejected: "bg-red-100 text-red-800 border-red-200",
        Cancelled: "bg-gray-100 text-gray-800 border-gray-200",
        Completed: "bg-blue-100 text-blue-800 border-blue-200",
    }[status] || "bg-gray-100 text-gray-800";

    const icons = {
        Pending: Clock,
        Confirmed: CheckCircle,
        Rejected: XCircle,
        Cancelled: XCircle,
        Completed: CheckCircle
    }[status] || FileText;

    const Icon = icons;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles}`}>
            <Icon className="w-3.5 h-3.5" />
            {status}
        </span>
    );
}
