"use client";

import { useMemo } from "react";
import { useAos } from "@/hooks/useAos";
// import { useAos } from "@/hooks/useAos";
import useLenisScroll from "@/hooks/useLenis";

export default function ClientEffects() {
  const aosSettings = useMemo(
    () => ({
      once: true,
      duration: 700,
    }),
    []
  );

  // Initialize AOS once
  //   useAos({ once: true, duration: 700 });

  // Initialize Lenis once
  useLenisScroll();
  useAos(aosSettings);

  // Render nothing; this component is only for side-effects
  return null;
}
