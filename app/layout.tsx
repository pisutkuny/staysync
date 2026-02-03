import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Receipt, FileText, DoorOpen, Megaphone } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import LogoutButton from "./components/LogoutButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StaySync",
  description: "Dormitory Management System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const userRole = cookieStore.get("user_role")?.value;

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-100 fixed h-full hidden md:block z-10">
            <div className="p-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                StaySync
              </h1>
            </div>
            <nav className="px-4 space-y-2">
              <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all font-medium">
                <LayoutDashboard size={20} />
                Dashboard
              </Link>
              <Link href="/rooms" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all font-medium">
                <DoorOpen size={20} />
                Rooms
              </Link>

              {/* Billing only for Owner */}
              {userRole === "OWNER" && (
                <Link href="/billing" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all font-medium">
                  <Receipt size={20} />
                  Billing
                </Link>
              )}

              <Link href="/issues" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all font-medium">
                <FileText size={20} />
                Pending Issues
              </Link>

              <Link href="/report" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all font-medium">
                <FileText size={20} />
                Report Issue
              </Link>

              {userRole === "OWNER" && (
                <Link href="/broadcast" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all font-medium">
                  <Megaphone size={20} />
                  Broadcast
                </Link>
              )}
            </nav>
            <div className="px-4 pb-2">
              <LogoutButton />
            </div>
            <div className="p-4 border-t border-gray-100 text-xs text-center text-gray-400">
              v1.0.0
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 md:ml-64 p-8 bg-gray-50 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html >
  );
}
