"use client";

import { checkIfExist } from "@/lib/checkIfExist";
import ExperienceSection from "./components/ExperienceSection";
import Hero from "./components/Hero";
import PostsSection from "./components/PostsSection";
import ProjectsSection from "./components/ProjectsSection";
import SkillsSection from "./components/SkillsSection";

export function HomePage({ data }: any) {
  const homeData = data.home;

  const heroData = {
    name: checkIfExist(homeData?.name, ""),
    role: checkIfExist(homeData?.role, ""),
    description: checkIfExist(homeData?.description, ""),

    social_links: checkIfExist(
      homeData?.social_links?.map((social: any) => ({
        id: checkIfExist(social?.id, ""),
        icon: checkIfExist(social?.social_icon?.permalink, ""),
        link: checkIfExist(social?.social_link, ""),
      })),
      []
    ),

    buttons: checkIfExist(
      homeData?.buttons?.map((btn: any) => ({
        id: checkIfExist(btn?.id, ""),
        text: checkIfExist(btn?.buttton_text, ""),
        link: checkIfExist(btn?.button_link, ""),
        fill_background: checkIfExist(btn?.fill_background, false),
      })),
      []
    ),
  };

  console.log(heroData);
  return (
    <div className="min-h-screen relative z-10">
      <Hero data={heroData} />
      <ProjectsSection />
      <ExperienceSection />
      <SkillsSection />
      <PostsSection />
    </div>
  );
}
