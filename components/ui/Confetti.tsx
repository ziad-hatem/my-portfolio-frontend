"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface ConfettiProps {
  duration?: number;
  particleCount?: number;
}

/**
 * Confetti Animation Component
 * Fires confetti from top-left and top-right corners in two bursts
 */
export default function Confetti({
  duration = 3000,
  particleCount = 150,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const confettiInstance = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });

    // Portfolio accent colors
    const colors = [
      "#00F5C0",
      "#00D9A8",
      "#66FFDD",
      "#FFFFFF",
      "#4FFFDF",
      "#00E0B0",
    ];

    // Fire confetti from a specific corner
    const fireFromCorner = async (x: number) => {
      await confettiInstance({
        particleCount: particleCount / 2,
        angle: x === 0 ? 60 : 120, // Wider angles for better coverage
        spread: 150, // Increased spread for full width coverage
        origin: { x, y: 0 },
        colors,
        ticks: 200,
        gravity: 1,
        decay: 0.94,
        startVelocity: 35,
        scalar: 1.2,
      });
    };

    // First burst: top-left and top-right simultaneously
    const fireBurst = async () => {
      await Promise.all([
        fireFromCorner(0), // Far left edge
        fireFromCorner(1), // Far right edge
      ]);
    };

    // Fire first burst immediately
    fireBurst();

    // Fire second burst after 800ms
    const timer = setTimeout(() => {
      fireBurst();
    }, 8000);

    // Cleanup
    return () => {
      clearTimeout(timer);
      confettiInstance.reset();
    };
  }, [duration, particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
