import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Layout/Navigation";
import { Footer } from "@/components/Layout/Footer";
import { CookieConsent } from "@/components/cookies/CookieConsent";
import { Toaster } from "sonner";
import ClientEffects from "@/components/ClientEffects";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Frontend Developer Portfolio",
  description:
    "A modern portfolio showcasing frontend development projects and skills",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-background text-foreground dark">
          <Navigation />
          <ClientEffects />
          <main className="z-50 relative">{children}</main>
          <Footer />
          <Toaster position="bottom-right" theme="dark" />
          <CookieConsent />
        </div>
      </body>
    </html>
  );
}
