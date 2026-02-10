import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Check against Database
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (user && user.password === password) {
            // Set cookies
            const cookieStore = await cookies();

            // Session Valid
            cookieStore.set("admin_session", "true", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: "/",
            });

            // Store Role (Safe to read on client if needed, but we rely on server verification mostly)
            cookieStore.set("user_role", user.role, {
                httpOnly: true, // Keep it httpOnly for security, read via server components
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 24 * 7,
                path: "/",
            });

            return NextResponse.json({ success: true, role: user.role });
        }

        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }
}
