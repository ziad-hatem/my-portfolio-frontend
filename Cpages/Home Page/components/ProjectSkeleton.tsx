import React from 'react';

export function ProjectSkeleton() {
  return (
    <div className="group relative bg-card rounded-xl overflow-hidden border border-border">
      {/* Image skeleton */}
      <div className="relative aspect-video overflow-hidden bg-muted animate-pulse" />

      {/* Content skeleton */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="h-6 bg-muted rounded animate-pulse mb-2 w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-muted rounded animate-pulse w-full" />
          <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
        </div>

        {/* Tags skeleton */}
        <div className="flex flex-wrap gap-2">
          <div className="h-8 bg-muted rounded-full animate-pulse w-20" />
          <div className="h-8 bg-muted rounded-full animate-pulse w-24" />
          <div className="h-8 bg-muted rounded-full animate-pulse w-16" />
        </div>
      </div>
    </div>
  );
}

export function ProjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProjectSkeleton key={index} />
      ))}
    </div>
  );
}
