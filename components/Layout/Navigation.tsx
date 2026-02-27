"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Github, Linkedin, Mail, Menu, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

const menuItems = [
  { label: "Home", link: "/" },
  { label: "Projects", link: "/projects" },
  { label: "Posts", link: "/posts" },
  { label: "Tools", link: "/tools" },
  { label: "Contact", link: "/contact" },
];

const socialItems = [
  { label: "GitHub", link: "https://github.com/ziad-hatem", icon: Github },
  {
    label: "LinkedIn",
    link: "https://www.linkedin.com/in/ziadhatem2026",
    icon: Linkedin,
  },
];

const isActivePath = (pathname: string, href: string) => {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
};

export function Navigation() {
  const pathname = usePathname() || "/";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Hide navigation on /tools and subpages if requested
  // "remove navbar from tools slug" implies /tools/*
  if (pathname.startsWith("/tools")) return null;

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[90] transition-all duration-300 ${isScrolled ? "pt-3" : "pt-5"}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={[
            "rounded-2xl border transition-all duration-300",
            "bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65",
            isScrolled
              ? "border-accent/40 shadow-[0_24px_50px_-35px_rgba(0,243,190,0.75)]"
              : "border-border/80 shadow-[0_12px_28px_-26px_rgba(0,0,0,0.8)]",
          ].join(" ")}
        >
          <div className="flex h-20 items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              className="group flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Go to home page"
            >
              <img
                src="/logo.png"
                alt="Ziad Hatem logo"
                className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                width={170}
                height={70}
              />
              <span className="hidden text-[11px] uppercase tracking-[0.22em] text-muted-foreground sm:inline-block">
                Portfolio
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
              {menuItems.map((item) => {
                const isActive = isActivePath(pathname, item.link);

                return (
                  <Link
                    key={item.label}
                    href={item.link}
                    className={[
                      "relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300",
                      isActive
                        ? "text-accent"
                        : "text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {isActive ? (
                      <span className="absolute inset-x-2 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
                    ) : null}
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-1 lg:flex">
                {socialItems.map((social) => (
                  <Link
                    key={social.label}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-card/50 text-muted-foreground transition-all duration-300 hover:border-accent/60 hover:text-accent"
                    aria-label={social.label}
                  >
                    <social.icon size={15} />
                  </Link>
                ))}
              </div>

              <Link
                href="/contact"
                className="hidden items-center gap-2 rounded-lg border border-accent/50 bg-accent/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent transition-all duration-300 hover:bg-accent hover:text-accent-foreground sm:inline-flex"
              >
                Let&apos;s Talk
                <ArrowUpRight size={14} />
              </Link>

              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-card/60 text-foreground transition-colors duration-300 hover:border-accent/50 hover:text-accent md:hidden"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-navigation-panel"
                onClick={() => setIsMenuOpen((current) => !current)}
              >
                {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div
          id="mobile-navigation-panel"
          className={`mt-2 overflow-hidden rounded-2xl border border-border/70 bg-card/90 backdrop-blur-xl transition-all duration-300 md:hidden ${isMenuOpen ? "max-h-[420px] opacity-100" : "pointer-events-none max-h-0 opacity-0"}`}
        >
          <div className="px-4 pb-5 pt-3">
            <nav className="grid gap-2" aria-label="Mobile navigation">
              {menuItems.map((item) => {
                const isActive = isActivePath(pathname, item.link);

                return (
                  <Link
                    key={item.label}
                    href={item.link}
                    className={[
                      "flex items-center justify-between rounded-xl border px-3 py-3 text-sm font-medium transition-all duration-300",
                      isActive
                        ? "border-accent/45 bg-accent/10 text-accent"
                        : "border-transparent bg-background/55 text-muted-foreground hover:border-border hover:text-foreground",
                    ].join(" ")}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                    <ArrowUpRight size={14} />
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 border-t border-border/70 pt-4">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-accent">
                <Sparkles size={12} />
                Open for new work
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {socialItems.map((social) => (
                    <Link
                      key={social.label}
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-background/60 text-muted-foreground transition-all duration-300 hover:border-accent/50 hover:text-accent"
                      aria-label={social.label}
                    >
                      <social.icon size={16} />
                    </Link>
                  ))}
                </div>

                <Link
                  href="mailto:contact@ziadhatem.dev"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-background/60 text-muted-foreground transition-all duration-300 hover:border-accent/50 hover:text-accent"
                  aria-label="Email Ziad Hatem"
                >
                  <Mail size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
