import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const sendVerificationEmail = async (email: string, token: string) => {
    const confirmLink = `${domain}/verify-email?token=${token}`;

    try {
        await resend.emails.send({
            from: "StaySync <onboarding@resend.dev>", // Or your verified domain
            to: email,
            subject: "Confirm your email",
            html: `<p>Click <a href="${confirmLink}">here</a> to confirm email.</p>`
        });
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error("Failed to send verification email:", error);
        // Fallback for dev without API key
        if (!process.env.RESEND_API_KEY) {
            console.log(`[DEV] Verification Link: ${confirmLink}`);
        }
    }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
    const resetLink = `${domain}/reset-password?token=${token}`;

    try {
        await resend.emails.send({
            from: "StaySync <onboarding@resend.dev>",
            to: email,
            subject: "Reset your password",
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
        });
        console.log(`Reset password email sent to ${email}`);
    } catch (error) {
        console.error("Failed to send reset email:", error);
        // Fallback for dev without API key
        if (!process.env.RESEND_API_KEY) {
            console.log(`[DEV] Reset Password Link: ${resetLink}`);
        }
    }
};
