"use client";

import { useState } from "react";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ForgotPasswordPage() {
    const { t } = useLanguage();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            // Always show success to prevent email enumeration
            setSubmitted(true);
        } catch (error) {
            console.error(error);
            setSubmitted(true);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                        <Mail size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{t.auth.checkEmail}</h2>
                    <p className="text-gray-500">
                        {t.auth.checkEmailDesc} <b>{email}</b>
                    </p>
                    <Link href="/login" className="text-indigo-600 font-medium hover:underline block mt-4">
                        {t.auth.backToLogin}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
                <Link href="/login" className="text-gray-400 hover:text-gray-600 flex items-center gap-2 text-sm">
                    <ArrowLeft size={16} /> {t.auth.backToLogin}
                </Link>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">{t.auth.forgotPasswordTitle}</h1>
                    <p className="text-gray-500">{t.auth.forgotPasswordSubtitle}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.auth.emailLabel}</label>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="admin@staysync.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : t.auth.sendResetLinkButton}
                    </button>
                </form>
            </div>
        </div>
    );
}
