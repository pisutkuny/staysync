"use client";

import { useState } from "react";
import { QrCode, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import Image from "next/image";

export default function Setup2FA() {
    const [step, setStep] = useState<"idle" | "qr" | "verify" | "done">("idle");
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [secret, setSecret] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Helper to get userId - for now assuming we can get it from context/session or pass it in. 
    // In a real app, the API should infer userId from the session cookie.
    // For this implementation, we will assume the API gets it from session or we pass it if testing.
    // However, our API setup endpoint expects `userId` in body. This is a security risk if not validated by session on server.
    // Let's assume the server will be updated to use session.
    // For now, I'll fetch user profile to get ID.

    const [userId, setUserId] = useState<number | null>(null);

    const startSetup = async () => {
        setLoading(true);
        setError("");
        try {
            // Fetch user session first (or assume we have it)
            // Ideally use your useSession hook if you have one.
            // Let's call /api/auth/me if exists or parse cookie? 
            // Better yet, update API to use session.

            // Temporary: fetch from /api/auth/me or similar if available.
            // Let's assume we need to pass userId for now to match the API I wrote.
            // Wait, I wrote `const { userId } = await req.json();` in setup API.
            // I should fetch the current user first.

            const userRes = await fetch("/api/auth/session"); // Or similar
            // If we don't have that, let's use the layout's user or something.
            // Or just rely on the server validation (which I need to impl).

            // Re-visiting the API: `const { userId } = await req.json();`
            // I will update the API to use the session from cookie!
            // But for now, let's just make it work.

            // Hack for now: fetch profile settings api (which I used in SettingsPage) to get ID?
            // The `api/settings` returns SystemConfig, not User.

            // Let's assume current user ID is available in localStorage or we need to fix the API.
            // I will fix the API to get user ID from session. That is safer.

            const res = await fetch("/api/auth/2fa/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}) // API will now extract ID from session
            });

            if (!res.ok) throw new Error("Failed to start setup");

            const data = await res.json();
            setQrCodeUrl(data.qrCodeUrl);
            setSecret(data.secret); // Optional to show
            setStep("qr");
        } catch (err) {
            setError("Could not generate QR Code");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const verifyAndEnable = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/auth/2fa/enable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: code }) // API will extract userId from session
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Verification failed");
            }

            setStep("done");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (step === "idle") {
        return (
            <button
                onClick={startSetup}
                disabled={loading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" /> : <QrCode size={18} />}
                Setup 2FA
            </button>
        );
    }

    if (step === "qr" || step === "verify") {
        return (
            <div className="space-y-4">
                <div className="text-center">
                    <p className="tex-sm font-medium text-gray-700 mb-2">Scan this QR Code with your Authenticator App</p>
                    {qrCodeUrl && (
                        <div className="bg-white p-2 border inline-block rounded-lg">
                            <Image src={qrCodeUrl} alt="2FA QR Code" width={150} height={150} />
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enter 6-digit Code</label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-center tracking-widest text-lg font-mono"
                        placeholder="000000"
                    />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex gap-2">
                    <button
                        onClick={() => setStep("idle")}
                        className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={verifyAndEnable}
                        disabled={code.length !== 6 || loading}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex justify-center"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Verify & Enable"}
                    </button>
                </div>
            </div>
        );
    }

    if (step === "done") {
        return (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
                <CheckCircle size={24} />
                <div>
                    <p className="font-bold">2FA Enabled Successfully!</p>
                    <p className="text-sm">Your account is now more secure.</p>
                </div>
            </div>
        );
    }

    return null;
}
