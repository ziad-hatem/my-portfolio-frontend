import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image to PDF Converter | Free & Secure | Privacy First",
  description: "Convert JPG, PNG, HEIC to PDF securely in your browser. No file uploads, 100% local processing. Fast, free, and private.",
  keywords: ["image to pdf", "heic to pdf", "jpg to pdf", "png to pdf", "convert images to pdf", "private pdf converter", "offline converter"],
  openGraph: {
    title: "Image to PDF Converter | Free & Secure",
    description: "Convert images to PDF securely in your browser. No file uploads - 100% local processing.",
    type: "website",
    url: "/tools/image-to-pdf",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image to PDF Converter | Free & Secure",
    description: "Convert images to PDF securely in your browser. No file uploads.",
  },
  alternates: {
    canonical: "/tools/image-to-pdf",
  },
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
