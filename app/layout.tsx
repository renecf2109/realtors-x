import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://realtors-x.vercel.app"),
  title: { default: "Realtors X | AI-Powered Real Estate", template: "%s | Realtors X" },
  description: "Discover properties, curated projects, and real estate investment opportunities with Realtors X AI-powered matching.",
  applicationName: "Realtors X",
  keywords: ["real estate", "property search", "real estate investment", "property listings", "Realtors X"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", url: "/", siteName: "Realtors X", title: "Realtors X | AI-Powered Real Estate",
    description: "Luxury property discovery, curated projects, and AI-powered real estate matching.",
    images: [{ url: "/logo.png", width: 2048, height: 772, alt: "Realtors X logo" }]
  },
  twitter: { card: "summary_large_image", title: "Realtors X | AI-Powered Real Estate", description: "Luxury property discovery and AI-powered matching.", images: ["/logo.png"] },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <a href="#main-content" className="sr-only z-50 rounded-lg bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
        <SiteHeader/>
        <div id="main-content">{children}</div>
        <SiteFooter/>
      </body>
    </html>
  );
}
