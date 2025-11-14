"use client";

import { checkIfExist } from "@/lib/checkIfExist";
import ExperienceSection from "./components/ExperienceSection";
import Hero from "./components/Hero";
import PostsSection from "./components/PostsSection";
import ProjectsSection from "./components/ProjectsSection";
import SkillsSection from "./components/SkillsSection";

export function HomePage({ data }: any) {
  const homeData = data.home;
  const allProjects = data.projects?.data || [];
  const allPosts = data.posts?.data || [];

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

  const projectsData = {
    title: checkIfExist(homeData?.featured_projects_section_1title, ""),
    description: checkIfExist(
      homeData?.featured_projects_section_1project_description
    ),
    featured_projects: checkIfExist(
      allProjects.map((project: any) => ({
        title: checkIfExist(project?.title, ""),
        id: checkIfExist(project?.id, ""),
        project_image: checkIfExist(project?.project_image?.permalink, ""),
        project_name: checkIfExist(project?.project_name, ""),
        company_name: checkIfExist(project?.company_name, ""),
        project_link: checkIfExist(project?.project_link, ""),
        project_overview: checkIfExist(project?.project_overview, ""),
        project_description: checkIfExist(project?.project_description, ""),
        skills: checkIfExist(
          project?.skills?.map((skill: any) => ({
            skill_name: checkIfExist(skill?.skill_name, ""),
          })),
          []
        ),
      })),
      []
    ),
  };

  const experienceData = {
    title: checkIfExist(homeData?.experience_section_1title, ""),
    description: checkIfExist(homeData?.experience_section_1description, ""),
    experiences: checkIfExist(
      homeData?.experience_section_1replicator_field?.map((exp: any) => ({
        id: checkIfExist(exp?.id, ""),
        company_name: checkIfExist(exp?.company_name, ""),
        job_title: checkIfExist(exp?.job_title, ""),
        job_description: checkIfExist(exp?.job_description, ""),
        from: checkIfExist(exp?.from, ""),
        to: checkIfExist(exp?.to, ""),
        present: checkIfExist(exp?.present, false),
      })),
      []
    ),
  };

  const skillsData = {
    title: checkIfExist(homeData?.technology_section_1section_title, ""),
    description: checkIfExist(homeData?.technology_section_1description, ""),
    skills: checkIfExist(
      homeData?.technology_section_1skills?.map((skill: any) => ({
        id: checkIfExist(skill?.id, ""),
        skill_name: checkIfExist(skill?.skill_name, ""),
        skill_link: checkIfExist(skill?.skill_link, ""),
        skill_image: checkIfExist(skill?.skill_image?.permalink, ""),
      })),
      []
    ),
  };

  const postsData = {
    title: checkIfExist(homeData?.post_sectiontitle, ""),
    description: checkIfExist(homeData?.post_sectiondescription, ""),
    posts: checkIfExist(
      allPosts.map((post: any) => ({
        permalink: checkIfExist(post?.permalink, ""),
        id: checkIfExist(post?.id, ""),
        title: checkIfExist(post?.title, ""),
        author: checkIfExist(post?.author, ""),
        date: checkIfExist(post?.publish_date, ""),
        post_text: checkIfExist(post?.post_text, ""),
        post_image: checkIfExist(post?.post_image?.permalink, ""),
      })),
      []
    ),
  };

  return (
    <div className="min-h-screen relative z-10">
      <Hero data={heroData} />
      <ProjectsSection data={projectsData} />
      <ExperienceSection data={experienceData} />
      <SkillsSection data={skillsData} />
      <PostsSection data={postsData} />
    </div>
  );
}
