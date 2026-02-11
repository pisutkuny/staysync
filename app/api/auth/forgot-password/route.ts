import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Return 200 to avoid enumerating emails
            return NextResponse.json({ message: "If email exists, a reset link has been sent." });
        }

        const token = await generatePasswordResetToken(email);
        await sendPasswordResetEmail(email, token);

        return NextResponse.json({ message: "Reset email sent" });
    } catch (error) {
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
