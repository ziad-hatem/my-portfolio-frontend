"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Hash,
  Layers,
} from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { ShareButtons } from "@/components/ShareButtons";

interface Skill {
  id: string;
  skill_name: string;
}

interface FetchedProject {
  id: string;
  title: string;
  company_name: string;
  project_description: string;
  project_image: {
    permalink: string;
  };
  project_overview: string[];
  project_name: string;
  project_link: string;
  skills: Skill[];
}

interface SingleProjectPageProps {
  projectId: string | number;
  project?: FetchedProject | null;
}

interface ProjectViewData {
  id: string;
  title: string;
  companyName: string;
  description: string;
  image: string;
  overview: string[];
  technologies: string[];
  liveUrl: string;
}

function normalizeText(value: unknown): string {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toViewData(project: FetchedProject | null | undefined): ProjectViewData | null {
  if (!project) {
    return null;
  }

  const technologies = Array.from(
    new Set((project.skills || []).map((skill) => skill.skill_name).filter(Boolean))
  );

  return {
    id: project.id,
    title: project.title,
    companyName: project.company_name || "Independent Project",
    description: normalizeText(project.project_description),
    image: project.project_image?.permalink || "/cover.jpg",
    overview: (project.project_overview || []).map((item) => normalizeText(item)).filter(Boolean),
    technologies,
    liveUrl: project.project_link || "",
  };
}

export function SingleProjectPage({ projectId, project: fetchedProject }: SingleProjectPageProps) {
  const project = useMemo(() => toViewData(fetchedProject), [fetchedProject]);

  if (!project) {
    return (
      <div className="min-h-screen pb-20 pt-[150px]! px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border/80 bg-card/80 p-8 text-center">
            <p className="text-2xl text-foreground mb-2">Project not found</p>
            <p className="text-muted-foreground mb-6">
              The requested project could not be found or is no longer available.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:text-accent transition-colors"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Back to Projects
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm text-accent-foreground"
              >
                Contact
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20 pt-[150px]!">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(0,245,192,0.14),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.1),transparent_33%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-card/70 px-3 py-2 text-sm text-muted-foreground hover:text-accent transition-colors"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Projects
          </Link>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-border/80 min-h-[380px] md:min-h-[460px] bg-card/50">
          <ImageWithFallback
            width={1920}
            height={1080}
            src={project.image}
            alt={project.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-background/20" />

          <div className="relative h-full p-6 md:p-10 lg:p-14 flex flex-col justify-end">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                <Briefcase size={12} aria-hidden="true" />
                {project.companyName}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                <Layers size={12} aria-hidden="true" />
                {project.technologies.length} technologies
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl text-foreground mb-4 max-w-4xl leading-tight">
              {project.title}
            </h1>

            <p className="text-sm md:text-base text-muted-foreground max-w-3xl mb-6">
              {project.description || "No project description provided."}
            </p>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {project.liveUrl ? (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
                  >
                    View Live Site
                    <ExternalLink size={16} aria-hidden="true" />
                  </a>
                ) : null}
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-background/70 px-5 py-3 text-sm text-foreground hover:border-accent/70 transition-colors"
                >
                  Start a Similar Project
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>

              <ShareButtons title={project.title} itemId={projectId} itemType="project" />
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            <article className="rounded-2xl border border-border/80 bg-card/80 p-6 md:p-8">
              <h2 className="text-2xl text-foreground mb-5">Project Overview</h2>

              {project.overview.length > 0 ? (
                <div className="space-y-3">
                  {project.overview.map((item, index) => (
                    <div
                      key={`${project.id}-overview-${index}`}
                      className="flex gap-3 rounded-xl border border-border/60 bg-background/50 p-4"
                    >
                      <CheckCircle2 className="text-accent flex-shrink-0 mt-0.5" size={18} />
                      <p className="text-muted-foreground leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground leading-relaxed">
                  {project.description || "No overview details provided."}
                </p>
              )}
            </article>

            <article className="rounded-2xl border border-border/80 bg-card/80 p-6 md:p-8">
              <h2 className="text-2xl text-foreground mb-5">Technology Stack</h2>

              {project.technologies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <span
                      key={`${project.id}-tech-${tech}`}
                      className="px-3 py-2 rounded-lg border border-accent/25 bg-accent/10 text-accent text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No technologies listed.</p>
              )}
            </article>
          </div>

          <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-28 self-start">
            <article className="rounded-2xl border border-border/80 bg-card/80 p-5">
              <h3 className="text-base font-semibold text-foreground mb-4">Project Snapshot</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Project ID</dt>
                  <dd className="inline-flex items-center gap-1 text-foreground">
                    <Hash size={12} aria-hidden="true" />
                    {project.id}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Company</dt>
                  <dd className="text-foreground text-right">{project.companyName}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Overview Points</dt>
                  <dd className="text-foreground">{project.overview.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Tech Count</dt>
                  <dd className="text-foreground">{project.technologies.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Live Site</dt>
                  <dd className={project.liveUrl ? "text-emerald-300" : "text-muted-foreground"}>
                    {project.liveUrl ? "Available" : "Not listed"}
                  </dd>
                </div>
              </dl>
            </article>

            <article className="rounded-2xl border border-border/80 bg-card/80 p-5">
              <h3 className="text-base font-semibold text-foreground mb-2">Need a Similar Build?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                I can help design and ship a production-ready product with modern architecture.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
              >
                Let&apos;s Talk
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </article>
          </aside>
        </section>

        <div className="mt-14 border-t border-border/70 pt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Want to explore more case studies?</p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-accent hover:underline"
          >
            View More Projects
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
