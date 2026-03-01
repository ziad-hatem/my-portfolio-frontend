"use client";

import React from "react";
import { Clock3, MessageSquareText, Sparkles } from "lucide-react";
import { ContactChannels, SocialLink } from "./components/ContactChannels";
import { ContactForm } from "./components/ContactForm";

interface ContactPageProps {
  socialLinks?: SocialLink[];
}

export function ContactPage({ socialLinks }: ContactPageProps) {
  return (
    <div className="relative min-h-screen pb-12 pt-[150px]! overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(0,245,192,0.16),transparent_40%),radial-gradient(circle_at_90%_5%,rgba(59,130,246,0.12),transparent_36%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section
          className="rounded-3xl border border-border/80 bg-card/70 p-6 md:p-10 mb-8"
          data-aos="fade-up"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-xs text-accent mb-4 uppercase tracking-[0.18em]">
            <Sparkles size={12} aria-hidden="true" />
            Contact
          </div>

          <h1 className="text-4xl md:text-5xl text-foreground leading-tight mb-4">
            Let&apos;s build something meaningful together
          </h1>

          <p className="text-muted-foreground max-w-3xl mb-6">
            Share your goals, timeline, and vision. I usually respond within one
            business day with clear next steps.
          </p>

          <div className="flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-muted-foreground">
              <Clock3 size={12} aria-hidden="true" />
              Typical response: 24 hours
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-muted-foreground">
              <MessageSquareText size={12} aria-hidden="true" />
              Project inquiries and collaborations
            </span>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-5 space-y-4">
            <ContactChannels socialLinks={socialLinks} />
          </aside>

          <ContactForm />
        </div>
      </div>
    </div>
  );
}
