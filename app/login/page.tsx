"use client";

import React, { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LoginPage() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [show2FA, setShow2FA] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState("");

    const [error, setError] = useState<string | React.ReactNode>("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const payload = { ...formData, code: twoFactorCode };
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.status === 403 && data.require2FA) {
                setShow2FA(true);
                setLoading(false);
                return;
            }

            if (!res.ok) {
                const errorMessage = data.error || t.auth.invalidCredentials;
                if (errorMessage === 'Please verify your email address') {
                    setError(
                        <div className="flex flex-col gap-2">
                            <span>{t.auth.pleaseVerifyEmail}</span>
                            <button
                                type="button"
                                onClick={() => handleResendVerification(formData.email)}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 underline"
                            >
                                {t.auth.resendVerification}
                            </button>
                        </div>
                    );
                } else {
                    setError(errorMessage);
                }
                throw new Error(errorMessage);
            }

            window.location.href = "/dashboard";
        } catch (error: any) {
            if (typeof error === 'string' || React.isValidElement(error)) {
                // Error already set
            } else if (error.message !== 'Please verify your email address') {
                setError(error.message);
            }
            setLoading(false);
        }
    };

    const handleResendVerification = async (emailToResend: string) => {
        if (!emailToResend) return;
        try {
            const res = await fetch("/api/auth/verify-email/resend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailToResend })
            });
            const data = await res.json();
            if (data.success) {
                alert(t.auth.verificationSent);
            } else {
                alert(data.error || t.auth.verificationFailed);
            }
        } catch (e) {
            alert(t.common.error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 space-y-6">
                <div className="text-center space-y-2">
                    <div className="bg-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto text-white shadow-lg mb-4">
                        <Lock size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{t.auth.loginTitle}</h1>
                    <p className="text-gray-500">{t.auth.loginSubtitle}</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!show2FA ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t.auth.emailLabel}</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="admin@staysync.com"
                                    className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">{t.auth.passwordLabel}</label>
                                    <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline">
                                        {t.auth.forgotPasswordTitle}
                                    </Link>
                                </div>
                                <input
                                    required
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={t.common.loading ? "Enter password" : ""}
                                    className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-indigo-50 p-4 rounded-lg mb-4 text-center">
                                <p className="text-indigo-800 font-medium">{t.auth.twoFactorRequired}</p>
                                <p className="text-indigo-600 text-sm">{t.auth.enterTwoFactorCode}</p>
                            </div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t.auth.twoFactorCode}</label>
                            <input
                                required
                                type="text"
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center tracking-widest text-lg font-mono"
                                autoFocus
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (show2FA ? t.auth.verifyAndLogin : t.auth.signInButton)}
                    </button>

                    {show2FA && (
                        <button
                            type="button"
                            onClick={() => setShow2FA(false)}
                            className="w-full text-sm text-gray-500 hover:text-gray-700"
                        >
                            {t.auth.backToLogin}
                        </button>
                    )}
                </form>

                <div className="text-center pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        {t.auth.noAccount}{" "}
                        <Link href="/register" className="text-indigo-600 font-semibold hover:underline">
                            {t.auth.registerLink}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
