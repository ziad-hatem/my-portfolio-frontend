"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Analytics } from "@/utils/analytics";
import { ShareButtons } from "@/components/ShareButtons";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

interface SinglePostPageProps {
  postId: string | number;
}

export function SinglePostPage({ postId }: SinglePostPageProps) {
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    // Post data (in a real app, this would come from an API or database)
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

    const foundPost = posts.find(
      (p) => p.id === postId || p.id === Number(postId)
    );
    setPost(foundPost);
  }, [postId]);
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
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/posts"
          className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Posts</span>
        </Link>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Title & Meta */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-5xl text-foreground mb-6">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span>Published on {post.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={18} />
              <span>By Ziad Hatem</span>
            </div>
          </div>
          <ShareButtons title={post.title} />
        </header>

        {/* Hero Image */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-12 bg-muted">
          <ImageWithFallback
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Body */}
        <div className="prose prose-invert max-w-none">
          <p className="text-muted-foreground mb-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>

          <h2 className="text-2xl text-foreground mt-12 mb-4">
            Introduction to the Topic
          </h2>
          <p className="text-muted-foreground mb-6">
            Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
            cupidatat non proident, sunt in culpa qui officia deserunt mollit
            anim id est laborum. Sed ut perspiciatis unde omnis iste natus error
            sit voluptatem accusantium doloremque laudantium.
          </p>
          <p className="text-muted-foreground mb-6">
            Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et
            quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam
            voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
            consequuntur magni dolores eos qui ratione voluptatem sequi
            nesciunt.
          </p>

          <h2 className="text-2xl text-foreground mt-12 mb-4">
            Key Concepts and Considerations
          </h2>
          <p className="text-muted-foreground mb-6">
            Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet,
            consectetur, adipisci velit, sed quia non numquam eius modi tempora
            incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
          </p>

          <ul className="list-disc list-inside space-y-3 text-muted-foreground mb-6">
            <li>First important point to consider in your implementation</li>
            <li>Second key concept that developers should understand</li>
            <li>Third critical aspect of this approach</li>
            <li>Fourth consideration for optimal results</li>
            <li>Fifth best practice to follow in your projects</li>
          </ul>

          <h2 className="text-2xl text-foreground mt-12 mb-4">
            Practical Implementation
          </h2>
          <p className="text-muted-foreground mb-6">
            At vero eos et accusamus et iusto odio dignissimos ducimus qui
            blanditiis praesentium voluptatum deleniti atque corrupti quos
            dolores et quas molestias excepturi sint occaecati cupiditate non
            provident, similique sunt in culpa qui officia deserunt mollitia
            animi, id est laborum et dolorum fuga.
          </p>
          <p className="text-muted-foreground mb-6">
            Et harum quidem rerum facilis est et expedita distinctio. Nam libero
            tempore, cum soluta nobis est eligendi optio cumque nihil impedit
            quo minus id quod maxime placeat facere possimus, omnis voluptas
            assumenda est, omnis dolor repellendus.
          </p>

          <h3 className="text-xl text-foreground mt-8 mb-4">
            Step-by-Step Guide
          </h3>
          <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-6">
            <li>Begin by setting up your development environment properly</li>
            <li>Install the necessary dependencies and tools</li>
            <li>Configure your project structure and files</li>
            <li>Implement the core functionality step by step</li>
            <li>Test thoroughly and optimize performance</li>
            <li>Deploy and monitor your application</li>
          </ol>

          <h2 className="text-2xl text-foreground mt-12 mb-4">
            Advanced Techniques
          </h2>
          <p className="text-muted-foreground mb-6">
            Temporibus autem quibusdam et aut officiis debitis aut rerum
            necessitatibus saepe eveniet ut et voluptates repudiandae sint et
            molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
            delectus, ut aut reiciendis voluptatibus maiores alias consequatur
            aut perferendis doloribus asperiores repellat.
          </p>
          <p className="text-muted-foreground mb-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>

          <h2 className="text-2xl text-foreground mt-12 mb-4">
            Common Pitfalls and Solutions
          </h2>
          <p className="text-muted-foreground mb-6">
            Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
            cupidatat non proident, sunt in culpa qui officia deserunt mollit
            anim id est laborum.
          </p>

          <h2 className="text-2xl text-foreground mt-12 mb-4">
            Conclusion and Next Steps
          </h2>
          <p className="text-muted-foreground mb-6">
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
            accusantium doloremque laudantium, totam rem aperiam, eaque ipsa
            quae ab illo inventore veritatis et quasi architecto beatae vitae
            dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit
            aspernatur aut odit aut fugit.
          </p>
          <p className="text-muted-foreground mb-6">
            Thank you for reading! I hope you found this article helpful. Feel
            free to reach out if you have any questions or would like to discuss
            further.
          </p>
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
