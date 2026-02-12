import nodemailer from "nodemailer";

const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER, // Your Gmail address
        pass: process.env.GMAIL_APP_PASSWORD, // Your App Password
    },
});

export const sendVerificationEmail = async (email: string, token: string) => {
    const confirmLink = `${domain}/verify-email?token=${token}`;

    try {
        await transporter.sendMail({
            from: `"StaySync" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: "Confirm your StaySync email",
            html: `<p>Please click <a href="${confirmLink}">here</a> to confirm your email address.</p>`,
        });
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error("Failed to send verification email:", error);
        // Fallback log
        console.log(`[DEV] Verification Link: ${confirmLink}`);
    }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
    const resetLink = `${domain}/reset-password?token=${token}`;

    try {
        await transporter.sendMail({
            from: `"StaySync" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: "Reset your StaySync password",
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
        });
        console.log(`Reset password email sent to ${email}`);
    } catch (error) {
        console.error("Failed to send reset email:", error);
        // Fallback log
        console.log(`[DEV] Reset Password Link: ${resetLink}`);
    }
};
