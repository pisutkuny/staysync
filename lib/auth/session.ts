import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

export interface SessionPayload {
    userId: number;
    organizationId: number;
    email: string;
    role: string;
}

/**
 * Create a new JWT session token
 */
export function createSession(payload: SessionPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: SESSION_DURATION,
    });
}

/**
 * Verify and decode a JWT session token
 */
export function verifySession(token: string): SessionPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as SessionPayload;
    } catch (error) {
        return null;
    }
}

/**
 * Get current session from cookies
 */
export async function getCurrentSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
        return null;
    }

    return verifySession(sessionToken);
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION,
        path: '/',
    });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete('session_token');
}
