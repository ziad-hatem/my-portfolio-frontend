"use client";

import { ReactNode } from "react";

interface AdminSplitLayoutProps {
  left: ReactNode;
  right: ReactNode;
  leftClassName?: string;
  rightClassName?: string;
}

export default function AdminSplitLayout({
  left,
  right,
  leftClassName,
  rightClassName,
}: AdminSplitLayoutProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <section className={["lg:col-span-5", leftClassName || ""].join(" ")}>{left}</section>
      <section className={["lg:col-span-7", rightClassName || ""].join(" ")}>{right}</section>
    </div>
  );
}
