"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Sparkles, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import Confetti from "@/components/ui/Confetti";
import type { CongratulationEntry } from "@/types/congratulation";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

interface CongratulationPageProps {
  data: CongratulationEntry;
}

/**
 * Public Congratulations Page
 * Displays a beautiful congratulations message with animations
 */
export default function CongratulationPage({ data }: CongratulationPageProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Stop confetti after 4 seconds (two bursts of confetti)
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Confetti Animation - Two bursts from top corners */}
      {showConfetti && <Confetti duration={10000} particleCount={500} />}

      {/* Background Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-20">
        <div className="max-w-4xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center space-y-8"
          >
            {/* Sparkle Icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl" />
                <div className="relative w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center">
                  <Sparkles className="text-accent" size={40} />
                </div>
              </div>
            </motion.div>

            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="space-y-4"
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white">
                Congratulations!
              </h1>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-medium text-accent">
                {data.name}
              </h2>
            </motion.div>

            {/* Profile Picture */}
            {data.imageUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex justify-center"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl scale-110" />
                  <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-accent/30">
                    <ImageWithFallback
                      src={data.imageUrl}
                      alt={data.name}
                      width={256}
                      height={256}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Message */}
            {data.message && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="max-w-2xl mx-auto"
              >
                <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8">
                  <p className="text-lg md:text-xl text-foreground/90 leading-relaxed">
                    {data.message}
                  </p>
                </div>
              </motion.div>
            )}

            {/* LinkedIn Post Link */}
            {data.postUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                <a
                  href={data.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded-lg text-accent transition-all hover:scale-105"
                >
                  <span>View LinkedIn Post</span>
                  <ExternalLink size={18} />
                </a>
              </motion.div>
            )}

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="pt-12"
            >
              <div className="inline-block bg-card/30 backdrop-blur-sm border border-border rounded-full px-6 py-3">
                <p className="text-sm text-muted-foreground">
                  Generated by{" "}
                  <a
                    href="https://ziadhatem.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline font-medium"
                  >
                    Ziad Hatem
                  </a>{" "}
                  — Frontend Developer
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading State Component
 */
export function CongratulationPageLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin text-accent mx-auto" size={48} />
        <p className="text-muted-foreground">Loading congratulations...</p>
      </div>
    </div>
  );
}

/**
 * Error State Component
 */
export function CongratulationPageError({ error }: { error?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertCircle className="text-red-400" size={40} />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-medium text-white">Page Not Found</h1>
          <p className="text-muted-foreground">
            {error ||
              "This congratulations page doesn't exist or has been removed."}
          </p>
        </div>
        <a
          href="https://ziadhatem.dev"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
        >
          Go to Portfolio
        </a>
      </div>
    </div>
  );
}
