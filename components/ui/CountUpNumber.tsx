"use client";

import CountUp from "react-countup";

interface CountUpNumberProps {
  value: number;
  className?: string;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export function CountUpNumber({
  value,
  className,
  duration = 1,
  suffix = "",
  prefix = "",
  decimals = 0,
}: CountUpNumberProps) {
  const safeValue = Number.isFinite(value) ? value : 0;

  return (
    <span className={className}>
      <CountUp
        end={safeValue}
        duration={duration}
        suffix={suffix}
        prefix={prefix}
        decimals={decimals}
        separator=","
        enableScrollSpy
        scrollSpyOnce
      />
    </span>
  );
}
