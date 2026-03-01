"use client";

import Link from "next/link";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { sanitizeHtml } from "@/utils/sanitize";
import { stripHtml } from "@/utils/stripHtml";
import { useSwiper } from "@/hooks/useSwiper";

import "swiper/css";
import "swiper/css/navigation";

interface ProjectsSectionProps {
  data: {
    title: string;
    description: string;
    featured_projects: Array<{
      id: string;
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
  const { swiperRef, isBeginning, isEnd, syncNavigationState } = useSwiper();
  const featuredProjects = data.featured_projects || [];
  const canSlide = featuredProjects.length > 1;

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(0,245,192,0.08),transparent_35%)]" />
      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent mb-4">
              <Sparkles size={12} aria-hidden="true" />
              Featured
            </div>

            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
              data-aos="fade-up"
            >
              {data.title || "Projects"}
            </h2>

            <p
              className="text-lg text-muted-foreground mb-8 leading-relaxed"
              data-aos="fade-up"
              data-aos-delay="100"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(data.description || ""),
              }}
            />

            <div
              className="flex items-center gap-3 mb-8"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <button
                onClick={() => swiperRef.current?.slidePrev()}
                disabled={isBeginning}
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-border bg-card/70 hover:border-accent/70 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous slide"
              >
                <ArrowLeft size={18} className="text-foreground" />
              </button>
              <button
                onClick={() => swiperRef.current?.slideNext()}
                disabled={isEnd}
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-border bg-card/70 hover:border-accent/70 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next slide"
              >
                <ArrowRight size={18} className="text-foreground" />
              </button>
            </div>

            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-accent hover:gap-3 transition-all text-base font-medium"
              data-aos="fade-up"
              data-aos-delay="260"
            >
              <span>View All Projects</span>
              <ArrowRight size={18} />
            </Link>
          </div>

          <div
            className="lg:col-span-8 min-w-0 overflow-hidden"
            data-aos="fade-up"
            data-aos-delay="120"
          >
            <Swiper
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
                syncNavigationState(swiper);
              }}
              onSlideChange={(swiper) => {
                syncNavigationState(swiper);
              }}
              onBreakpoint={(swiper) => {
                syncNavigationState(swiper);
              }}
              modules={[Navigation]}
              watchOverflow
              observer
              observeParents
              allowTouchMove={canSlide}
              touchStartPreventDefault={false}
              spaceBetween={14}
              slidesPerView={1.02}
              breakpoints={{
                640: {
                  slidesPerView: 1.08,
                  spaceBetween: 18,
                },
                900: {
                  slidesPerView: 1.15,
                  spaceBetween: 24,
                },
              }}
              className="w-full pb-5!"
            >
              {featuredProjects.map((project) => (
                <SwiperSlide key={project.id}>
                  <Link href={`/projects/${project.id}`}>
                    <article className="group rounded-2xl border border-border/80 bg-card/85 overflow-hidden transition-all hover:border-accent/50 h-full">
                      <div className="relative aspect-video w-full overflow-hidden bg-background">
                        <Image
                          src={project.project_image || "/cover.jpg"}
                          alt={project.project_name || project.title}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute inset-0 bg-linear-to-t from-background/70 via-background/10 to-transparent" />
                        <div className="absolute left-4 bottom-4 inline-flex rounded-full border border-border/70 bg-background/65 px-3 py-1 text-xs text-muted-foreground">
                          {project.company_name || "Project"}
                        </div>
                      </div>

                      <div className="p-6 flex flex-col gap-4">
                        <h3 className="text-2xl font-semibold text-foreground">
                          {project.project_name || project.title}
                        </h3>

                        <p className="text-base text-muted-foreground line-clamp-3">
                          {stripHtml(project.project_description)}
                        </p>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {(project.skills || [])
                            .slice(0, 5)
                            .map((skill, skillIndex) => (
                              <span
                                key={`${project.id}-skill-${skillIndex}`}
                                className="px-3 py-1 bg-accent/10 border border-accent/25 text-accent text-xs rounded-full"
                              >
                                {skill.skill_name}
                              </span>
                            ))}
                        </div>
                      </div>
                    </article>
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
