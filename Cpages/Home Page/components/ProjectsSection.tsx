"use client";

import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { useRef, useState, useEffect } from "react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";

const ProjectsSection = () => {
  const swiperRef = useRef<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const featuredProjects = [
    {
      id: "jic",
      title: "Jeddah International College (JIC)",
      description:
        "Led the front-end development of a comprehensive college website, collaborating with an exceptional team to deliver a modern and user-friendly experience.",
      image:
        "https://images.unsplash.com/photo-1706016899218-ebe36844f70e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYyMTg0MDY3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      tags: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
      workContext: "Brackets Technology",
    },
    {
      id: "saudi-banks",
      title: "Saudi Banks",
      description:
        "Developed a sophisticated banking platform with secure authentication, real-time data processing, and responsive design for optimal user experience.",
      image:
        "https://images.unsplash.com/photo-1709573360368-f53739b241f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW5raW5nJTIwZmluYW5jZSUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzYyMjM2MjQ3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      tags: ["React", "Redux", "REST API", "Material UI"],
      workContext: "Brackets Technology",
    },
    {
      id: "sand-fun",
      title: "Sand & Fun",
      description:
        "Created an engaging entertainment venue website with interactive booking system, event management, and seamless user navigation.",
      image:
        "https://images.unsplash.com/photo-1759332460392-3ace26a745a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbXVzZW1lbnQlMjBwYXJrJTIwcmlkZXN8ZW58MXx8fHwxNzYyMTY3NjQ5fDA&ixlib=rb-4.1.0&q=80&w=1080",
      tags: ["Next.js", "TypeScript", "Prisma", "Tailwind CSS"],
      workContext: "Freelance",
    },
  ];

  return (
    <section className="py-20 bg-muted/30 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-12 lg:gap-16">
          {/* Left Side - Header */}
          <div className="w-full lg:w-2/5 flex flex-col">
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
              data-aos="fade-right"
            >
              Featured Projects
            </h2>
            <p
              className="text-lg text-muted-foreground mb-8"
              data-aos="fade-right"
              data-aos-delay="100"
            >
              Explore some of my recent work spanning web development, banking
              platforms, and entertainment venues. Each project showcases modern
              technologies and best practices in software development.
            </p>

            {/* Navigation Arrows */}
            <div
              className="flex items-center gap-4 mb-8"
              data-aos="fade-right"
              data-aos-delay="200"
            >
              <button
                onClick={() => swiperRef.current?.slidePrev()}
                disabled={isBeginning}
                className="inline-flex items-center justify-center w-12 h-12 bg-accent/70 hover:bg-accent/90 cursor-pointer rounded-xl transition-all group disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-accent/50"
                aria-label="Previous slide"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
              <button
                onClick={() => swiperRef.current?.slideNext()}
                disabled={isEnd}
                className="inline-flex items-center justify-center w-12 h-12 bg-accent/70 hover:bg-accent/90 cursor-pointer rounded-xl transition-all group disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-accent/50"
                aria-label="Next slide"
              >
                <ArrowRight size={20} className="text-white" />
              </button>
            </div>

            {/* View All Link */}
            <div className="" data-aos="fade-right" data-aos-delay="300">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 text-accent hover:gap-3 transition-all text-lg font-medium"
              >
                <span>View All Projects</span>
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>

          {/* Right Side - Projects Swiper */}
          <div
            className="w-full lg:w-3/5 max-w-[600px] "
            data-aos="fade-left"
            data-aos-delay="100"
          >
            <Swiper
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
                setIsBeginning(swiper.isBeginning);
                setIsEnd(swiper.isEnd);
              }}
              onSlideChange={(swiper) => {
                setIsBeginning(swiper.isBeginning);
                setIsEnd(swiper.isEnd);
              }}
              modules={[Navigation]}
              spaceBetween={32}
              slidesPerView={1}
              className="pb-4!"
            >
              {featuredProjects.map((project) => (
                <SwiperSlide key={project.id}>
                  <div
                    className="bg-background rounded-lg overflow-hidden h-full"
                    data-aos="zoom-in"
                  >
                    <div className="relative h-64 sm:h-80 w-full">
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-6 flex flex-col">
                      <div className="mb-2">
                        <span className="text-xs text-accent font-medium">
                          {project.workContext}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-3">
                        {project.title}
                      </h3>
                      <p className="text-base text-muted-foreground mb-4">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {project.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-accent/10 text-accent text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
