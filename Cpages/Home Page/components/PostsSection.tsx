import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { PostCard } from "./PostCard";

const PostsSection = () => {
  const recentPosts = [
    {
      id: 1,
      title: "Understanding React Server Components",
      excerpt:
        "A deep dive into the new React Server Components architecture and how it can improve your application performance.",
      image:
        "https://images.unsplash.com/photo-1593720213681-e9a8778330a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGNvZGV8ZW58MXx8fHwxNzYyMTk0NzA0fDA&ixlib=rb-4.1.0&q=80&w=1080",
      date: "Oct 15, 2024",
    },
    {
      id: 2,
      title: "My Top 5 VS Code Extensions",
      excerpt:
        "Discover the essential VS Code extensions that have transformed my development workflow and boosted productivity.",
      image:
        "https://images.unsplash.com/photo-1658806283210-6d7330062704?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNobm9sb2d5JTIwYWJzdHJhY3R8ZW58MXx8fHwxNzYyMjE5NTMyfDA&ixlib=rb-4.1.0&q=80&w=1080",
      date: "Sep 28, 2024",
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Featured Projects
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore some of my recent work spanning web development, banking
            platforms, and entertainment venues. Each project showcases modern
            technologies and best practices in software development.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {recentPosts.map((post) => (
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

        {/* View All Link */}
        <div className="text-center mt-12">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-accent hover:gap-3 transition-all text-lg font-medium"
          >
            <span>View All Projects</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PostsSection;
