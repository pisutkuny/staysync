import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { cookies } from "next/headers";
import Navbar from "./components/Navbar";

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
        <div className="min-h-screen bg-gray-50">
          <Navbar userRole={userRole} />

          {/* Main Content - No left margin needed as sidebar is now a popup */}
          <main className="pt-32 p-4 md:p-8 max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html >
  );
}
