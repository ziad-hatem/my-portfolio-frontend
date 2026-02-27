"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/content/home", label: "Home" },
  { href: "/admin/content/projects", label: "Projects" },
  { href: "/admin/content/posts", label: "Posts" },
  { href: "/admin/content/tools", label: "Tools SEO" },
];

export default function AdminContentNav() {
  const pathname = usePathname();

  return (
    <nav className="rounded-xl border border-border/80 bg-background/60 p-1 inline-flex flex-wrap gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "px-3 py-2 rounded-lg text-sm transition-all",
              active
                ? "bg-accent text-accent-foreground shadow-[0_10px_22px_-16px_rgba(0,245,192,0.8)]"
                : "text-muted-foreground hover:text-foreground hover:bg-card/80",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
