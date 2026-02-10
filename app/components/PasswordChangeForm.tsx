"use client";

import { useState } from "react";
import { Lock, Save, Eye, EyeOff } from "lucide-react";

export default function PasswordChangeForm() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "New passwords do not match" });
            return;
        }

        if (newPassword.length < 8) {
            setMessage({
                type: "error",
                text: "Password must be at least 8 characters long",
            });
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: "Password changed successfully!" });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setMessage({ type: "error", text: data.error || "Failed to change password" });
            }
        } catch (error) {
            console.error("Change password error:", error);
            setMessage({ type: "error", text: "Failed to change password" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Lock size={24} />
                    Change Password
                </h2>
                <p className="text-indigo-100 mt-1">
                    Update your password to keep your account secure
                </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {message && (
                    <div
                        className={`p-4 rounded-lg ${message.type === "success"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password *
                    </label>
                    <div className="relative">
                        <input
                            type={showCurrentPassword ? "text" : "password"}
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter current password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password *
                    </label>
                    <div className="relative">
                        <input
                            type={showNewPassword ? "text" : "password"}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter new password"
                            minLength={8}
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Password must be at least 8 characters long
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password *
                    </label>
                    <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Confirm new password"
                        minLength={8}
                    />
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2 text-sm">Password Requirements:</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>✓ Minimum 8 characters long</li>
                        <li>✓ Mix of uppercase and lowercase (recommended)</li>
                        <li>✓ Include numbers and special characters (recommended)</li>
                    </ul>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        <Save size={20} />
                        {submitting ? "Saving..." : "Change Password"}
                    </button>
                </div>
            </form>
        </div>
    );
}
