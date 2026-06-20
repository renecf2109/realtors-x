import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import "./globals.css";

export const metadata: Metadata = {
  title: "Realtors X",
  description: "Realtors X application for AI-powered real estate property matching, listings, and lead management."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-ink/10 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <BrandLogo className="h-8 w-auto sm:h-10" priority/>
            <div className="flex items-center gap-3">
              <Link href="/investments" className="hidden text-sm font-semibold hover:text-sage sm:inline">Investments</Link>
              <Link href="/projects" className="hidden text-sm font-semibold hover:text-sage sm:inline">Projects</Link>
              <Link href="/chat" className="text-sm font-semibold hover:text-sage">Find a home</Link>
              <Link href="/login" className="btn-secondary !px-4 !py-2">Agent login</Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
