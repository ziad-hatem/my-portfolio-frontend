"use client";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const Hero = ({ data }: any) => {
  return (
    <div className="relative">
      <div className="w-full h-full absolute">
        <BackgroundBeams />
      </div>
      <section className="relative min-h-[65vh] flex items-center justify-center overflow-hidden z-10 py-[5vh] pt-[150px]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div>
              <h1
                className="text-5xl md:text-7xl lg:text-8xl text-foreground mb-6 font-bold tracking-tight"
                data-aos="fade-up"
              >
                {data?.name || "Ziad Hatem"}
              </h1>
              <div
                className="text-2xl md:text-4xl lg:text-5xl text-accent mb-8 font-light"
                data-aos="fade-up"
                data-aos-delay="100"
              >
                {data?.role || "Frontend Developer"}
              </div>
            </div>

            <div
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              data-aos="fade-up"
              data-aos-delay="200"
              dangerouslySetInnerHTML={{
                __html:
                  data?.description ||
                  "<p>Front-end developer skilled in React, Next.js, TypeScript, Tailwind CSS and Redux, turning complex requirements into fast, user-centric web apps. I thrive in collaborative environments and stay ahead of industry trends to deliver cutting-edge solutions.</p>",
              }}
            />

            {data?.buttons && data.buttons.length > 0 && (
              <div
                className="flex flex-wrap justify-center gap-6 pt-4"
                data-aos="fade-up"
                data-aos-delay="300"
              >
                {data.buttons.map((button: any) => (
                  <Link
                    key={button.id}
                    href={button.link || "#"}
                    className="inline-flex items-center gap-2 text-accent hover:gap-3 transition-all text-lg font-medium"
                  >
                    {button.text}
                    <ArrowRight size={20} />
                  </Link>
                ))}
              </div>
            )}

            {data?.social_links && data.social_links.length > 0 && (
              <div
                className="flex items-center justify-center gap-8 pt-4"
                data-aos="fade-up"
                data-aos-delay="400"
              >
                {data.social_links.map((social: any) => (
                  <a
                    key={social.id}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-accent transition-colors hover:scale-110 transform duration-200"
                  >
                    {social.icon && (
                      <img
                        src={social.icon}
                        alt="Social Icon"
                        className="w-7 h-7"
                      />
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
