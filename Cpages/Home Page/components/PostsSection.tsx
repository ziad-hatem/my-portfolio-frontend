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

const PostsSection = () => {
  const swiperRef = useRef<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const recentPosts = [
    {
      id: 1,
      title: "Understanding React Server Components",
      excerpt:
        "A deep dive into the new React Server Components architecture and how it can improve your application performance.",
      image:
        "https://images.unsplash.com/photo-1593720213681-e9a8778330a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGNvZGV8ZW58MXx8fHwxNzYyMTk0NzA0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      date: "Oct 15, 2024",
    },
    {
      id: 2,
      title: "My Top 5 VS Code Extensions",
      excerpt:
        "Discover the essential VS Code extensions that have transformed my development workflow and boosted productivity.",
      image:
        "https://images.unsplash.com/photo-1658806283210-6d7330062704?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNobm9sb2d5JTIwYWJzdHJhY3R8ZW58MXx8fHwxNzYyMjE5NTMyfDA&ixlib=rb-4.1.0&q=80&w=1080",
      date: "Sep 28, 2024",
    },
  ];

  return (
    <section className="py-20 bg-muted/30 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-12 lg:gap-16">
          {/* Left Side - Header */}
          <div className="w-full lg:w-2/5 flex flex-col">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Latest Blog Posts
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Insights, tutorials, and thoughts on web development, modern
              technologies, and best practices in software engineering.
            </p>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-4 mb-8">
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
            <div className="">
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
          <div className="w-full lg:w-3/5 max-w-[600px]">
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
              {recentPosts.map((post) => (
                <SwiperSlide key={post.id}>
                  <PostCard
                    postId={post.id}
                    title={post.title}
                    excerpt={post.excerpt}
                    image={post.image}
                    date={post.date}
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
