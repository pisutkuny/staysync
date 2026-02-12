import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';
import qrcode from 'qrcode';

async function generate2FA() {
    // Instantiate TOTP with necessary plugins
    const totp = new TOTP({
        crypto: new NobleCryptoPlugin(),
        base32: new ScureBase32Plugin(),
    });

    const userEmail = "admin@staysync.com"; // Replace with your test email if different
    const serviceName = "StaySync";

    // Generate secret
    const secret = totp.generateSecret();

    // Manually construct OTPAuth URL since keyuri might be missing on TOTP in this version
    // Format: otpauth://totp/Service:UserEmail?secret=SECRET&issuer=Service
    const encodedUser = encodeURIComponent(userEmail);
    const encodedIssuer = encodeURIComponent(serviceName);
    const otpauth = `otpauth://totp/${encodedIssuer}:${encodedUser}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;

    console.log("\n=======================================================");
    console.log("🔐  2FA SETUP INFO FOR TESTING");
    console.log("=======================================================\n");

    console.log("1. Secret (Save this to DB 'twoFactorSecret'):");
    console.log(`   ${secret}\n`);

    console.log("2. OTP Auth URL (For QR Code):");
    console.log(`   ${otpauth}\n`);

    try {
        const qrImageUrl = await qrcode.toDataURL(otpauth);
        console.log("3. QR Code Data URL (Paste into browser address bar to see QR):");
        console.log("   (It's a long string starting with data:image/png...)");
        console.log(`   ${qrImageUrl.substring(0, 50)}...[truncated]...\n`);

        // Alternative: Print terminal QR code
        console.log("4. Scan this QR Code with Google Authenticator:");
        const terminalQR = await qrcode.toString(otpauth, { type: 'terminal', small: true });
        console.log(terminalQR);

    } catch (err) {
        console.error("Error generating QR:", err);
    }

    console.log("=======================================================");
    console.log("Use the 'Secret' value to update your User record in DB.");
    console.log("set 'twoFactorEnabled' to true.");
    console.log("=======================================================\n");
}

generate2FA();
