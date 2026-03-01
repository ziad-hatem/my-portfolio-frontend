"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { stripHtml } from "@/utils/stripHtml";

interface ProjectCardProps {
  title: string;
  description: string;
  image: string;
  tags: string[];
  workContext?: string;
  projectId: string | number;
  imageFit?: "cover" | "contain";
}

export function ProjectCard({
  title,
  description,
  image,
  tags,
  workContext,
  projectId,
  imageFit = "cover",
}: ProjectCardProps) {
  const imageClassName =
    imageFit === "contain"
      ? "w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
      : "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500";

  return (
    <Link
      href={`/projects/${projectId}`}
      className="group relative bg-card rounded-2xl overflow-hidden border border-border/80 hover:border-accent/60 transition-all duration-300 cursor-pointer block"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <ImageWithFallback
          width={600}
          height={600}
          src={image || "/cover.jpg"}
          alt={title}
          className={imageClassName}
        />
        <div className="absolute inset-0 bg-linear-to-t from-background/85 via-background/20 to-transparent opacity-85" />
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <h3 className="text-foreground group-hover:text-accent transition-colors text-xl line-clamp-2">
              {title}
            </h3>
            {workContext ? (
              <div className="text-xs text-muted-foreground mt-1">
                {workContext}
              </div>
            ) : null}
          </div>
          <ArrowUpRight
            className="text-muted-foreground group-hover:text-accent transition-colors shrink-0"
            size={20}
          />
        </div>

        <p className="text-muted-foreground mb-5 line-clamp-3 leading-relaxed">
          {stripHtml(description)}
        </p>

        <div className="flex flex-wrap gap-2">
          {(tags || []).slice(0, 4).map((tag, index) => (
            <span
              key={`${projectId}-${index}-${tag}`}
              className="px-3 py-1 bg-accent/10 border border-accent/20 text-accent rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
