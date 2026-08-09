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
        <div>
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

