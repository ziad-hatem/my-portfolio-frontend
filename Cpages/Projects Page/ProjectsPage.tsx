"use client";

import React, { useState, useEffect } from "react";
import { ProjectGridSkeleton } from "../Home Page/components/ProjectSkeleton";
import { ProjectCard } from "../Home Page/components/ProjectCard";

interface Skill {
  id: string;
  skill_name: string;
}

interface Project {
  id: string;
  title: string;
  company_name: string;
  project_description: string;
  project_image: {
    permalink: string;
  };
  project_overview: string;
  project_name: string;
  project_link: string;
  skills: Skill[];
}

interface ProjectsPageProps {
  projects: Project[];
}

export function ProjectsPage({ projects: fetchedProjects }: ProjectsPageProps) {
  const [loading, setLoading] = useState(true);
  const fallbackProjects = [
    {
      id: "jic",
      title: "Jeddah International College (JIC)",
      description:
        "Led the front-end development of a comprehensive college website, collaborating with an exceptional team to deliver a modern and user-friendly experience.",
      image:
        "https://images.unsplash.com/photo-1706016899218-ebe36844f70e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYyMTg0MDY3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      tags: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
      workContext: "Brackets Technology",
      details: {
        overview: [
          "As a Front-end Developer, I led the project, overseeing the technical design and development of the college's official website.",
          "Collaborated with an incredible team, including our talented designer Salam, whose vision brought the site's aesthetics to life.",
          "Built a fully responsive, user-friendly platform that serves students, faculty, and prospective applicants.",
          "Implemented modern web technologies to ensure optimal performance and accessibility.",
        ],
        technologies: [
          "React",
          "Next.js",
          "TypeScript",
          "Tailwind CSS",
          "Prisma",
          "PostgreSQL",
        ],
        liveUrl: "https://jic.edu.sa",
      },
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
      details: {
        overview: [
          "Developed a comprehensive banking platform serving multiple financial institutions across Saudi Arabia.",
          "Implemented secure authentication and authorization systems to protect sensitive financial data.",
          "Created an intuitive dashboard for account management, transactions, and financial reporting.",
          "Ensured compliance with banking regulations and security standards.",
        ],
        technologies: [
          "React",
          "Redux",
          "REST API",
          "Material UI",
          "Jest",
          "React Testing Library",
        ],
        liveUrl: "https://saudibanks.example.com",
      },
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
      details: {
        overview: [
          "Built an interactive website for an entertainment and recreation venue in Saudi Arabia.",
          "Designed and implemented a user-friendly booking system for events and activities.",
          "Created dynamic photo galleries and event calendars to showcase attractions.",
          "Optimized for mobile devices to enable on-the-go bookings and information access.",
        ],
        technologies: [
          "Next.js",
          "TypeScript",
          "Prisma",
          "Tailwind CSS",
          "PostgreSQL",
        ],
        liveUrl: "https://sandfun.example.com",
      },
    },
    {
      id: "juffali-trucks",
      title: "Juffali Trucks",
      description:
        "Developed a comprehensive truck management and logistics platform with advanced fleet tracking and reporting capabilities.",
      image:
        "https://images.unsplash.com/photo-1695222833131-54ee679ae8e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cnVjayUyMGxvZ2lzdGljc3xlbnwxfHx8fDE3NjIyMzYyNDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
      tags: ["React", "Redux", "TypeScript", "GraphQL"],
      workContext: "Brackets Technology",
      details: {
        overview: [
          "Created a powerful logistics management system for one of the largest truck distributors in Saudi Arabia.",
          "Implemented real-time fleet tracking and monitoring dashboard.",
          "Built comprehensive reporting tools for sales, inventory, and service management.",
          "Integrated with third-party APIs for enhanced functionality.",
        ],
        technologies: [
          "React",
          "Redux",
          "TypeScript",
          "GraphQL",
          "Apollo Client",
        ],
        liveUrl: "https://juffalitrucks.example.com",
      },
    },
    {
      id: "maaden",
      title: "Maaden",
      description:
        "Designed and developed a corporate website for a leading mining and metals company with complex data visualizations.",
      image:
        "https://images.unsplash.com/photo-1660367439240-d38cb03a4365?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbmclMjBpbmR1c3RyaWFsfGVufDF8fHx8MTc2MjIzNjI0OHww&ixlib=rb-4.1.0&q=80&w=1080",
      tags: ["Next.js", "React", "Tailwind CSS", "D3.js"],
      workContext: "Brackets Technology",
      details: {
        overview: [
          "Developed a corporate platform for one of the largest mining companies in the Middle East.",
          "Created interactive data visualizations for production metrics and financial reports.",
          "Implemented multilingual support (Arabic/English) with RTL layout considerations.",
          "Built investor relations portal with real-time stock information.",
        ],
        technologies: ["Next.js", "React", "Tailwind CSS", "D3.js", "Chart.js"],
        liveUrl: "https://maaden.example.com",
      },
    },
    {
      id: "meena-health",
      title: "Meena Health",
      description:
        "Built a modern healthcare platform with appointment scheduling, patient portals, and telemedicine capabilities.",
      image:
        "https://images.unsplash.com/photo-1668874896975-7f874c90600a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwbWVkaWNhbHxlbnwxfHx8fDE3NjIxNjc4MDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
      tags: ["React", "TypeScript", "Redux", "REST API"],
      workContext: "Freelance",
      details: {
        overview: [
          "Created a comprehensive healthcare management system for a modern medical facility.",
          "Implemented secure patient portal with appointment scheduling and medical records access.",
          "Built telemedicine features for virtual consultations.",
          "Ensured HIPAA compliance and data security best practices.",
        ],
        technologies: ["React", "TypeScript", "Redux", "REST API", "Socket.io"],
        liveUrl: "https://meenahealth.example.com",
      },
    },
    {
      id: "kaust-sustainability",
      title: "KAUST Sustainability",
      description:
        "Developed an environmental sustainability platform featuring carbon tracking, renewable energy monitoring, and impact reporting.",
      image:
        "https://images.unsplash.com/photo-1675130277336-23cb686f01c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJpbGl0eSUyMGdyZWVuJTIwZW5lcmd5fGVufDF8fHx8MTc2MjE2NzM5N3ww&ixlib=rb-4.1.0&q=80&w=1080",
      tags: ["Next.js", "TypeScript", "Tailwind CSS", "Recharts"],
      workContext: "Freelance",
      details: {
        overview: [
          "Built a sustainability tracking platform for King Abdullah University of Science and Technology.",
          "Created interactive dashboards for carbon footprint monitoring and energy consumption.",
          "Implemented data visualization tools for environmental impact reporting.",
          "Designed educational resources section for sustainability initiatives.",
        ],
        technologies: [
          "Next.js",
          "TypeScript",
          "Tailwind CSS",
          "Recharts",
          "Prisma",
        ],
        liveUrl: "https://sustainability.kaust.edu.sa",
      },
    },
  ];

  // Use fetched projects if available, otherwise use fallback
  const projects = fetchedProjects && fetchedProjects.length > 0
    ? fetchedProjects
    : fallbackProjects;

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
          <h1 className="text-4xl md:text-5xl text-foreground mb-4">
            Projects
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            A selection of my work. Each project represents a unique challenge
            and an opportunity to create exceptional digital experiences.
          </p>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <ProjectGridSkeleton count={6} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              // Map fetched project data to component props
              const isFetchedProject = 'project_description' in project;

              return (
                <ProjectCard
                  key={project.id}
                  projectId={project.id}
                  title={isFetchedProject ? project.title : (project as any).title}
                  description={isFetchedProject ? project.project_description : (project as any).description}
                  image={isFetchedProject ? project.project_image.permalink : (project as any).image}
                  tags={isFetchedProject ? project.skills.map(s => s.skill_name) : (project as any).tags}
                  workContext={isFetchedProject ? project.company_name : (project as any).workContext}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
