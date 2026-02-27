"use client";
import AOS from "aos";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

interface AosSettings {
  offset_lg?: number;
  duration?: number;
  once?: boolean;
  mirror?: boolean;
  disable?: "phone" | "mobile" | "tablet";
  anchorPlacement?:
    | "top-bottom"
    | "top-center"
    | "top-top"
    | "center-bottom"
    | "center-center"
    | "center-top"
    | "bottom-bottom"
    | "bottom-center"
    | "bottom-top";
}

export const useAos = (settings?: AosSettings) => {
  const pathname = usePathname();
  const initializedRef = useRef(false);
  const settingsRef = useRef<AosSettings | undefined>(settings);

  settingsRef.current = settings;

  useEffect(() => {
    const initTimeout = window.setTimeout(() => {
      const currentSettings = settingsRef.current;
      const isSmallScreen = window.innerWidth <= 768;
      const offsetValue = isSmallScreen ? 50 : currentSettings?.offset_lg || 100;

      AOS.init({
        offset: offsetValue,
        disable: currentSettings?.disable,
        duration: currentSettings?.duration ?? 1000,
        once: currentSettings?.once ?? true,
        mirror: currentSettings?.mirror ?? false,
        anchorPlacement: currentSettings?.anchorPlacement ?? "top-bottom",
        easing: "ease-out-cubic",
      });

      initializedRef.current = true;
      AOS.refreshHard();
    }, 180);

    return () => {
      window.clearTimeout(initTimeout);
    };
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }

    const refreshTimeout = window.setTimeout(() => {
      AOS.refreshHard();
    }, 120);

    return () => {
      window.clearTimeout(refreshTimeout);
    };
  }, [pathname]);
};
