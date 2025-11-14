"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Analytics } from "@/utils/analytics";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

interface ProjectCardProps {
  title: string;
  description: string;
  image: string;
  tags: string[];
  workContext?: string;
  projectId: string | number;
}

export function ProjectCard({
  title,
  description,
  image,
  tags,
  workContext,
  projectId,
}: ProjectCardProps) {
  const handleClick = () => {
    // Track project card click
    Analytics.track({
      type: "project_click",
      itemId: projectId,
      itemTitle: title,
      metadata: {
        tags,
        workContext,
      },
    });
  };

  return (
    <Link
      href={`/projects/${projectId}`}
      onClick={handleClick}
      className="group relative bg-card rounded-xl overflow-hidden border border-border hover:border-accent transition-all duration-300 cursor-pointer block"
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
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-foreground group-hover:text-accent transition-colors">
              {title}
            </h3>
            {workContext && (
              <div className="text-xs text-muted-foreground mt-1">
                {workContext}
              </div>
            )}
          </div>
          <ArrowUpRight
            className="text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0 ml-2"
            size={20}
          />
        </div>

        <p className="text-muted-foreground mb-4 line-clamp-2">{description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
