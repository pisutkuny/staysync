"use client";

import { useState } from "react";
import { Loader2, UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useModal } from "@/app/context/ModalContext";

export default function RegisterPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const { showAlert } = useModal();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            showAlert(t.common.error, t.auth.passwordsDoNotMatch, "error");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Registration failed");
            }

            if (data.emailSent) {
                showAlert(t.common.success, t.auth.verificationSent, "success");
            } else {
                showAlert(t.common.error, t.auth.verificationFailed, "error");
            }
            router.push("/login");
        } catch (error: any) {
            showAlert(t.common.error, error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 space-y-6">
                <div className="text-center space-y-2">
                    <div className="bg-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto text-white shadow-lg mb-4">
                        <UserPlus size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{t.auth.registerTitle}</h1>
                    <p className="text-gray-500">{t.auth.registerSubtitle}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.auth.fullNameLabel}</label>
                        <input
                            required
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="Somchai Jaidee"
                            className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.auth.phoneLabel}</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="0812345678"
                            className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.auth.emailLabel}</label>
                        <input
                            required
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="somchai@example.com"
                            className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.auth.passwordLabel}</label>
                        <input
                            required
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder={t.auth.passwordTooShort}
                            className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t.auth.confirmPasswordLabel}</label>
                        <input
                            required
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder={t.auth.confirmPasswordLabel}
                            className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-6"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : t.auth.registerButton}
                    </button>
                </form>

                <div className="text-center pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        {t.auth.hasAccount}{" "}
                        <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
                            {t.auth.loginLink}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
