"use client";

import ExperienceSection from "./components/ExperienceSection";
import Hero from "./components/Hero";
import PostsSection from "./components/PostsSection";
import ProjectsSection from "./components/ProjectsSection";
import SkillsSection from "./components/SkillsSection";

export function HomePage() {
  return (
    <div className="min-h-screen relative z-10">
      <Hero />
      <ProjectsSection />
      <ExperienceSection />
      <SkillsSection />
      <PostsSection />
    </div>
  );
}
