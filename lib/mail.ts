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

// Helper for consistent email styling
const getHtmlTemplate = (title: string, message: string, buttonText: string, link: string) => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
.container { max-width: 500px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
.header { background-color: #4f46e5; padding: 30px 20px; text-align: center; }
.header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
.content { padding: 32px 24px; color: #374151; line-height: 1.6; font-size: 16px; }
.button-container { text-align: center; margin: 24px 0; }
.button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.4); transition: background-color 0.2s; }
.button:hover { background-color: #4338ca; }
.footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; }
.link-fallback { word-break: break-all; font-size: 12px; color: #9ca3af; margin-top: 10px; }
</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>${message}</p>
            <div class="button-container">
                <a href="${link}" class="button">${buttonText}</a>
            </div>
            <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
                If you didn't request this action, you can safely ignore this email.
            </p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} StaySync. All rights reserved.</p>
            <p style="margin-top: 8px;">Managed by StaySync Dormitory System</p>
        </div>
    </div>
</body>
</html>
`;

export const sendVerificationEmail = async (email: string, token: string) => {
    const confirmLink = `${domain}/verify-email?token=${token}`;

    try {
        await transporter.sendMail({
            from: `"StaySync Security" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: "Action Required: Verify your email",
            html: getHtmlTemplate(
                "Verify Email Address",
                "Thanks for signing up for StaySync! Please verify your email address to activate your account and access all features.",
                "Verify My Email",
                confirmLink
            ),
        });
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error("Failed to send verification email:", error);
        console.log(`[DEV] Verification Link: ${confirmLink}`);
    }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
    const resetLink = `${domain}/reset-password?token=${token}`;

    try {
        await transporter.sendMail({
            from: `"StaySync Security" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: "Reset your password",
            html: getHtmlTemplate(
                "Password Reset Request",
                "We received a request to reset the password for your StaySync account. Click the button below to set a new password.",
                "Reset Password",
                resetLink
            ),
        });
        console.log(`Reset password email sent to ${email}`);
    } catch (error) {
        console.error("Failed to send reset email:", error);
        console.log(`[DEV] Reset Password Link: ${resetLink}`);
    }
};
