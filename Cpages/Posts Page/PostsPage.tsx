"use client";

import React from "react";
import { PostCard } from "../Home Page/components/PostCard";
import { CountUpNumber } from "@/components/ui/CountUpNumber";

interface PostsPageProps {
  posts: any[];
}

export function PostsPage({ posts }: PostsPageProps) {
  return (
    <div className="min-h-screen pb-20 pt-[150px]!">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12" data-aos="fade-up">
          <h1 className="text-4xl md:text-5xl text-foreground mb-4">Posts</h1>
          <p className="text-muted-foreground max-w-2xl">
            My thoughts on development, design, and technology. Sharing
            insights, tutorials, and lessons learned from real-world projects.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-sm text-muted-foreground">
            Total posts:
            <span className="text-foreground font-semibold">
              <CountUpNumber value={posts.length} duration={1.1} />
            </span>
          </p>
        </div>

        {/* Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, index) => (
            <PostCard
              key={post.id}
              postId={post.id}
              title={post.title}
              excerpt={post.post_text}
              image={post.post_image?.permalink}
              date={post.publish_date}
              imageFit="contain"
              data-aos="fade-up"
              data-aos-delay={Math.min(index * 80, 320)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
