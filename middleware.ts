import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Paths that require authentication
    const protectedPaths = ["/", "/billing", "/rooms", "/issues"];

    // Check if current path starts with any protected path
    const isProtected = protectedPaths.some(prefix =>
        path === prefix || (path.startsWith(prefix) && path !== "/")
    );

    // We also want to protect the root "/" but not "/report" or "/login" or "/api"
    // Specific check for root dashboard
    if (path === "/" || path.startsWith("/billing") || path.startsWith("/rooms") || path.startsWith("/issues")) {
        const adminSession = request.cookies.get("admin_session");
        const userRole = request.cookies.get("user_role")?.value;

        if (!adminSession) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // Protect Billing Page (Owner Only)
        if (path.startsWith("/billing") && userRole !== "OWNER") {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/billing/:path*",
        "/rooms/:path*",
        "/issues/:path*",
    ],
};
