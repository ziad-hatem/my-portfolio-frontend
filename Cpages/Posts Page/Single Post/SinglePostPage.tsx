"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { ShareButtons } from "@/components/ShareButtons";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { sanitizeHtml } from "@/utils/sanitize";

interface SinglePostPageProps {
  postId: string | number;
  post: any;
}

function hasArabicText(value: string): boolean {
  const plainText = String(value || "").replace(/<[^>]*>/g, " ");
  return /[\u0600-\u06FF]/.test(plainText);
}

function escapeCodeInnerHtml(value: string): string {
  return String(value || "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function protectCodeBlocks(value: string): string {
  return String(value || "").replace(
    /<code(\s[^>]*)?>([\s\S]*?)<\/code>/gi,
    (_match, attributes = "", codeContent = "") =>
      `<code${attributes}>${escapeCodeInnerHtml(codeContent)}</code>`,
  );
}

export function SinglePostPage({ postId, post }: SinglePostPageProps) {
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

  const postHtml = String(post.post_text || "");
  // Protect code blocks first, then run through DOMPurify to strip malicious scripts/iframes
  const codeProtectedHtml = protectCodeBlocks(postHtml);
  const safePostHtml = sanitizeHtml(codeProtectedHtml);
  const isArabicPost = hasArabicText(postHtml);
  const postBodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = postBodyRef.current;
    if (!container) {
      return;
    }

    let active = true;
    void (async () => {
      const hljs = (await import("highlight.js")).default;
      if (!active) {
        return;
      }

      const blocks = container.querySelectorAll("pre code");
      blocks.forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    })();

    return () => {
      active = false;
    };
  }, [safePostHtml]);

  return (
    <div className="min-h-screen pb-20 pt-[150px]!">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/posts"
          className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors"
          data-aos="fade-up"
        >
          <ArrowLeft size={20} />
          <span>Back to Posts</span>
        </Link>
      </div>

      {/* Article Content */}
      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Title & Meta */}
        <header className="mb-8" data-aos="fade-up" data-aos-delay="60">
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
          <ShareButtons title={post.title} itemId={postId} itemType="post" />
        </header>

        {/* Hero Image */}
        <div
          className="relative w-full aspect-video rounded-xl overflow-hidden mb-12 bg-muted"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <ImageWithFallback
            width={1920}
            height={1080}
            src={post.post_image?.permalink}
            alt={post.title}
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-linear-to-t from-background/70 via-background/10 to-transparent" />
        </div>

        {/* Article Body */}
        <div className="max-w-none" data-aos="fade-up" data-aos-delay="140">
          <div
            ref={postBodyRef}
            className="post-rich-text"
            dir={isArabicPost ? "rtl" : "ltr"}
            lang={isArabicPost ? "ar" : "en"}
            dangerouslySetInnerHTML={{ __html: safePostHtml }}
          />
        </div>

        {/* Back to Posts CTA */}
        <div
          className="mt-16 pt-8 border-t border-border"
          data-aos="fade-up"
          data-aos-delay="180"
        >
          <Link href="/posts" className="text-accent hover:underline">
            {"<-"} Read More Posts
          </Link>
        </div>
      </article>
    </div>
  );
}
