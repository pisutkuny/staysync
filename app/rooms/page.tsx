
import prisma from "@/lib/prisma";
import Link from "next/link";
import { UserPlus, UserMinus } from "lucide-react";
import DeleteRoomButton from "./DeleteRoomButton";

export const dynamic = 'force-dynamic';

export default async function RoomsPage() {
    const rooms = await prisma.room.findMany({
        orderBy: { number: "asc" },
        include: { residents: true }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">All Rooms</h2>
                    <p className="text-gray-500 mt-2">Manage rooms and residents.</p>
                </div>
                <Link href="/rooms/add">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors">
                        Add New Room
                    </button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room) => (
                    <div key={room.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-52">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{room.number}</h3>
                                <p className="text-indigo-600 font-medium">฿{room.price}/mo</p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full ${room.status === "Occupied" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                                }`}>
                                {room.status}
                            </span>
                        </div>

                        <div className="mt-4">
                            {room.status === "Occupied" ? (
                                <div>
                                    <p className="text-sm text-gray-500">Resident:</p>
                                    {room.residents?.length > 0 ? (
                                        <Link href={`/residents/${room.residents[0].id}`} className="text-indigo-600 font-medium hover:underline flex items-center gap-1">
                                            👤 {room.residents[0].fullName}
                                        </Link>
                                    ) : (
                                        <p className="font-medium text-gray-900">Unknown</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">Empty room</p>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2 items-center">
                            {room.status === "Available" ? (
                                <>
                                    <Link href={`/rooms/checkin/${room.id}`} className="w-full">
                                        <button className="w-full py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium transition-colors flex items-center justify-center gap-2">
                                            <UserPlus size={18} />
                                            Check In
                                        </button>
                                    </Link>
                                    <DeleteRoomButton roomId={room.id} />
                                </>
                            ) : (
                                <button disabled className="w-full py-2 bg-gray-50 text-gray-400 rounded-lg cursor-not-allowed font-medium flex items-center justify-center gap-2">
                                    <UserMinus size={18} />
                                    Occupied
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
