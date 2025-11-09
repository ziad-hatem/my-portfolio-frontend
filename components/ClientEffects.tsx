"use client";

import { useAos } from "@/hooks/useAos";
// import { useAos } from "@/hooks/useAos";
import useLenisScroll from "@/hooks/useLenis";

export default function ClientEffects() {
  // Initialize AOS once
  //   useAos({ once: true, duration: 700 });

  // Initialize Lenis once
  useLenisScroll();
  useAos({ once: true, duration: 700 });

  // Render nothing; this component is only for side-effects
  return null;
}
