"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import NavLinks from "./NavLinks";
import LogoutButton from "./LogoutButton";
import { ThemeToggle } from "./ThemeToggle";

export default function Navbar({ userRole }: { userRole?: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Universal Top Bar (Visible on Mobile & Desktop) */}
            <div className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-40 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    {/* Hamburger Button - Always Visible */}
                    <button
                        onClick={() => setIsOpen(true)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                        <Menu size={24} />
                    </button>

                    <Link href="/">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent cursor-pointer">
                            StaySync
                        </h1>
                    </Link>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                </div>
            </div>

            {/* Sidebar Drawer Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 transition-opacity backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Drawer Panel */}
            <aside
                className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent px-2">
                        StaySync
                    </h1>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-2">
                    <NavLinks userRole={userRole} onClick={() => setIsOpen(false)} />
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <LogoutButton />
                    <div className="mt-4 text-xs text-center text-gray-400">
                        v1.0.1 (Popup Mode)
                    </div>
                </div>
            </aside>
        </>
    );
}
