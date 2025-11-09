"use client";
import React from "react";
import Link from "next/link";
import { LinkedinIcon, Github } from "lucide-react";
import Threads from "../ui/Threads";
import RotatingText from "../ui/RotatingText";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background h-[50vh] relative">
      <div className="absolute top-0 left-0 w-full h-full">
        <Threads amplitude={2} distance={0} enableMouseInteraction={false} />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-20 flex flex-col justify-between h-full">
        <div className="flex-1 flex flex-col gap-2 justify-center">
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="flex gap-2 md:gap-4 items-center flex-wrap">
              Let's Get In Touch and Bring
              <span className="w-full flex items-center gap-4">
                Your
                <RotatingText
                  texts={["Brilliant", "Cool", "Inspiring", "Creative"]}
                  mainClassName="px-2 sm:px-2 md:px-3 bg-[#00F3BE] text-[#19192E] overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg w-fit"
                  staggerFrom="last"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-120%" }}
                  staggerDuration={0.025}
                  splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  rotationInterval={2000}
                />
              </span>
              Idea to Life.
            </span>
          </h1>
        </div>

        {/* Social Links & Info Section */}
        <div className="mt-auto pt-8">
          <div className="flex flex-row flex-wrap items-center justify-between gap-6 md:gap-8 rounded-2xl py-5 w-full transition-all duration-300">
            {/* Social Links */}
            <div className="flex max-md:flex-col max-md:items-start items-center gap-4 md:gap-6 flex-wrap justify-center md:justify-start">
              <Link
                href="https://linkedin.com/in/ziadhatem"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-muted-foreground hover:text-[#00F3BE] transition-all duration-300 relative"
              >
                <span className="relative">
                  <LinkedinIcon
                    size={20}
                    className="group-hover:scale-110 transition-transform duration-300"
                  />
                  <span className="absolute inset-0 blur-md bg-[#00F3BE] opacity-0 group-hover:opacity-50 transition-opacity duration-300"></span>
                </span>
                <span className="font-medium text-xl md:text-2xl">
                  LinkedIn
                </span>
              </Link>
              <Link
                href="https://github.com/ziadhatem"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-muted-foreground hover:text-[#00F3BE] transition-all duration-300 relative"
              >
                <span className="relative">
                  <Github
                    size={20}
                    className="group-hover:scale-110 transition-transform duration-300"
                  />
                  <span className="absolute inset-0 blur-md bg-[#00F3BE] opacity-0 group-hover:opacity-50 transition-opacity duration-300"></span>
                </span>
                <span className="font-medium text-xl md:text-2xl">Github</span>
              </Link>
            </div>

            {/* Email & Copyright */}
            <div className="flex flex-col md:flex-row items-center max-w-xs:mx-auto gap-3 md:gap-6 text-muted-foreground">
              <Link
                href="mailto:contact@ziadhatem.dev"
                className="hover:text-[#00F3BE] transition-colors duration-300 font-medium text-xl md:text-2xl"
              >
                contact@ziadhatem.dev
              </Link>
              <span className="text-xl md:text-2xl opacity-70">
                © 2025 Ziad Hatem
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
