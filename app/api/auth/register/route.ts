
import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { sendVerificationEmail } from "@/lib/mail";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

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

        // Find default organization (ID 1) or create if not exists
        let organizationId = 1;
        const defaultOrg = await prisma.organization.findUnique({
            where: { id: 1 }
        });

        if (!defaultOrg) {
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

        // Prepare Verification Token (Atomic Config)
        const verificationToken = uuidv4();
        const verificationExpiry = new Date(new Date().getTime() + 24 * 3600 * 1000); // 24 hours

        console.log(`[Register] Creating user ${email} with pre-generated token`);

        // Create new user with verification token
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                phone: phone || null,
                role: "TENANT",
                status: "Active",
                organizationId,
                emailVerified: false,
                verificationToken,
                verificationExpiry
            },
        });

        // Send verification email
        try {
            console.log(`[Register] Attempting to send verification email to ${email}`);
            await sendVerificationEmail(email, verificationToken);
            console.log(`[Register] Verification email sent to ${email}`);
        } catch (emailError) {
            console.error("[Register] Failed to send verification email:", emailError);
            // Continue even if email fails, user can resend later via Login screen
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
