"use client";
import AOS from "aos";
import { useEffect } from "react";

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
  useEffect(() => {
    const isSmallScreen = window.innerWidth <= 768; // Adjust breakpoint as needed
    const offsetValue = isSmallScreen ? 50 : settings?.offset_lg || 100; // 50 for small screens, 250 for larger screens

    AOS.init({
      offset: offsetValue,
      disable: settings?.disable,
      duration: settings?.duration || 1000,
      once: settings?.once || true,
      mirror: settings?.mirror || false,
      anchorPlacement: settings?.anchorPlacement || "top-bottom",
      easing: "ease-out-cubic",
    });

    // Refresh AOS after initialization to ensure elements are detected
    // Use setTimeout to ensure DOM is fully rendered
    const refreshTimeout = setTimeout(() => {
      AOS.refresh();
    }, 100);

    return () => {
      clearTimeout(refreshTimeout);
      AOS.refresh();
    };
  }, [settings]);
};
