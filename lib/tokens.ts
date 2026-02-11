import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export const generateVerificationToken = async (email: string) => {
    const token = uuidv4();
    const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

    const existingToken = await prisma.user.findFirst({
        where: { email }
    });

    if (existingToken) {
        await prisma.user.update({
            where: { email },
            data: {
                verificationToken: token,
                verificationExpiry: expires
            }
        });
    }

    return token;
};

export const generatePasswordResetToken = async (email: string) => {
    const token = uuidv4();
    const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

    await prisma.user.update({
        where: { email },
        data: {
            resetToken: token,
            resetTokenExpiry: expires
        }
    });

    return token;
};

export const generateTwoFactorToken = (email: string) => {
    const token = crypto.randomInt(100_000, 1_000_000).toString();
    // TODO: Store this if we were doing email-based 2FA, but we are doing TOTP (App-based)
    // So this might not be needed for App-based 2FA setup, but good to have helper.
    return token;
};
