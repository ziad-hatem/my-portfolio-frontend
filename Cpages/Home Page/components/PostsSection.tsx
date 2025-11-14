"use client";

import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { PostCard } from "./PostCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { useRef, useState } from "react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";

interface PostsSectionProps {
  data: {
    title: string;
    description: string;
    posts: Array<{
      permalink: string;
      title: string;
      author: string;
      date: string;
      post_text: string;
      post_image: string;
    }>;
  };
}

const PostsSection = ({ data }: PostsSectionProps) => {
  const swiperRef = useRef<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

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
              {data.title || "Latest Blog Posts"}
            </h2>
            <p
              className="text-lg text-muted-foreground mb-8"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              {data.description || "Insights, tutorials, and thoughts on web development, modern technologies, and best practices in software engineering."}
            </p>

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
                href="/posts"
                className="inline-flex items-center gap-2 text-accent hover:gap-3 transition-all text-lg font-medium"
              >
                <span>View All Posts</span>
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>

          {/* Right Side - Posts Swiper */}
          <div
            className="w-full lg:w-3/5 max-w-[600px]"
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
              {data.posts.map((post, index) => (
                <SwiperSlide key={index}>
                  <PostCard
                    postId={post.permalink}
                    title={post.title}
                    excerpt={post.post_text}
                    image={post.post_image}
                    date={post.date}
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
