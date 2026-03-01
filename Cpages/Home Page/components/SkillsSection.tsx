"use client";

import LogoLoop from "@/components/ui/LogoLoop";
import React from "react";
import Image from "next/image";
import { sanitizeHtml } from "@/utils/sanitize";

interface SkillsSectionProps {
  data: {
    title: string;
    description: string;
    skills: Array<{
      id: string;
      skill_name: string;
      skill_link: string;
      skill_image: string;
    }>;
  };
}

export default function SkillsSection({ data }: SkillsSectionProps) {
  const logos = (data.skills || []).map((skill) => ({
    node: (
      <Image
        src={skill.skill_image || "/logo.png"}
        alt={skill.skill_name}
        width={56}
        height={56}
        className="object-contain"
      />
    ),
    title: skill.skill_name,
    href: skill.skill_link || "#",
  }));

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2
            className="text-4xl md:text-6xl font-bold text-foreground mb-4"
            data-aos="fade-up"
          >
            {data.title || "Core Technologies"}
          </h2>
          <p
            className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto"
            data-aos="fade-up"
            data-aos-delay="100"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(data.description || ""),
            }}
          />
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/70 p-4 md:p-6 overflow-hidden">
          <LogoLoop
            logos={logos}
            speed={120}
            direction="left"
            logoHeight={56}
            gap={36}
            pauseOnHover
            scaleOnHover
            fadeOut
            fadeOutColor="#19192E"
            ariaLabel="Core technologies"
          />
        </div>
      </div>
    </section>
  );
}
