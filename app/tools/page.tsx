import Link from "next/link";
import { FileStack, FileIcon, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import * as motion from "framer-motion/client";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creative Tools | Free Online Utilities",
  description: "A collection of free, privacy-focused developer tools. Convert images to PDF, compress files, and more - all running locally in your browser.",
  keywords: ["developer tools", "image to pdf", "compress pdf", "privacy tools", "free online utilities", "client side tools"],
  openGraph: {
    title: "Creative Tools | Free Online Utilities",
    description: "Free, privacy-focused tools for developers and creators. No file uploads - 100% local processing.",
    type: "website",
    url: "/tools",
    siteName: "Frontend Developer Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Creative Tools | Free Online Utilities",
    description: "Free, privacy-focused tools for developers and creators. Process files securely in your browser.",
  },
  alternates: {
    canonical: "/tools",
  },
};

const tools = [
  {
    id: "image-to-pdf",
    title: "Image to PDF",
    description: "Convert multiple images (JPG, PNG, GIF) into a single PDF document instantly. All processing happens in your browser.",
    icon: <FileStack className="w-8 h-8 text-accent" />,
    link: "/tools/image-to-pdf",
  },
  {
    id: "compress-pdf",
    title: "Compress PDF",
    description: "Reduce PDF file size securely in your browser. Perfect for optimizing scanned documents or large files for email.",
    icon: <FileIcon className="w-8 h-8 text-accent" />,
    link: "/tools/compress-pdf",
  },
  // Future tools can be added here
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen pt-12 pb-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="py-12 flex flex-col items-center text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-2">
            <Sparkles size={14} />
            <span>Privacy First & Local</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground">
            Creative <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-500">Utilities</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            A suite of powerful tools running entirely in your browser. 
            <span className="flex justify-center items-center gap-2 mt-2 text-foreground/80">
              <ShieldCheck size={18} className="text-green-500" /> 
              No file uploads. No data collection.
            </span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link 
              key={tool.id} 
              href={tool.link}
              className="group relative bg-muted/30 border border-border/50 rounded-xl p-6 hover:bg-muted/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-accent">
                <ArrowRight size={20} />
              </div>
              
              <div className="mb-4 p-3 bg-accent/10 w-fit rounded-lg group-hover:bg-accent/20 transition-colors">
                {tool.icon}
              </div>
              
              <h2 className="text-xl font-bold mb-3 text-foreground group-hover:text-accent transition-colors">
                {tool.title}
              </h2>
              
              <p className="text-muted-foreground text-sm leading-relaxed">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
