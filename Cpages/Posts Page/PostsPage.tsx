"use client";

import React, { useState, useEffect } from "react";
import { PostGridSkeleton } from "../Home Page/components/PostSkeleton";
import { PostCard } from "../Home Page/components/PostCard";

export function PostsPage() {
  const [loading, setLoading] = useState(true);
  const posts = [
    {
      id: 1,
      title: "Understanding React Server Components",
      excerpt:
        "A deep dive into the new React Server Components architecture and how it can improve your application performance and user experience.",
      image:
        "https://images.unsplash.com/photo-1593720213681-e9a8778330a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGNvZGV8ZW58MXx8fHwxNzYyMTk0NzA0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      date: "Oct 15, 2024",
    },
    {
      id: 2,
      title: "My Top 5 VS Code Extensions",
      excerpt:
        "Discover the essential VS Code extensions that have transformed my development workflow and boosted productivity significantly.",
      image:
        "https://images.unsplash.com/photo-1658806283210-6d7330062704?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNobm9sb2d5JTIwYWJzdHJhY3R8ZW58MXx8fHwxNzYyMjE5NTMyfDA&ixlib=rb-4.1.0&q=80&w=1080",
      date: "Sep 28, 2024",
    },
    {
      id: 3,
      title: "Building Accessible Web Applications",
      excerpt:
        "Learn the fundamentals of web accessibility and how to create inclusive experiences that work for everyone.",
      image:
        "https://images.unsplash.com/photo-1759661990336-51bd4b951fea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZlbG9wZXIlMjB3b3Jrc3BhY2UlMjBsYXB0b3B8ZW58MXx8fHwxNzYyMjExMzI4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      date: "Sep 12, 2024",
    },
    {
      id: 4,
      title: "State Management in Modern React",
      excerpt:
        "A comprehensive guide to choosing the right state management solution for your React applications.",
      image:
        "https://images.unsplash.com/photo-1630283017802-785b7aff9aac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3b3Jrc3BhY2UlMjBkZXNrfGVufDF8fHx8MTc2MjEyOTg3OXww&ixlib=rb-4.1.0&q=80&w=1080",
      date: "Aug 25, 2024",
    },
    {
      id: 5,
      title: "TypeScript Best Practices",
      excerpt:
        "Essential TypeScript patterns and practices that will help you write more maintainable and type-safe code.",
      image:
        "https://images.unsplash.com/photo-1593720213681-e9a8778330a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGNvZGV8ZW58MXx8fHwxNzYyMTk0NzA0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      date: "Aug 10, 2024",
    },
    {
      id: 6,
      title: "Performance Optimization Techniques",
      excerpt:
        "Learn how to identify and fix performance bottlenecks in your React applications for better user experience.",
      image:
        "https://images.unsplash.com/photo-1658806283210-6d7330062704?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNobm9sb2d5JTIwYWJzdHJhY3R8ZW58MXx8fHwxNzYyMjE5NTMyfDA&ixlib=rb-4.1.0&q=80&w=1080",
      date: "Jul 28, 2024",
    },
    {
      id: 7,
      title: "CSS Grid vs Flexbox: When to Use What",
      excerpt:
        "A practical guide to understanding the differences between CSS Grid and Flexbox and when to use each layout system.",
      image:
        "https://images.unsplash.com/photo-1759661990336-51bd4b951fea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZlbG9wZXIlMjB3b3Jrc3BhY2UlMjBsYXB0b3B8ZW58MXx8fHwxNzYyMjExMzI4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      date: "Jul 15, 2024",
    },
    {
      id: 8,
      title: "The Future of Web Development",
      excerpt:
        "Exploring emerging trends and technologies that are shaping the future of web development.",
      image:
        "https://images.unsplash.com/photo-1630283017802-785b7aff9aac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3b3Jrc3BhY2UlMjBkZXNrfGVufDF8fHx8MTc2MjEyOTg3OXww&ixlib=rb-4.1.0&q=80&w=1080",
      date: "Jun 30, 2024",
    },
  ];

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen pb-20 pt-[150px]!">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl text-foreground mb-4">Posts</h1>
          <p className="text-muted-foreground max-w-2xl">
            My thoughts on development, design, and technology. Sharing
            insights, tutorials, and lessons learned from real-world projects.
          </p>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <PostGridSkeleton count={6} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                postId={post.id}
                title={post.title}
                excerpt={post.excerpt}
                image={post.image}
                date={post.date}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
