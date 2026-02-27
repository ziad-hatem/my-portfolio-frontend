"use client";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface HeroButton {
  id: string;
  text: string;
  link: string;
  fill_background?: boolean;
}

interface HeroSocial {
  id: string;
  icon: string;
  link: string;
}

interface HeroStat {
  label: string;
  value: string;
}

interface HeroProps {
  data: {
    name: string;
    role: string;
    description: string;
    buttons: HeroButton[];
    social_links: HeroSocial[];
    stats: HeroStat[];
  };
}

const Hero = ({ data }: HeroProps) => {
  return (
    <div className="relative">
      <div className="w-full h-full absolute inset-0">
        <BackgroundBeams />
      </div>

      <section className="relative min-h-[78vh] z-10 pt-[150px] pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8 lg:gap-10 items-end">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-accent mb-6">
              <Sparkles size={12} aria-hidden="true" />
              Available for new projects
            </div>

            <h1
              className="text-5xl md:text-7xl lg:text-8xl text-foreground mb-4 font-bold tracking-tight leading-[0.95]"
              data-aos="fade-up"
            >
              {data?.name || "Ziad Hatem"}
            </h1>

            <p
              className="text-2xl md:text-4xl lg:text-5xl text-accent mb-6 font-light"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              {data?.role || "Frontend Developer"}
            </p>

            <div
              className="text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed mb-8"
              data-aos="fade-up"
              data-aos-delay="200"
              dangerouslySetInnerHTML={{
                __html: data?.description || "Building performant, scalable web experiences.",
              }}
            />

            {data?.buttons && data.buttons.length > 0 ? (
              <div
                className="flex flex-wrap items-center gap-3"
                data-aos="fade-up"
                data-aos-delay="300"
              >
                {data.buttons.map((button) => (
                  <Link
                    key={button.id}
                    href={button.link || "#"}
                    className={[
                      "inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all",
                      button.fill_background
                        ? "bg-accent text-accent-foreground hover:bg-accent/90"
                        : "border border-border bg-card/60 text-foreground hover:border-accent/70",
                    ].join(" ")}
                  >
                    {button.text}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            ) : null}

            {data?.social_links && data.social_links.length > 0 ? (
              <div
                className="flex items-center flex-wrap gap-3 pt-7"
                data-aos="fade-up"
                data-aos-delay="400"
              >
                {data.social_links.map((social) => (
                  <a
                    key={social.id}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-xl border border-border/80 bg-card/70 flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent/70 transition-all"
                    aria-label="Social profile"
                  >
                    {social.icon ? (
                      <img
                        src={social.icon}
                        alt="Social icon"
                        className="w-5 h-5 object-contain"
                      />
                    ) : (
                      <span className="text-sm font-semibold">S</span>
                    )}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-4" data-aos="fade-up" data-aos-delay="250">
            <article className="rounded-2xl border border-border/80 bg-card/80 p-5 lg:p-6 backdrop-blur-sm shadow-[0_20px_45px_-36px_rgba(0,245,192,0.6)]">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-4">
                Snapshot
              </p>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {(data?.stats || []).map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-border/70 bg-background/60 p-3 text-center"
                  >
                    <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Focused on clean UI architecture, reliable APIs, and production-ready performance.
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
