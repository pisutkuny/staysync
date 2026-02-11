"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                throw new Error("Invalid password");
            }

            // Force full reload to ensure cookies are sent and middleware/server components see the new session
            // window.location.href = "/";
            router.push("/");
            // Use router.refresh() to ensure server components update with new cookie
            router.refresh();
        } catch (error) {
            alert("Invalid password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 space-y-6">
                <div className="text-center space-y-2">
                    <div className="bg-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto text-white shadow-lg mb-4">
                        <Lock size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">StaySync Login</h1>
                    <p className="text-gray-500">Sign in to manage dormitory</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input
                            required
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Enter password"
                            className="w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
                    </button>
                </form>

                <div className="text-center pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        ยังไม่มีบัญชี?{" "}
                        <Link href="/register" className="text-indigo-600 font-semibold hover:underline">
                            สมัครสมาชิก
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
