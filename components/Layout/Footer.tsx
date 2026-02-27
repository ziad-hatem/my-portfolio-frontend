"use client";

import Link from "next/link";
import { ArrowUpRight, Github, Linkedin, Mail, Sparkles } from "lucide-react";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Posts", href: "/posts" },
  { label: "Tools", href: "/tools" },
  { label: "Contact", href: "/contact" },
];

const socialLinks = [
  { label: "GitHub", href: "https://github.com/ziad-hatem", icon: Github },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/ziadhatem2026",
    icon: Linkedin,
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-border/70 bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/75 to-transparent" />
        <div className="absolute -top-24 left-1/2 h-64 w-[46rem] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="rounded-3xl border border-border/70 bg-card/65 p-6 shadow-[0_25px_60px_-42px_rgba(0,243,190,0.55)] backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-accent">
                <Sparkles size={12} aria-hidden="true" />
                Ready for your next build
              </div>

              <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                Let&apos;s turn your next idea into a polished, production-ready product.
              </h2>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                I design and build fast, accessible interfaces with a clean engineering approach and reliable backend integration.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-all duration-300 hover:translate-y-[-1px] hover:bg-accent/90"
                >
                  Start a Project
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>

                <Link
                  href="mailto:contact@ziadhatem.dev"
                  className="inline-flex items-center gap-2 rounded-xl border border-border/75 bg-background/60 px-5 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-accent/45 hover:text-accent"
                >
                  <Mail size={16} aria-hidden="true" />
                  contact@ziadhatem.dev
                </Link>
              </div>
            </div>

            <div className="grid gap-10 sm:grid-cols-2 lg:col-span-6">
              <div>
                <p className="mb-4 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Navigation
                </p>

                <ul className="space-y-3">
                  {quickLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-300 hover:text-accent"
                      >
                        <ArrowUpRight size={14} aria-hidden="true" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-4 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  Connect
                </p>

                <ul className="space-y-3">
                  {socialLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-300 hover:text-accent"
                      >
                        <link.icon size={14} aria-hidden="true" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="mailto:contact@ziadhatem.dev"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-300 hover:text-accent"
                    >
                      <Mail size={14} aria-hidden="true" />
                      Email
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-border/70 pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>(c) {currentYear} Ziad Hatem. All rights reserved.</p>
            <p>Built with Next.js and a custom content API.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
