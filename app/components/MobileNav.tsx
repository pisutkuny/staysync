"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import NavLinks from "./NavLinks";
import LogoutButton from "./LogoutButton";

export default function MobileNav({ userRole }: { userRole?: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Header for Mobile */}
            <div className="md:hidden fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-50 px-4 py-3 flex items-center justify-between shadow-sm">
                <Link href="/">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent cursor-pointer">
                        StaySync
                    </h1>
                </Link>
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Header for Mobile only - Fixed */}

            {/* Sidebar Drawer Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 md:hidden transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Drawer */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 md:hidden flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                        StaySync
                    </h1>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <NavLinks userRole={userRole} onClick={() => setIsOpen(false)} />
                </div>

                <div className="p-4 border-t border-gray-100">
                    <LogoutButton />
                    <div className="mt-4 text-xs text-center text-gray-400">
                        v1.0.0
                    </div>
                </div>
            </aside>
        </>
    );
}
