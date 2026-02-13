import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { cookies } from "next/headers";
import Navbar from "./components/Navbar";
import { ThemeProvider } from "./components/ThemeProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { ModalProvider } from "./context/ModalContext";

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
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 print:bg-white print:min-h-0">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <LanguageProvider>
              <ModalProvider>
                <Navbar userRole={userRole} />

                {/* Main Content - No left margin needed as sidebar is now a popup */}
                <main className="pt-20 p-4 md:p-8 md:pt-24 max-w-7xl mx-auto print:p-0 print:pt-0 print:max-w-none print:m-0">
                  {children}
                </main>
              </ModalProvider>
            </LanguageProvider>
          </ThemeProvider>
        </div>
      </body>
    </html >
  );
}
