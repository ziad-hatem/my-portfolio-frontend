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

interface ProjectsSectionProps {
  data: {
    title: string;
    description: string;
    featured_projects: Array<{
      title: string;
      project_image: string;
      project_name: string;
      project_description: string;
      company_name: string;
      project_link: string;
      project_overview: string;
      skills: Array<{
        skill_name: string;
      }>;
    }>;
  };
}

const ProjectsSection = ({ data }: ProjectsSectionProps) => {
  const swiperRef = useRef<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const featuredProjects = data.featured_projects;

  return (
    <section className="py-20 bg-muted/30 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-12 lg:gap-16">
          {/* Left Side - Header */}
          <div className="w-full lg:w-2/5 flex flex-col">
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
              data-aos="fade-up"
            >
              {data.title || ""}
            </h2>
            <p
              className="text-lg text-muted-foreground mb-8"
              data-aos="fade-up"
              data-aos-delay="100"
              dangerouslySetInnerHTML={{ __html: data.description }}
            ></p>

            {/* Navigation Arrows */}
            <div
              className="flex items-center gap-4 mb-8"
              data-aos="fade-up"
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
            <div className="" data-aos="fade-up" data-aos-delay="300">
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
            data-aos="fade-up"
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
              {featuredProjects.map((project, index) => (
                <SwiperSlide key={index}>
                  <Link href={project.project_link}>
                    <div
                      className="bg-background rounded-lg overflow-hidden h-full"
                      data-aos="fade-up"
                    >
                      <div className="relative h-64 sm:h-80 w-full">
                        <Image
                          src={project.project_image}
                          alt={project.project_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-6 flex flex-col">
                        <div className="mb-2">
                          <span className="text-xs text-accent font-medium">
                            {project.company_name}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                          {project.project_name}
                        </h3>
                        <p
                          className="text-base text-muted-foreground mb-4"
                          dangerouslySetInnerHTML={{
                            __html: project.project_description,
                          }}
                        ></p>
                        <div className="flex flex-wrap gap-2 mt-auto">
                          {project.skills.map((skill, skillIndex) => (
                            <span
                              key={skillIndex}
                              className="px-3 py-1 bg-accent/10 text-accent text-xs rounded-full"
                            >
                              {skill.skill_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
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
