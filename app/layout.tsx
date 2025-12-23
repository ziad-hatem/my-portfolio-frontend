import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CookieConsent } from "@/components/cookies/CookieConsent";
import { Toaster } from "sonner";
import ClientEffects from "@/components/ClientEffects";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Frontend Developer Portfolio",
  description:
    "A modern portfolio showcasing frontend development projects and skills",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {/* Browser Fingerprinting & Analytics */}
        <Script
          src="/fingerprint-collector.js"
          strategy="afterInteractive"
          id="fingerprint-collector"
        />
        <Script
          src="/interaction-tracker.js"
          strategy="afterInteractive"
          id="interaction-tracker"
        />

        <div className="min-h-screen bg-background text-foreground dark">
          <ClientEffects />
          {children}
          <Toaster position="bottom-right" theme="dark" />
          <CookieConsent />
        </div>
      </body>
    </html>
  );
}
