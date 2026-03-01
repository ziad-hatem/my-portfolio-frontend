"use client";

import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Swiper as SwiperType } from "swiper";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { PostCard } from "./PostCard";
import { sanitizeHtml } from "@/utils/sanitize";
import { useSwiper } from "@/hooks/useSwiper";

import "swiper/css";
import "swiper/css/navigation";

interface PostsSectionProps {
  data: {
    title: string;
    description: string;
    posts: Array<{
      permalink: string;
      id: string;
      title: string;
      author: string;
      date: string;
      post_text: string;
      post_image: string;
    }>;
  };
}

const PostsSection = ({ data }: PostsSectionProps) => {
  const { swiperRef, isBeginning, isEnd, syncNavigationState } = useSwiper();
  const posts = data.posts || [];
  const canSlide = posts.length > 1;

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(0,245,192,0.08),transparent_34%)]" />
      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent mb-4">
              <Sparkles size={12} aria-hidden="true" />
              Insights
            </div>

            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
              data-aos="fade-up"
            >
              {data.title || "Latest Blog Posts"}
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
              href="/posts"
              className="inline-flex items-center gap-2 text-accent hover:gap-3 transition-all text-base font-medium"
              data-aos="fade-up"
              data-aos-delay="260"
            >
              <span>View All Posts</span>
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
              {posts.map((post) => (
                <SwiperSlide key={post.id}>
                  <PostCard
                    postId={post.id}
                    title={post.title}
                    excerpt={post.post_text}
                    image={post.post_image}
                    date={post.date}
                    imageFit="contain"
                    data-aos="fade-up"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PostsSection;
