"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

function VerifyContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setErrorMessage("Missing verification token.");
            return;
        }

        fetch(`/api/auth/verify-email?token=${token}`)
            .then(async (res) => {
                const data = await res.json();
                if (res.ok) {
                    setStatus("success");
                } else {
                    setStatus("error");
                    setErrorMessage(data.error || "The link is invalid or has expired.");
                }
            })
            .catch(() => {
                setStatus("error");
                setErrorMessage("Something went wrong. Please try again.");
            });
    }, [token]);
    // ...
    if (status === "error") {
        return (
            <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                    <XCircle size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
                <p className="text-gray-600">{errorMessage}</p>
                <Link href="/login" className="text-indigo-600 hover:underline">
                    Back to Login
                </Link>
            </div>
        );
    }
    // ...

    if (status === "verifying") {
        return (
            <div className="text-center py-10">
                <Loader2 className="animate-spin mx-auto text-indigo-600 mb-4" size={48} />
                <h2 className="text-xl font-semibold">Verifying your email...</h2>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                    <CheckCircle size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
                <p className="text-gray-600">Your email has been successfully verified.</p>
                <Link href="/login" className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                    Continue to Login
                </Link>
            </div>
        );
    }

    return (
        <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                <XCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
            <p className="text-gray-600">{errorMessage}</p>
            <Link href="/login" className="text-indigo-600 hover:underline">
                Back to Login
            </Link>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin" /></div>}>
                    <VerifyContent />
                </Suspense>
            </div>
        </div>
    );
}
