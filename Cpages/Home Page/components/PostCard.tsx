"use client";

import React from "react";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { Analytics } from "@/utils/analytics";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

interface PostCardProps {
  title: string;
  excerpt: string;
  image: string;
  date: string;
  postId: string | number;
  "data-aos"?: string;
  "data-aos-delay"?: string | number;
}

export function PostCard({
  title,
  excerpt,
  image,
  date,
  postId,
  "data-aos": dataAos,
  "data-aos-delay": dataAosDelay,
}: PostCardProps) {
  const handleClick = () => {
    // Track post card click
    Analytics.track({
      type: "post_click",
      itemId: postId,
      itemTitle: title,
    });
  };

  return (
    <Link
      href={`/posts/${postId}`}
      onClick={handleClick}
      className="group bg-card rounded-xl overflow-hidden border border-border transition-all duration-300 cursor-pointer block"
      data-aos={dataAos}
      data-aos-delay={dataAosDelay}
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <ImageWithFallback
          width={600}
          height={600}
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <Calendar size={16} />
          <span>{date}</span>
        </div>

        <h3 className="text-foreground group-hover:text-accent transition-colors mb-3 line-clamp-2">
          {title}
        </h3>

        <p className="text-muted-foreground mb-4 line-clamp-3">{excerpt}</p>

        <div className="flex items-center gap-2 text-accent group-hover:gap-3 transition-all">
          <span>Read More</span>
          <ArrowRight size={16} />
        </div>
      </div>
    </Link>
  );
}
