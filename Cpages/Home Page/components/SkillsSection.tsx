import LogoLoop from "@/components/ui/LogoLoop";
import React from "react";

import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
} from "react-icons/si";

const techLogos = [
  { node: <SiReact />, title: "React", href: "https://react.dev" },
  { node: <SiNextdotjs />, title: "Next.js", href: "https://nextjs.org" },
  {
    node: <SiTypescript />,
    title: "TypeScript",
    href: "https://www.typescriptlang.org",
  },
  {
    node: <SiTailwindcss />,
    title: "Tailwind CSS",
    href: "https://tailwindcss.com",
  },
];

export default function SkillsSection() {
  return (
    <section className="py-20">
      <div className="w-full">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Core Technologies
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            My professional journey in software development
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
