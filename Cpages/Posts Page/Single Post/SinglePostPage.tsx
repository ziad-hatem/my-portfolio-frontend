"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Analytics } from "@/utils/analytics";
import { ShareButtons } from "@/components/ShareButtons";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

interface SinglePostPageProps {
  postId: string | number;
  post: any;
}

export function SinglePostPage({ postId, post }: SinglePostPageProps) {
  useEffect(() => {
    // Track post view
    if (post) {
      Analytics.track({
        type: "post_view",
        itemId: post.id,
        itemTitle: post.title,
      });

      // Track view count in backend
      Analytics.trackView("post", post.id, post.title);
    }
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Post not found</p>
          <Link href="/posts" className="text-accent hover:underline">
            Back to Posts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-[150px]!">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/posts"
          className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Posts</span>
        </Link>
      </div>

      {/* Article Content */}
      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Title & Meta */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-5xl text-foreground mb-6">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span>Published in {post.publish_date}</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={18} />
              <span>By {post.author || "Ziad Hatem"}</span>
            </div>
          </div>
          <ShareButtons title={post.title} />
        </header>

        {/* Hero Image */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-12 bg-muted">
          <ImageWithFallback
            width={1920}
            height={1080}
            src={post.post_image?.permalink}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Body */}
        <div className="prose prose-invert max-w-none">
          <div
            className="text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: post.post_text }}
          />
        </div>

        {/* Back to Posts CTA */}
        <div className="mt-16 pt-8 border-t border-border">
          <Link href="/posts" className="text-accent hover:underline">
            ← Read More Posts
          </Link>
        </div>
      </article>
    </div>
  );
}
