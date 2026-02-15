import Link from "next/link";
import { UserPlus } from "lucide-react";
import DeleteRoomButton from "./DeleteRoomButton";
import RoomCommonAreaToggle from "./RoomCommonAreaToggle";
import { getRooms } from "@/lib/data/rooms";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Suspense } from "react";

// Components
import RoomList from "./RoomList";

export default async function RoomsPage() {
    const session = await getCurrentSession();

    if (!session) {
        redirect("/login");
    }

    const roomsData = getRooms();

    return (
        <div className="space-y-8">
            {/* Enhanced Gradient Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg">🏠 ห้องพักทั้งหมด</h2>
                        <p className="text-indigo-100 mt-2 text-sm md:text-base">จัดการห้องพักและผู้เช่า</p>
                    </div>
                    <Link href="/rooms/add">
                        <button className="bg-white text-green-700 px-4 py-2.5 rounded-lg font-bold hover:bg-green-50 transition-all shadow-md hover:shadow-lg flex items-center gap-2 border border-white/30 hover:scale-105 text-sm">
                            ➕ เพิ่มห้องพัก
                        </button>
                    </Link>
                </div>
            </div>

            {/* Enhanced Room Cards Grid */}
            <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>)}</div>}>
                <RoomListWrapper roomsData={roomsData} />
            </Suspense>
        </div>
    );
}

async function RoomListWrapper({ roomsData }: { roomsData: Promise<any[]> }) {
    const rooms = await roomsData;
    return <RoomList rooms={rooms} />;
}

