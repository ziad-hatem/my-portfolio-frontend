"use client";

import Link from "next/link";
import { LinkedinIcon, GithubIcon, ArrowRight } from "lucide-react";

import { BackgroundBeams } from "@/components/ui/background-beams";

const Hero = () => {
  return (
    <div className="relative ">
      <div className="w-full h-full absolute">
        <BackgroundBeams />
      </div>
      <section className="relative min-h-[65vh] flex items-center justify-center overflow-hidden z-10 py-[5vh] pt-[150px]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl text-foreground mb-6 font-bold tracking-tight">
                Ziad Hatem
              </h1>
              <div className="text-2xl md:text-4xl lg:text-5xl text-accent mb-8 font-light">
                Frontend Developer
              </div>
            </div>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Front-end developer skilled in React, Next.js, TypeScript,
              Tailwind CSS and Redux, turning complex requirements into fast,
              user-centric web apps. I thrive in collaborative environments and
              stay ahead of industry trends to deliver cutting-edge solutions.
            </p>

            <div className="flex flex-wrap justify-center gap-6 pt-4">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 text-accent hover:gap-3 transition-all text-lg font-medium"
              >
                View My Projects
                <ArrowRight size={20} />
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-accent hover:gap-3 transition-all text-lg font-medium"
              >
                Contact Me
                <ArrowRight size={20} />
              </Link>
            </div>

            <div className="flex items-center justify-center gap-8 pt-4">
              <a
                href="https://linkedin.com/in/ziadhatem"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-colors hover:scale-110 transform duration-200"
              >
                <LinkedinIcon size={28} />
              </a>
              <a
                href="https://github.com/ziadhatem"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-colors hover:scale-110 transform duration-200"
              >
                <GithubIcon size={28} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
