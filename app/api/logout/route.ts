import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
    const cookieStore = await cookies();

    // Clear cookies
    cookieStore.delete("admin_session");
    cookieStore.delete("user_role");

    return NextResponse.json({ success: true });
}
