import React, { useEffect, useRef } from "react";
import { Briefcase } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ExperienceSectionProps {
  data: {
    title: string;
    description: string;
    experiences: Array<{
      id: string;
      company_name: string;
      job_title: string;
      job_description: string;
      from: string;
      to: string;
      present: boolean;
    }>;
  };
}

export default function ExperienceSection({ data }: ExperienceSectionProps) {
  const timelineRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Only animate the timeline stick
      gsap.from(timelineRef.current, {
        scrollTrigger: {
          trigger: timelineRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
        scaleY: 0,
        transformOrigin: "top",
        duration: 1.5,
        ease: "power2.out",
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-20 px-4">
          <div className="max-w-5xl w-full">
            {/* Header */}
            <div className="text-center mb-20">
              <h2
                className="text-4xl md:text-6xl font-bold text-foreground mb-4"
                data-aos="fade-up"
              >
                {data.title || "Experience"}
              </h2>
              <p
                className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto"
                data-aos="fade-up"
                data-aos-delay="100"
                dangerouslySetInnerHTML={{ __html: data.description }}
              ></p>
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Animated timeline stick - left on mobile, centered on desktop */}
              <div
                ref={timelineRef}
                className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-accent via-accent to-accent/20"
              />

              {/* Experience items */}
              <div className="space-y-12 md:space-y-24">
                {data.experiences.map((exp, index) => (
                  <div
                    key={exp.id}
                    className={`relative flex items-center ${
                      index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                  >
                    {/* Content card */}
                    <div
                      className={`w-full md:w-[calc(50%-2rem)] pl-12 md:pl-0 ${
                        index % 2 === 0
                          ? "md:pr-8 md:text-right"
                          : "md:pl-8 md:text-left"
                      }`}
                      data-aos="fade-up"
                      data-aos-delay={index * 100}
                    >
                      <div className="bg-card border border-border rounded-lg p-4 md:p-6 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 hover:scale-105">
                        <div className="flex items-start md:items-center gap-3 mb-3 flex-col md:flex-row md:justify-end">
                          <div className="flex items-center gap-3 w-full md:w-auto">
                            <Briefcase
                              className="text-accent flex-shrink-0"
                              size={20}
                            />
                            <div className="flex-1 md:flex-none">
                              <h3 className="text-foreground font-bold text-lg md:text-2xl">
                                {exp.job_title}
                              </h3>
                              <p className="text-accent font-semibold text-base md:text-lg">
                                {exp.company_name}
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-xs md:text-base mb-3 md:mb-4">
                          {exp.from} - {exp.present ? "Present" : exp.to}
                        </p>
                        <p
                          className="text-muted-foreground leading-relaxed text-sm md:text-base"
                          dangerouslySetInnerHTML={{
                            __html: exp.job_description,
                          }}
                        ></p>
                      </div>
                    </div>

                    {/* Timeline dot - left on mobile, center on desktop */}
                    <div className="absolute left-[0.9375rem] md:left-1/2 -translate-x-1/2 w-4 h-4 md:w-6 md:h-6 rounded-full bg-accent border-2 md:border-4 border-background shadow-lg shadow-accent/50 z-10" />

                    {/* Empty space for alternating layout on desktop */}
                    <div className="hidden md:block md:w-[calc(50%-2rem)]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
