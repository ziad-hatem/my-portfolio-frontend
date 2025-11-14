import LogoLoop from "@/components/ui/LogoLoop";
import React from "react";
import Image from "next/image";

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
  const techLogos = data.skills.map((skill) => ({
    node: (
      <Image
        src={skill.skill_image}
        alt={skill.skill_name}
        width={60}
        height={60}
        className="object-contain"
      />
    ),
    title: skill.skill_name,
    href: skill.skill_link,
  }));
  return (
    <section className="py-20">
      <div className="w-full">
        <div className="text-center mb-20">
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
          >
            {data.description || "My professional journey in software development"}
          </p>
        </div>
        <div className="flex flex-wrap h-[100px]">
          <LogoLoop
            logos={techLogos}
            speed={120}
            direction="left"
            logoHeight={60}
            gap={40}
            pauseOnHover
            scaleOnHover
            fadeOut
            fadeOutColor="#19192E"
            ariaLabel="Technology partners"
          />
        </div>
      </div>
    </section>
  );
}
