"use client";

import { useState, useEffect } from "react";
import { QrCode, Loader2, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import Image from "next/image";

export default function Setup2FA() {
    const [step, setStep] = useState<"loading" | "idle" | "qr" | "verify" | "done">("loading");
    const [isEnabled, setIsEnabled] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [secret, setSecret] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Check initial status
    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            // We can check 2FA status from session or profile API.
            // For now, let's reuse the /api/auth/session or assume we can check via a new lightweight endpoint
            // OR simpler: just try to generate. If already enabled, maybe the API should tell us?
            // Let's add a GET /api/auth/2fa/status or just rely on the user profile data if available in context.
            // Since we don't have a dedicated status API yet, I'll assume we can pass `isEnabled` as a prop OR
            // I'll quickly check via the generate endpoint (which might return "already enabled" error?).
            // Actually, let's just fetch the user profile from /api/settings which we know exists, 
            // BUT /api/settings returns SystemConfig, not User Profile.

            // Correct approach: Fetch /api/auth/me (User Profile)
            // I'll implement a quick check here.

            const res = await fetch("/api/auth/me", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setIsEnabled(data.user.twoFactorEnabled);
                setStep("idle");
            } else {
                setStep("idle"); // Fallback
            }
        } catch (e) {
            console.error(e);
            setStep("idle");
        }
    };

    const startSetup = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/auth/2fa/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error("Failed to start setup");

            const data = await res.json();
            setQrCodeUrl(data.qrCodeUrl);
            setSecret(data.secret);
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
                body: JSON.stringify({ token: code, secret })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Verification failed");
            }

            setIsEnabled(true);
            setStep("done");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const disable2FA = async () => {
        if (!confirm("Are you sure you want to disable 2FA? Your account will be less secure.")) return;

        setLoading(true);
        try {
            const res = await fetch("/api/auth/2fa/disable", {
                method: "POST"
            });

            if (!res.ok) throw new Error("Failed to disable");

            setIsEnabled(false);
            setStep("idle");
            alert("2FA has been disabled.");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (step === "loading") {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;
    }

    if (isEnabled && step !== "done") {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-700">
                    <CheckCircle size={24} className="text-green-500" /> Two-Factor Authentication
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-green-800 font-medium flex items-center gap-2">
                        <CheckCircle size={18} /> 2FA is currently enabled
                    </p>
                    <p className="text-green-600 text-sm mt-1">Your account is secured with Google Authenticator.</p>
                </div>

                <button
                    onClick={disable2FA}
                    disabled={loading}
                    className="text-red-600 text-sm font-medium hover:text-red-700 flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-red-50 transition"
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                    Disable 2FA
                </button>
            </div>
        );
    }

    if (step === "idle") {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-700">
                    <QrCode size={24} /> Two-Factor Authentication
                </h3>
                <p className="text-gray-600 mb-6">
                    Protect your account by requiring a code from your authenticator app when you log in.
                </p>
                <button
                    onClick={startSetup}
                    disabled={loading}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium shadow-md shadow-indigo-200"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <QrCode size={20} />}
                    Enable 2FA
                </button>
            </div>
        );
    }

    if (step === "qr" || step === "verify") {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-700">
                    Setup 2FA
                </h3>

                <div className="space-y-6">
                    <div className="text-center bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-4">1. Scan this QR Code</p>
                        {qrCodeUrl && (
                            <div className="bg-white p-2 border inline-block rounded-xl shadow-sm">
                                <Image src={qrCodeUrl} alt="2FA QR Code" width={180} height={180} />
                            </div>
                        )}
                        <p className="text-xs text-gray-400 mt-4 break-all px-4">
                            Secret: {secret}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">2. Enter the 6-digit code</p>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-center tracking-[0.5em] text-2xl font-mono font-bold text-indigo-600"
                            placeholder="000000"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => {
                                setStep("idle");
                                setCode("");
                            }}
                            className="flex-1 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={verifyAndEnable}
                            disabled={code.length !== 6 || loading}
                            className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center shadow-md shadow-indigo-200 font-medium"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Verify & Enable"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === "done") {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center py-12">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">2FA Enabled!</h3>
                <p className="text-gray-500 mb-8">Your account is now more secure. You will be asked for a code next time you login.</p>
                <button
                    onClick={() => setStep("idle")}
                    className="bg-gray-900 text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition font-medium"
                >
                    Done
                </button>
            </div>
        );
    }

    return null;
}
