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
    if (path === "/" || path.startsWith("/billing") || path.startsWith("/rooms") || path.startsWith("/issues") || path.startsWith("/users") || path.startsWith("/audit")) {
        const sessionToken = request.cookies.get("session_token");

        if (!sessionToken) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // Note: Role-based access is now handled by API endpoints
        // Frontend still uses JWT payload for UI rendering
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/billing/:path*",
        "/rooms/:path*",
        "/issues/:path*",
        "/users/:path*",
        "/audit/:path*",
    ],
};
