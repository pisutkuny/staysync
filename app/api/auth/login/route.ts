import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, setSessionCookie } from '@/lib/auth/session';
import { logAudit, getRequestInfo } from '@/lib/audit/logger';
// @ts-ignore
import { authenticator } from 'otplib';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            include: { organization: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Check if user is active
        if (user.status !== 'Active') {
            return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
        }

        // Check 2FA
        // @ts-ignore
        if ((user as any).twoFactorEnabled) {
            // If 2FA is enabled but no code provided, return 403 with requirement
            if (!body.code) {
                return NextResponse.json({ require2FA: true }, { status: 403 });
            }

            // Verify 2FA code
            // @ts-ignore
            if ((user as any).twoFactorSecret) {
                const isValidToken = authenticator.verify({
                    token: body.code,
                    // @ts-ignore
                    secret: (user as any).twoFactorSecret
                });

                if (!isValidToken) {
                    return NextResponse.json({ error: 'Invalid 2FA Code' }, { status: 401 });
                }
            }
        }




        // Create session token
        const sessionToken = createSession({
            userId: user.id,
            organizationId: user.organizationId,
            email: user.email,
            role: user.role,
        });

        // Save session to database
        await prisma.userSession.create({
            data: {
                userId: user.id,
                sessionToken,
                ...getRequestInfo(req),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Log audit
        await logAudit({
            userId: user.id,
            userEmail: user.email,
            userName: user.fullName,
            action: 'LOGIN',
            entity: 'User',
            entityId: user.id,
            organizationId: user.organizationId,
            ...getRequestInfo(req),
        });

        // Set session cookie
        await setSessionCookie(sessionToken);

        // Set user_role cookie for layout access (middleware/client)
        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                organization: user.organization,
            },
        });

        // Set the role cookie on the response
        response.cookies.set('user_role', user.role, {
            httpOnly: false, // Allow client access if needed, or keep true if only for server component
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 // 7 days matches session
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
