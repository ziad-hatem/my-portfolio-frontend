import React from 'react';

export function PostSkeleton() {
  return (
    <article className="group bg-card border border-border rounded-xl overflow-hidden hover:border-accent/50 transition-all duration-300">
      {/* Image skeleton */}
      <div className="relative aspect-video overflow-hidden bg-muted animate-pulse" />

      {/* Content skeleton */}
      <div className="p-6">
        {/* Category & date skeleton */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-6 bg-muted rounded-full animate-pulse w-24" />
          <div className="h-4 bg-muted rounded animate-pulse w-32" />
        </div>

        {/* Title skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-6 bg-muted rounded animate-pulse w-full" />
          <div className="h-6 bg-muted rounded animate-pulse w-4/5" />
        </div>

        {/* Excerpt skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-muted rounded animate-pulse w-full" />
          <div className="h-4 bg-muted rounded animate-pulse w-full" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        </div>

        {/* Read more skeleton */}
        <div className="h-5 bg-muted rounded animate-pulse w-28" />
      </div>
    </article>
  );
}

export function PostGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <PostSkeleton key={index} />
      ))}
    </div>
  );
}
