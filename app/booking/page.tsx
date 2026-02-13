
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, DollarSign, CheckCircle } from "lucide-react";
import Image from "next/image";
import { useModal } from "@/app/context/ModalContext";

interface Room {
    id: number;
    number: string;
    price: number;
    status: string;
    floor?: number;
    size?: number;
    features?: string[];
    images?: string[];
}

export default function BookingPage() {
    const router = useRouter();
    const { showAlert } = useModal();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
    const [checkInDate, setCheckInDate] = useState("");
    const [specialRequest, setSpecialRequest] = useState("");

    // Guest Fields
    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [guestLineId, setGuestLineId] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        fetchRooms();
        checkLoginStatus();
    }, []);

    const checkLoginStatus = async () => {
        try {
            // We use the booking API to check if we are authenticated
            // If 401, we are guest.
            const resCheck = await fetch("/api/bookings");
            if (resCheck.ok) setIsLoggedIn(true);
        } catch (e) { }
    };

    const fetchRooms = async () => {
        try {
            const res = await fetch("/api/rooms/available");
            if (res.ok) {
                const data = await res.json();
                setRooms(data);
            }
        } catch (error) {
            console.error("Failed to fetch rooms", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBookClick = (room: Room) => {
        setBookingRoom(room);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setCheckInDate(tomorrow.toISOString().split('T')[0]);
    };

    const handleConfirmBooking = async () => {
        if (!bookingRoom || !checkInDate) return;

        // Frontend validation for guest
        if (!isLoggedIn && (!guestName || !guestPhone)) {
            showAlert("Warning", "กรุณากรอกชื่อและเบอร์โทรศัพท์สำหรับติดต่อ", "warning");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: bookingRoom.id,
                    checkInDate: checkInDate,
                    specialRequest,
                    guestName: isLoggedIn ? undefined : guestName,
                    guestPhone: isLoggedIn ? undefined : guestPhone,
                    guestLineId: isLoggedIn ? undefined : guestLineId
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Booking failed");
            }

            showAlert("Success", "ส่งคำขอจองสำเร็จ! เจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันการจอง", "success");
            setBookingRoom(null);

            // Clear fields
            setGuestName("");
            setGuestPhone("");
            setGuestLineId("");

            fetchRooms();
            if (isLoggedIn) router.push("/dashboard");

        } catch (error: any) {
            showAlert("Error", error.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                        Find Your Perfect Room
                    </h1>
                    <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                        Browse our available rooms and book your stay today.
                    </p>
                </div>

                {rooms.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-xl text-gray-500">No rooms available at the moment. Please check back later.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {rooms.map((room) => (
                            <div key={room.id} className="bg-white overflow-hidden shadow-lg rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                                <div className="relative h-48 bg-gray-200">
                                    {room.images && room.images.length > 0 ? (
                                        <img
                                            src={room.images[0]}
                                            alt={`Room ${room.number}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-200">
                                            <span className="text-4xl font-bold">Room {room.number}</span>
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-bold text-indigo-600 shadow-md">
                                        {room.status}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="text-2xl font-bold text-gray-900">Room {room.number}</h3>
                                        <p className="text-2xl font-bold text-indigo-600">฿{room.price.toLocaleString()}<span className="text-sm text-gray-500 font-normal">/mo</span></p>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        {room.floor && (
                                            <div className="flex items-center text-gray-600 text-sm">
                                                <span className="w-20 font-medium">Floor:</span>
                                                <span>{room.floor}</span>
                                            </div>
                                        )}
                                        {room.size && (
                                            <div className="flex items-center text-gray-600 text-sm">
                                                <span className="w-20 font-medium">Size:</span>
                                                <span>{room.size} sqm</span>
                                            </div>
                                        )}
                                        {room.features && Array.isArray(room.features) && room.features.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {room.features.map((feature, idx) => (
                                                    <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-medium">
                                                        {feature}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleBookClick(room)}
                                        className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                    >
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            {bookingRoom && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all overflow-y-auto max-h-[90vh]">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Book Room {bookingRoom.number}</h2>

                        <div className="space-y-4">
                            {!isLoggedIn && (
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                    <h3 className="text-sm font-bold text-yellow-800 mb-2">Guest Booking Details</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={guestName}
                                                onChange={(e) => setGuestName(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                placeholder="Your Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                                            <input
                                                type="tel"
                                                value={guestPhone}
                                                onChange={(e) => setGuestPhone(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                placeholder="08X-XXX-XXXX"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Line ID</label>
                                            <input
                                                type="text"
                                                value={guestLineId}
                                                onChange={(e) => setGuestLineId(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-yellow-700">
                                        Already a member? <a href={`/login?redirect=/booking`} className="text-indigo-600 underline font-bold">Log in</a>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={checkInDate}
                                        onChange={(e) => setCheckInDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Special Request (Optional)</label>
                                <textarea
                                    value={specialRequest}
                                    onChange={(e) => setSpecialRequest(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                    placeholder="Any questions or requests?"
                                />
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    Currently, this is a booking request. Admin will contact you to confirm and process the deposit payment.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setBookingRoom(null)}
                                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={submitting}
                                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Confirm Booking"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
