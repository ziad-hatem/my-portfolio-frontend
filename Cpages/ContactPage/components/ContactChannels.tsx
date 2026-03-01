"use client";

import { ArrowUpRight, Github, Globe, Linkedin, Mail } from "lucide-react";

export interface SocialLink {
  id: string;
  link: string;
  icon?: string;
}

interface ContactChannelsProps {
  socialLinks?: SocialLink[];
  emailAddress?: string;
}

const DEFAULT_EMAIL = "contact@ziadhatem.dev";

export function ContactChannels({
  socialLinks,
  emailAddress,
}: ContactChannelsProps) {
  const email = emailAddress || DEFAULT_EMAIL;

  return (
    <article
      className="rounded-2xl border border-border/80 bg-card/80 p-5"
      data-aos="fade-up"
      data-aos-delay="80"
    >
      <h2 className="text-xl text-foreground mb-2">Direct Channels</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Reach out through any of these channels if you prefer.
      </p>

      <div className="space-y-3">
        <a
          href={`mailto:${email}`}
          className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/55 px-4 py-3 hover:border-accent/60 transition-colors"
          aria-label={`Send email to ${email}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Mail size={18} className="text-accent shrink-0" />
            </div>
            <div>
              <p className="text-foreground text-sm">Email</p>
              <p className="text-xs text-muted-foreground break-all">{email}</p>
            </div>
          </div>
          <ArrowUpRight
            size={16}
            className="text-muted-foreground group-hover:text-accent transition-colors shrink-0"
          />
        </a>

        {socialLinks && socialLinks.length > 0 ? (
          socialLinks.map((social) => {
            // Try to infer a nice title from the URL if not provided by CMS directly
            let platformName = "Social Profile";
            if (social.link?.includes("linkedin.com"))
              platformName = "LinkedIn";
            if (social.link?.includes("github.com")) platformName = "GitHub";

            return (
              <a
                key={social.id}
                href={social.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/55 px-4 py-3 hover:border-accent/60 transition-colors shrink-0"
                aria-label={`Visit ${platformName} profile`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    {social.icon ? (
                      <img
                        src={social.icon}
                        alt={platformName}
                        className="w-5 h-5 object-contain"
                      />
                    ) : platformName === "LinkedIn" ? (
                      <Linkedin size={18} className="text-accent shrink-0" />
                    ) : platformName === "GitHub" ? (
                      <Github size={18} className="text-accent shrink-0" />
                    ) : (
                      <Globe size={18} className="text-accent shrink-0" />
                    )}
                  </div>
                  <div>
                    <p className="text-foreground text-sm">{platformName}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {social.link
                        ? social.link
                            .replace(/^https?:\/\/(www\.)?/, "")
                            .replace(/\/$/, "")
                        : "Profile Link"}
                    </p>
                  </div>
                </div>
                <ArrowUpRight
                  size={16}
                  className="text-muted-foreground group-hover:text-accent transition-colors shrink-0"
                />
              </a>
            );
          })
        ) : (
          // Fallback if CMS social links are missing
          <>
            <a
              href="https://www.linkedin.com/in/ziadhatem2026/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/55 px-4 py-3 hover:border-accent/60 transition-colors"
              aria-label="Visit LinkedIn profile"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Linkedin size={18} className="text-accent shrink-0" />
                </div>
                <div>
                  <p className="text-foreground text-sm">LinkedIn</p>
                  <p className="text-xs text-muted-foreground">
                    in/ziadhatem2026
                  </p>
                </div>
              </div>
              <ArrowUpRight
                size={16}
                className="text-muted-foreground group-hover:text-accent transition-colors shrink-0"
              />
            </a>

            <a
              href="https://github.com/ziad-hatem"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/55 px-4 py-3 hover:border-accent/60 transition-colors"
              aria-label="Visit GitHub profile"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Github size={18} className="text-accent shrink-0" />
                </div>
                <div>
                  <p className="text-foreground text-sm">GitHub</p>
                  <p className="text-xs text-muted-foreground">
                    github.com/ziad-hatem
                  </p>
                </div>
              </div>
              <ArrowUpRight
                size={16}
                className="text-muted-foreground group-hover:text-accent transition-colors shrink-0"
              />
            </a>
          </>
        )}
      </div>
    </article>
  );
}
