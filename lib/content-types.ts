export interface ImageRef {
  permalink: string;
}

export interface SkillEntry {
  id: string;
  skill_name: string;
}

export interface HomeSocialLink {
  id: string;
  social_icon: ImageRef;
  social_link: string;
}

export interface HomeButton {
  id: string;
  buttton_text: string;
  button_link: string;
  fill_background: boolean;
}

export interface ExperienceEntry {
  id: string;
  company_name: string;
  job_title: string;
  job_description: string;
  from: string;
  to: string;
  present: boolean;
}

export interface SeoSettings {
  seo_image: ImageRef;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
}

export interface HomeContentDoc {
  key: "default";
  name: string;
  role: string;
  description: string;
  social_links: HomeSocialLink[];
  buttons: HomeButton[];
  featured_projects_section_1title: string;
  featured_projects_section_1project_description: string;
  experience_section_1title: string;
  experience_section_1description: string;
  experience_section_1replicator_field: ExperienceEntry[];
  technology_section_1section_title: string;
  technology_section_1description: string;
  technology_section_1skills: SkillEntry[];
  post_sectiontitle: string;
  post_sectiondescription: string;
  seo_settings: SeoSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectContentDoc {
  id: string;
  title: string;
  company_name: string;
  project_description: string;
  project_image: ImageRef;
  seo_settings: SeoSettings;
  project_overview: string[];
  project_name: string;
  project_link: string;
  skills: SkillEntry[];
  ogAssetKey: string;
  ogImagePath: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostContentDoc {
  id: string;
  title: string;
  author: string;
  post_text: string;
  post_image: ImageRef;
  seo_settings: SeoSettings;
  publish_date: string;
  permalink: string;
  ogAssetKey: string;
  ogImagePath: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolPageSeoEntry {
  slug: string;
  label: string;
  path: string;
  seo_settings: SeoSettings;
}

export interface ToolsContentDoc {
  key: "default";
  tools_index_seo: SeoSettings;
  tool_pages: ToolPageSeoEntry[];
  createdAt: Date;
  updatedAt: Date;
}
