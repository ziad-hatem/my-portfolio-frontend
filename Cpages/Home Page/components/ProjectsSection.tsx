import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

const ProjectsSection = () => {
  const featuredProjects = [
    {
      id: "jic",
      title: "Jeddah International College (JIC)",
      description:
        "Led the front-end development of a comprehensive college website, collaborating with an exceptional team to deliver a modern and user-friendly experience.",
      image:
        "https://images.unsplash.com/photo-1706016899218-ebe36844f70e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYyMTg0MDY3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      tags: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
      workContext: "Brackets Technology",
    },
    {
      id: "saudi-banks",
      title: "Saudi Banks",
      description:
        "Developed a sophisticated banking platform with secure authentication, real-time data processing, and responsive design for optimal user experience.",
      image:
        "https://images.unsplash.com/photo-1709573360368-f53739b241f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW5raW5nJTIwZmluYW5jZSUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzYyMjM2MjQ3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      tags: ["React", "Redux", "REST API", "Material UI"],
      workContext: "Brackets Technology",
    },
    {
      id: "sand-fun",
      title: "Sand & Fun",
      description:
        "Created an engaging entertainment venue website with interactive booking system, event management, and seamless user navigation.",
      image:
        "https://images.unsplash.com/photo-1759332460392-3ace26a745a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbXVzZW1lbnQlMjBwYXJrJTIwcmlkZXN8ZW58MXx8fHwxNzYyMTY3NjQ5fDA&ixlib=rb-4.1.0&q=80&w=1080",
      tags: ["Next.js", "TypeScript", "Prisma", "Tailwind CSS"],
      workContext: "Freelance",
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
          {featuredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-background rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="relative h-48 sm:h-56 w-full">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-5 flex flex-col">
                <div className="mb-2">
                  <span className="text-xs text-accent font-medium">
                    {project.workContext}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {project.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {project.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-accent/10 text-accent text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
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

export default ProjectsSection;
