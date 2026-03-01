import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "aos/dist/aos.css";
import "highlight.js/styles/github-dark.css";
import { Toaster } from "sonner";
import ClientEffects from "@/components/ClientEffects";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Frontend Developer Portfolio",
  description:
    "A modern portfolio showcasing frontend development projects and skills",
  icons: {
    icon: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        url: "/favicons/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        url: "/favicons/favicon-16x16.png",
      },
      { rel: "icon", url: "/favicons/favicon.ico" },
    ],
    apple: {
      rel: "apple-touch-icon",
      url: "/favicons/apple-touch-icon.png",
    },
  },
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <div className="min-h-screen bg-background text-foreground dark">
          <ClientEffects />
          {children}
          <Toaster position="bottom-right" theme="dark" />
        </div>
      </body>
    </html>
  );
}
