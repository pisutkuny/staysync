import { NextRequest, NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, fullName, phone } = body;

        // Basic validation
        if (!email || !password || !fullName) {
            return NextResponse.json(
                { error: "กรุณากรอกข้อมูลให้ครบถ้วน (Email, Password, Name)" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "อีเมลนี้ถูกใช้งานแล้ว" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Find default organization (ID 1) or create if not exists (for safety)
        let organizationId = 1;

        // Check if org 1 exists
        const defaultOrg = await prisma.organization.findUnique({
            where: { id: 1 }
        });

        if (!defaultOrg) {
            // Find first available org or error
            const firstOrg = await prisma.organization.findFirst();
            if (firstOrg) {
                organizationId = firstOrg.id;
            } else {
                return NextResponse.json(
                    { error: "System Error: No organization found to register with." },
                    { status: 500 }
                );
            }
        }

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                phone: phone || null,
                role: "TENANT", // Default role
                status: "Active",
                organizationId,
                emailVerified: false,
            },
        });

        // Send verification email
        try {
            console.log(`[Register] Attempting to send verification email to ${email}`);
            const token = await generateVerificationToken(email);
            console.log(`[Register] Generated token for ${email}`);
            await sendVerificationEmail(email, token);
            console.log(`[Register] Verification email sent to ${email}`);
        } catch (emailError) {
            console.error("[Register] Failed to send verification email:", emailError);
            // Continue even if email fails, user can resend later
        }

        // Remove password from response
        const { password: _, ...userWithoutPassword } = newUser;

        return NextResponse.json(
            {
                success: true,
                message: "ลงทะเบียนสำเร็จ",
                user: userWithoutPassword,
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
            { status: 500 }
        );
    }
}
