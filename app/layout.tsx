import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { cookies } from "next/headers";
import MobileNav from "./components/MobileNav";
import Sidebar from "./components/Sidebar";

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
          <MobileNav userRole={userRole} />
          <Sidebar userRole={userRole} />

          {/* Main Content */}
          <main className="flex-1 md:ml-64 p-4 pt-20 md:p-8 bg-gray-50 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html >
  );
}
