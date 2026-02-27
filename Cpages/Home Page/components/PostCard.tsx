"use client";

import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
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

function stripHtml(value: string): string {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  return (
    <Link
      href={`/posts/${postId}`}
      className="group bg-card rounded-2xl overflow-hidden border border-border/80 hover:border-accent/60 transition-all duration-300 cursor-pointer block"
      data-aos={dataAos}
      data-aos-delay={dataAosDelay}
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <ImageWithFallback
          width={600}
          height={600}
          src={image || "/cover.jpg"}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-transparent opacity-85" />
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <Calendar size={15} />
          <span>{date}</span>
        </div>

        <h3 className="text-foreground group-hover:text-accent transition-colors mb-3 line-clamp-2 text-xl">
          {title}
        </h3>

        <p className="text-muted-foreground mb-5 line-clamp-3 leading-relaxed">
          {stripHtml(excerpt)}
        </p>

        <div className="flex items-center gap-2 text-accent group-hover:gap-3 transition-all text-sm font-medium">
          <span>Read More</span>
          <ArrowRight size={16} />
        </div>
      </div>
    </Link>
  );
}
