"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavLinks from "./NavLinks";
import LogoutButton from "./LogoutButton";
import { ThemeToggle } from "./ThemeToggle";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Navbar({ userRole }: { userRole?: string }) {
    const { language, setLanguage, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Hide Navbar on authentication pages or payment pages
    const isAuthPage = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"].some(path => pathname?.startsWith(path));
    const isPaymentPage = pathname?.startsWith("/pay");

    if (isAuthPage || isPaymentPage) return null;

    return (
        <>
            {/* Universal Top Bar (Visible on Mobile & Desktop) */}
            <div className="fixed top-0 left-0 w-full bg-white border-b-2 border-slate-300 z-40 px-4 py-3 flex items-center justify-between shadow-sm print:hidden">
                <div className="flex items-center gap-3">
                    {/* Hamburger Button - Always Visible */}
                    <button
                        onClick={() => setIsOpen(true)}
                        className="p-2 text-slate-700 hover:bg-slate-100 border-2 border-transparent hover:border-slate-300 rounded-lg transition-all focus:outline-none"
                    >
                        <Menu size={24} />
                    </button>

                    <Link href={userRole ? "/dashboard" : "/"}>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-transparent cursor-pointer">
                            StaySync
                        </h1>
                    </Link>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setLanguage(language === 'TH' ? 'EN' : 'TH')}
                        className="w-10 h-10 rounded-lg bg-white border-2 border-slate-300 text-slate-700 hover:border-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 flex items-center justify-center text-xs font-bold transition-all shadow-sm"
                    >
                        {language}
                    </button>
                    <ThemeToggle />
                </div>
            </div>

            {/* Sidebar Drawer Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-50 transition-opacity backdrop-blur-sm print:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Drawer Panel */}
            <aside
                className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col border-r-4 border-slate-300 print:hidden ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="p-5 flex items-center justify-between border-b-2 border-slate-300 bg-slate-50">
                    <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-transparent px-2">
                        StaySync
                    </h1>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 border-2 border-transparent hover:border-slate-300 transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-2">
                    <NavLinks userRole={userRole} onClick={() => setIsOpen(false)} />
                </div>

                <div className="p-4 border-t-2 border-slate-300 bg-slate-100">
                    {userRole ? (
                        <LogoutButton label={t.common.logout} />
                    ) : (
                        <Link href="/login" className="w-full flex items-center gap-3 px-4 py-3 text-indigo-700 hover:bg-indigo-100 border-2 border-indigo-200 hover:border-indigo-400 rounded-xl transition-all font-bold">
                            <div className="w-5 h-5 flex items-center justify-center">🔐</div>
                            {t.common.login}
                        </Link>
                    )}
                    <div className="mt-4 text-xs text-center text-slate-400 font-semibold">
                        v1.0.2 (High Contrast)
                    </div>
                </div>
            </aside>
        </>
    );
}
