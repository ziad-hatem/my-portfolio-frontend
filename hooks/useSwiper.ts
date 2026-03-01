"use client";

import { useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";

/**
 * Shared hook for custom Swiper navigation.
 * Provides swiperRef, navigation state (isBeginning/isEnd), and a sync callback.
 */
export function useSwiper() {
  const swiperRef = useRef<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const syncNavigationState = (swiper: SwiperType) => {
    const locked = swiper.isLocked;
    setIsBeginning(locked || swiper.isBeginning);
    setIsEnd(locked || swiper.isEnd);
  };

  return { swiperRef, isBeginning, isEnd, syncNavigationState };
}
