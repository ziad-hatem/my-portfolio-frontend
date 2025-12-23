import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compress PDF | Reduce File Size Online | Privacy First",
  description: "Optimize and compress PDF file size directly in your browser. Secure, local processing with no server uploads.",
  keywords: ["compress pdf", "reduce pdf size", "optimize pdf", "shrink pdf", "offline pdf compressor", "local pdf compression"],
  openGraph: {
    title: "Compress PDF | Reduce File Size Online",
    description: "Optimize PDF file size directly in your browser. No file uploads - 100% local processing.",
    type: "website",
    url: "/tools/compress-pdf",
  },
  twitter: {
    card: "summary_large_image",
    title: "Compress PDF | Reduce File Size Online",
    description: "Optimize PDF file size directly in your browser. No file uploads.",
  },
  alternates: {
    canonical: "/tools/compress-pdf",
  },
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
