import { Collection } from "mongodb";
import { nanoid } from "nanoid";
import { getDatabase } from "./mongodb";
import {
  HomeContentDoc,
  PostContentDoc,
  ProjectContentDoc,
  SeoSettings,
  SkillEntry,
  ToolPageSeoEntry,
  ToolsContentDoc,
} from "./content-types";
import {
  buildPostOgAssetKey,
  buildPostOgPath,
  buildProjectOgAssetKey,
  buildProjectOgPath,
} from "./og-keys";

export const CONTENT_HOME_COLLECTION = "content_home";
export const CONTENT_PROJECTS_COLLECTION = "content_projects";
export const CONTENT_POSTS_COLLECTION = "content_posts";
export const CONTENT_TOOLS_COLLECTION = "content_tools";
export const OG_ASSETS_COLLECTION = "og_assets";

type SkillInput = string | { id?: string; skill_name: string };
type SeoSettingsInput = Partial<Omit<SeoSettings, "seo_image">> & {
  seo_image?: { permalink?: string };
};
type ToolPageSeoInput = {
  slug?: string;
  label?: string;
  path?: string;
  seo_settings?: SeoSettingsInput;
};

export type HomeContentUpdateInput = Partial<
  Omit<HomeContentDoc, "key" | "createdAt" | "updatedAt">
>;

export type ToolsContentUpdateInput = Partial<
  Omit<ToolsContentDoc, "key" | "createdAt" | "updatedAt">
>;

export interface CreateProjectInput {
  id?: string;
  title: string;
  company_name?: string;
  project_description: string;
  project_image?: { permalink?: string };
  seo_settings?: SeoSettingsInput;
  project_overview?: string[];
  project_name?: string;
  project_link?: string;
  skills?: SkillInput[];
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export interface CreatePostInput {
  id?: string;
  title: string;
  author?: string;
  post_text: string;
  post_image?: { permalink?: string };
  seo_settings?: SeoSettingsInput;
  publish_date?: string;
  permalink?: string;
}

export type UpdatePostInput = Partial<CreatePostInput>;

let ensureInfraPromise: Promise<void> | null = null;

function normalizeSkills(skills: SkillInput[] | undefined): SkillEntry[] {
  if (!skills || skills.length === 0) {
    return [];
  }

  return skills.map((skill) => {
    if (typeof skill === "string") {
      return {
        id: nanoid(8),
        skill_name: skill.trim(),
      };
    }

    return {
      id: skill.id || nanoid(8),
      skill_name: skill.skill_name.trim(),
    };
  });
}

function stripMongoId<T>(doc: T & { _id?: unknown }): T {
  const { _id, ...rest } = doc as T & { _id?: unknown };
  return rest as T;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function sanitizeSeoSettings(
  input: SeoSettingsInput | undefined,
  fallback: {
    title: string;
    description: string;
    keywords: string;
    imagePermalink: string;
  }
): SeoSettings {
  return {
    seo_title: input?.seo_title?.trim() || fallback.title,
    seo_description: input?.seo_description?.trim() || fallback.description,
    seo_keywords: input?.seo_keywords?.trim() || fallback.keywords,
    seo_image: {
      permalink: input?.seo_image?.permalink?.trim() || fallback.imagePermalink,
    },
  };
}

function buildProjectKeywordFallback(
  skills: SkillEntry[],
  description: string
): string {
  const skillKeywords = skills
    .map((skill) => skill.skill_name.trim())
    .filter(Boolean)
    .join(", ");

  if (skillKeywords) {
    return skillKeywords;
  }

  return description.slice(0, 180);
}

function buildPostKeywordFallback(
  title: string,
  author: string,
  body: string
): string {
  const base = [title.trim(), author.trim()].filter(Boolean).join(", ");
  if (base) {
    return base;
  }

  return body.slice(0, 180);
}

const TOOLS_INDEX_FALLBACK = {
  title: "Developer Tools | Free Browser Utilities",
  description:
    "A practical suite of browser-based tools: Image to PDF and PDF compression. Privacy-first with local processing.",
  keywords:
    "developer tools, image to pdf, compress pdf, privacy first tools, browser utilities",
  imagePermalink: "/tools/opengraph-image",
};

const TOOL_PAGE_FALLBACKS: ToolPageSeoEntry[] = [
  {
    slug: "image-to-pdf",
    label: "Image to PDF",
    path: "/tools/image-to-pdf",
    seo_settings: {
      seo_title: "Image to PDF Converter | Fast, Private, Shareable",
      seo_description:
        "Convert JPG, PNG, GIF, and HEIC files to PDF with server-first processing, 1-hour share links, and local fallback.",
      seo_keywords:
        "image to pdf, heic to pdf, jpg to pdf, png to pdf, share pdf link, temporary file sharing",
      seo_image: {
        permalink: "/tools/image-to-pdf/opengraph-image",
      },
    },
  },
  {
    slug: "compress-pdf",
    label: "Compress PDF",
    path: "/tools/compress-pdf",
    seo_settings: {
      seo_title: "Compress PDF | Reduce File Size Online | Privacy First",
      seo_description:
        "Optimize and compress PDF file size directly in your browser. Secure, local processing with no server uploads.",
      seo_keywords:
        "compress pdf, reduce pdf size, optimize pdf, shrink pdf, offline pdf compressor, local pdf compression",
      seo_image: {
        permalink: "/tools/compress-pdf/opengraph-image",
      },
    },
  },
];

function cloneToolPageFallbacks(): ToolPageSeoEntry[] {
  return TOOL_PAGE_FALLBACKS.map((entry) => ({
    ...entry,
    seo_settings: {
      ...entry.seo_settings,
      seo_image: {
        permalink: entry.seo_settings.seo_image.permalink,
      },
    },
  }));
}

function normalizeToolSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function defaultToolLabel(slug: string): string {
  if (!slug) {
    return "Tool";
  }

  return slug
    .split("-")
    .map((part) => (part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : ""))
    .join(" ")
    .trim();
}

function normalizeToolPath(path: string | undefined, slug: string): string {
  const raw = path?.trim();
  if (raw) {
    if (raw.startsWith("/")) {
      return raw;
    }

    return `/${raw}`;
  }

  return `/tools/${slug}`;
}

function findToolFallbackBySlug(slug: string): ToolPageSeoEntry | undefined {
  return TOOL_PAGE_FALLBACKS.find((entry) => entry.slug === slug);
}

function sanitizeToolPageEntry(
  input: ToolPageSeoInput,
  fallback: ToolPageSeoEntry
): ToolPageSeoEntry | null {
  const slug = normalizeToolSlug(input.slug || fallback.slug);
  if (!slug) {
    return null;
  }

  const fallbackForSlug = findToolFallbackBySlug(slug);
  const effectiveFallback = fallbackForSlug || fallback;
  const label = input.label?.trim() || effectiveFallback.label || defaultToolLabel(slug);
  const path = normalizeToolPath(
    input.path || effectiveFallback.path,
    slug
  );

  return {
    slug,
    label,
    path,
    seo_settings: sanitizeSeoSettings(input.seo_settings, {
      title:
        effectiveFallback.seo_settings.seo_title ||
        `${label} | Developer Tool`,
      description:
        effectiveFallback.seo_settings.seo_description ||
        `Use the ${label} tool in your browser.`,
      keywords:
        effectiveFallback.seo_settings.seo_keywords || `${slug}, developer tool`,
      imagePermalink:
        effectiveFallback.seo_settings.seo_image?.permalink || "/cover.jpg",
    }),
  };
}

function sanitizeToolPages(
  input: ToolPageSeoInput[] | undefined,
  fallbackPages: ToolPageSeoEntry[]
): ToolPageSeoEntry[] {
  const source = Array.isArray(input)
    ? input
    : fallbackPages.map((entry) => ({
        slug: entry.slug,
        label: entry.label,
        path: entry.path,
        seo_settings: entry.seo_settings,
      }));

  const fallbackBySlug = new Map(
    fallbackPages.map((entry) => [normalizeToolSlug(entry.slug), entry] as const)
  );

  const result: ToolPageSeoEntry[] = [];
  const seen = new Set<string>();

  for (const rawEntry of source) {
    const entry =
      rawEntry && typeof rawEntry === "object" ? rawEntry : ({} as ToolPageSeoInput);
    const rawSlug =
      typeof entry.slug === "string" ? entry.slug : "";
    const normalizedSlug = normalizeToolSlug(rawSlug);
    const fallback =
      fallbackBySlug.get(normalizedSlug) ||
      findToolFallbackBySlug(normalizedSlug) || {
        slug: normalizedSlug || "tool",
        label: defaultToolLabel(normalizedSlug),
        path: normalizeToolPath(undefined, normalizedSlug || "tool"),
        seo_settings: {
          seo_title: normalizedSlug
            ? `${defaultToolLabel(normalizedSlug)} | Developer Tool`
            : "Developer Tool",
          seo_description: normalizedSlug
            ? `Use the ${defaultToolLabel(normalizedSlug)} tool in your browser.`
            : "Use this developer tool in your browser.",
          seo_keywords: normalizedSlug
            ? `${normalizedSlug}, developer tool`
            : "developer tool",
          seo_image: {
            permalink: "/cover.jpg",
          },
        },
      };

    const sanitized = sanitizeToolPageEntry(entry, fallback);
    if (!sanitized || seen.has(sanitized.slug)) {
      continue;
    }

    seen.add(sanitized.slug);
    result.push(sanitized);
  }

  if (result.length > 0) {
    return result;
  }

  return cloneToolPageFallbacks();
}

function createDefaultToolsContent(now: Date): ToolsContentDoc {
  return {
    key: "default",
    tools_index_seo: {
      seo_title: TOOLS_INDEX_FALLBACK.title,
      seo_description: TOOLS_INDEX_FALLBACK.description,
      seo_keywords: TOOLS_INDEX_FALLBACK.keywords,
      seo_image: {
        permalink: TOOLS_INDEX_FALLBACK.imagePermalink,
      },
    },
    tool_pages: cloneToolPageFallbacks(),
    createdAt: now,
    updatedAt: now,
  };
}

function createDefaultHome(now: Date): HomeContentDoc {
  return {
    key: "default",
    name: "Frontend Developer",
    role: "Full Stack Engineer",
    description:
      "Building fast, reliable interfaces and scalable web products with modern JavaScript tooling.",
    social_links: [
      {
        id: nanoid(8),
        social_icon: { permalink: "/logo.png" },
        social_link: "https://linkedin.com",
      },
    ],
    buttons: [
      {
        id: nanoid(8),
        buttton_text: "View Projects",
        button_link: "/projects",
        fill_background: true,
      },
      {
        id: nanoid(8),
        buttton_text: "Contact Me",
        button_link: "/contact",
        fill_background: false,
      },
    ],
    featured_projects_section_1title: "Featured Projects",
    featured_projects_section_1project_description:
      "A curated set of recent projects from production work and experiments.",
    experience_section_1title: "Experience",
    experience_section_1description:
      "Hands-on delivery across startup and enterprise web projects.",
    experience_section_1replicator_field: [
      {
        id: nanoid(8),
        company_name: "Your Company",
        job_title: "Frontend Developer",
        job_description:
          "Shipped responsive interfaces, improved performance, and maintained design-system quality.",
        from: "Jan 2024",
        to: "Present",
        present: true,
      },
    ],
    technology_section_1section_title: "Technologies",
    technology_section_1description:
      "Core stack used for delivery, quality, and performance.",
    technology_section_1skills: [
      { id: nanoid(8), skill_name: "React" },
      { id: nanoid(8), skill_name: "Next.js" },
      { id: nanoid(8), skill_name: "TypeScript" },
      { id: nanoid(8), skill_name: "MongoDB" },
    ],
    post_sectiontitle: "Latest Posts",
    post_sectiondescription:
      "Technical notes and practical lessons from real-world projects.",
    seo_settings: {
      seo_image: { permalink: "/cover.jpg" },
      seo_title: "Frontend Developer Portfolio",
      seo_description:
        "Portfolio showcasing production-grade web projects and engineering practice.",
      seo_keywords:
        "frontend developer, next.js, react, typescript, portfolio, web engineering",
    },
    createdAt: now,
    updatedAt: now,
  };
}

function buildProjectDoc(input: CreateProjectInput, now: Date): ProjectContentDoc {
  const id = input.id?.trim() || slugify(input.title) || nanoid(10);
  const updatedAt = now;
  const ogAssetKey = buildProjectOgAssetKey(id, updatedAt);
  const title = input.title.trim();
  const companyName = input.company_name?.trim() || "";
  const description = input.project_description.trim();
  const imagePermalink = input.project_image?.permalink?.trim() || "/cover.jpg";
  const normalizedSkills = normalizeSkills(input.skills);

  return {
    id,
    title,
    company_name: companyName,
    project_description: description,
    project_image: {
      permalink: imagePermalink,
    },
    seo_settings: sanitizeSeoSettings(input.seo_settings, {
      title,
      description,
      imagePermalink,
      keywords: buildProjectKeywordFallback(normalizedSkills, description),
    }),
    project_overview: input.project_overview || [],
    project_name: input.project_name?.trim() || title,
    project_link: input.project_link?.trim() || "",
    skills: normalizedSkills,
    ogAssetKey,
    ogImagePath: buildProjectOgPath(ogAssetKey),
    createdAt: now,
    updatedAt,
  };
}

function buildPostDoc(input: CreatePostInput, now: Date): PostContentDoc {
  const id = input.id?.trim() || slugify(input.title) || nanoid(10);
  const updatedAt = now;
  const ogAssetKey = buildPostOgAssetKey(id, updatedAt);
  const title = input.title.trim();
  const author = input.author?.trim() || "Frontend Developer";
  const postText = input.post_text.trim();
  const imagePermalink = input.post_image?.permalink?.trim() || "/cover.jpg";

  return {
    id,
    title,
    author,
    post_text: postText,
    post_image: {
      permalink: imagePermalink,
    },
    seo_settings: sanitizeSeoSettings(input.seo_settings, {
      title,
      description: postText.slice(0, 180),
      imagePermalink,
      keywords: buildPostKeywordFallback(title, author, postText),
    }),
    publish_date: input.publish_date?.trim() || now.getFullYear().toString(),
    permalink: input.permalink?.trim() || `/posts/${id}`,
    ogAssetKey,
    ogImagePath: buildPostOgPath(ogAssetKey),
    createdAt: now,
    updatedAt,
  };
}

function withProjectSeoDefaults(doc: ProjectContentDoc): ProjectContentDoc {
  const description = doc.project_description || "";
  const imagePermalink = doc.project_image?.permalink || "/cover.jpg";
  const skills = doc.skills || [];

  return {
    ...doc,
    project_image: {
      permalink: imagePermalink,
    },
    seo_settings: sanitizeSeoSettings(doc.seo_settings, {
      title: doc.title || doc.project_name || "Project",
      description,
      imagePermalink,
      keywords: buildProjectKeywordFallback(skills, description),
    }),
  };
}

function withPostSeoDefaults(doc: PostContentDoc): PostContentDoc {
  const postText = doc.post_text || "";
  const imagePermalink = doc.post_image?.permalink || "/cover.jpg";
  const title = doc.title || "Post";
  const author = doc.author || "Frontend Developer";

  return {
    ...doc,
    post_image: {
      permalink: imagePermalink,
    },
    seo_settings: sanitizeSeoSettings(doc.seo_settings, {
      title,
      description: postText.slice(0, 180),
      imagePermalink,
      keywords: buildPostKeywordFallback(title, author, postText),
    }),
  };
}

function withToolsSeoDefaults(doc: ToolsContentDoc): ToolsContentDoc {
  const fallbackPages = cloneToolPageFallbacks();
  const currentPages = Array.isArray(doc.tool_pages) ? doc.tool_pages : [];
  const seen = new Set(
    currentPages.map((entry) => normalizeToolSlug(entry.slug)).filter(Boolean)
  );

  const mergedPagesInput: ToolPageSeoInput[] = currentPages.map((entry) => ({
    slug: entry.slug,
    label: entry.label,
    path: entry.path,
    seo_settings: entry.seo_settings,
  }));

  for (const fallback of fallbackPages) {
    if (seen.has(fallback.slug)) {
      continue;
    }

    mergedPagesInput.push({
      slug: fallback.slug,
      label: fallback.label,
      path: fallback.path,
      seo_settings: fallback.seo_settings,
    });
  }

  return {
    ...doc,
    tools_index_seo: sanitizeSeoSettings(doc.tools_index_seo, {
      title: TOOLS_INDEX_FALLBACK.title,
      description: TOOLS_INDEX_FALLBACK.description,
      keywords: TOOLS_INDEX_FALLBACK.keywords,
      imagePermalink: TOOLS_INDEX_FALLBACK.imagePermalink,
    }),
    tool_pages: sanitizeToolPages(mergedPagesInput, fallbackPages),
  };
}

async function getHomeCollection(): Promise<Collection<HomeContentDoc>> {
  const db = await getDatabase();
  return db.collection<HomeContentDoc>(CONTENT_HOME_COLLECTION);
}

async function getProjectsCollection(): Promise<Collection<ProjectContentDoc>> {
  const db = await getDatabase();
  return db.collection<ProjectContentDoc>(CONTENT_PROJECTS_COLLECTION);
}

async function getPostsCollection(): Promise<Collection<PostContentDoc>> {
  const db = await getDatabase();
  return db.collection<PostContentDoc>(CONTENT_POSTS_COLLECTION);
}

async function getToolsCollection(): Promise<Collection<ToolsContentDoc>> {
  const db = await getDatabase();
  return db.collection<ToolsContentDoc>(CONTENT_TOOLS_COLLECTION);
}

async function seedPlaceholderContent(): Promise<void> {
  const now = new Date();
  const homeCollection = await getHomeCollection();
  const projectsCollection = await getProjectsCollection();
  const postsCollection = await getPostsCollection();
  const toolsCollection = await getToolsCollection();

  const homeCount = await homeCollection.countDocuments();
  if (homeCount === 0) {
    await homeCollection.insertOne(createDefaultHome(now));
  }

  const projectCount = await projectsCollection.countDocuments();
  if (projectCount === 0) {
    const defaultProjects: ProjectContentDoc[] = [
      buildProjectDoc(
        {
          id: "portfolio-rebuild",
          title: "Portfolio Rebuild",
          company_name: "Personal Project",
          project_description:
            "Rebuilt portfolio architecture with internal APIs, structured content, and maintainable backend patterns.",
          project_image: { permalink: "/cover.jpg" },
          project_overview: [
            "Replaced deleted external backend dependencies.",
            "Introduced content APIs and admin CRUD endpoints.",
            "Added persistent OG asset generation with immutable caching.",
          ],
          project_link: "https://example.com",
          skills: ["Next.js", "TypeScript", "MongoDB", "API Design"],
        },
        now
      ),
      buildProjectDoc(
        {
          id: "dashboard-platform",
          title: "Dashboard Platform",
          company_name: "Client Work",
          project_description:
            "Delivered a role-aware dashboard with data-heavy reporting and reusable UI architecture.",
          project_image: { permalink: "/cover.png" },
          project_overview: [
            "Modular dashboard widgets and charting layout.",
            "API-backed filtering and exports.",
            "Performance tuning for large datasets.",
          ],
          project_link: "https://example.com",
          skills: ["React", "Next.js", "Tailwind", "Performance"],
        },
        new Date(now.getTime() - 1000)
      ),
    ];

    await projectsCollection.insertMany(defaultProjects);
  }

  const postCount = await postsCollection.countDocuments();
  if (postCount === 0) {
    const defaultPosts: PostContentDoc[] = [
      buildPostDoc(
        {
          id: "backend-rewrite-notes",
          title: "Backend Rewrite Notes",
          author: "Frontend Developer",
          post_text:
            "<p>This post covers practical lessons from replacing a deleted backend with a Next.js API architecture.</p>",
          post_image: { permalink: "/cover.jpg" },
          publish_date: "2026",
          permalink: "/posts/backend-rewrite-notes",
        },
        now
      ),
      buildPostDoc(
        {
          id: "og-caching-strategy",
          title: "OG Image Caching Strategy",
          author: "Frontend Developer",
          post_text:
            "<p>How to render Open Graph assets once, persist them, and serve them with immutable one-year caching headers.</p>",
          post_image: { permalink: "/cover.png" },
          publish_date: "2026",
          permalink: "/posts/og-caching-strategy",
        },
        new Date(now.getTime() - 1000)
      ),
    ];

    await postsCollection.insertMany(defaultPosts);
  }

  const toolsCount = await toolsCollection.countDocuments();
  if (toolsCount === 0) {
    await toolsCollection.insertOne(createDefaultToolsContent(now));
  }
}

async function ensureInfrastructureInternal(): Promise<void> {
  const homeCollection = await getHomeCollection();
  const projectsCollection = await getProjectsCollection();
  const postsCollection = await getPostsCollection();
  const toolsCollection = await getToolsCollection();
  const db = await getDatabase();
  const ogAssetsCollection = db.collection(OG_ASSETS_COLLECTION);

  await Promise.all([
    homeCollection.createIndex({ key: 1 }, { unique: true }),
    projectsCollection.createIndex({ id: 1 }, { unique: true }),
    postsCollection.createIndex({ id: 1 }, { unique: true }),
    toolsCollection.createIndex({ key: 1 }, { unique: true }),
    ogAssetsCollection.createIndex({ assetKey: 1 }, { unique: true }),
  ]);

  await seedPlaceholderContent();
}

export async function ensureContentInfrastructure(): Promise<void> {
  if (!ensureInfraPromise) {
    ensureInfraPromise = ensureInfrastructureInternal().catch((error) => {
      ensureInfraPromise = null;
      throw error;
    });
  }

  await ensureInfraPromise;
}

export async function getHomeContent(): Promise<HomeContentDoc | null> {
  await ensureContentInfrastructure();
  const homeCollection = await getHomeCollection();
  const doc = await homeCollection.findOne({ key: "default" });
  if (!doc) {
    return null;
  }

  return stripMongoId(doc as HomeContentDoc & { _id?: unknown });
}

export async function getToolsContent(): Promise<ToolsContentDoc | null> {
  await ensureContentInfrastructure();
  const toolsCollection = await getToolsCollection();
  const doc = await toolsCollection.findOne({ key: "default" });
  if (!doc) {
    return null;
  }

  return withToolsSeoDefaults(
    stripMongoId(doc as ToolsContentDoc & { _id?: unknown })
  );
}

export async function getToolPageSeoBySlug(
  slug: string
): Promise<ToolPageSeoEntry | null> {
  const normalizedSlug = normalizeToolSlug(slug);
  if (!normalizedSlug) {
    return null;
  }

  const toolsContent = await getToolsContent();
  if (!toolsContent) {
    return null;
  }

  const match = toolsContent.tool_pages.find(
    (entry) => normalizeToolSlug(entry.slug) === normalizedSlug
  );

  return match || null;
}

export async function listProjectsContent(): Promise<ProjectContentDoc[]> {
  await ensureContentInfrastructure();
  const projectsCollection = await getProjectsCollection();
  const docs = await projectsCollection.find().sort({ updatedAt: -1 }).toArray();
  return docs.map((doc) =>
    withProjectSeoDefaults(
      stripMongoId(doc as ProjectContentDoc & { _id?: unknown })
    )
  );
}

export async function getProjectContentById(
  id: string
): Promise<ProjectContentDoc | null> {
  await ensureContentInfrastructure();
  const projectsCollection = await getProjectsCollection();
  const doc = await projectsCollection.findOne({ id });
  if (!doc) {
    return null;
  }

  return withProjectSeoDefaults(
    stripMongoId(doc as ProjectContentDoc & { _id?: unknown })
  );
}

export async function listPostsContent(): Promise<PostContentDoc[]> {
  await ensureContentInfrastructure();
  const postsCollection = await getPostsCollection();
  const docs = await postsCollection.find().sort({ updatedAt: -1 }).toArray();
  return docs.map((doc) =>
    withPostSeoDefaults(stripMongoId(doc as PostContentDoc & { _id?: unknown }))
  );
}

export async function getPostContentById(
  id: string
): Promise<PostContentDoc | null> {
  await ensureContentInfrastructure();
  const postsCollection = await getPostsCollection();
  const doc = await postsCollection.findOne({ id });
  if (!doc) {
    return null;
  }

  return withPostSeoDefaults(
    stripMongoId(doc as PostContentDoc & { _id?: unknown })
  );
}

export async function updateHomeContent(
  patch: HomeContentUpdateInput
): Promise<HomeContentDoc | null> {
  await ensureContentInfrastructure();
  const homeCollection = await getHomeCollection();
  const existing = await homeCollection.findOne({ key: "default" });

  if (!existing) {
    return null;
  }

  const now = new Date();
  const nextDoc: HomeContentDoc = {
    ...existing,
    ...patch,
    seo_settings: patch.seo_settings
      ? {
          ...existing.seo_settings,
          ...patch.seo_settings,
          seo_image: patch.seo_settings.seo_image || existing.seo_settings.seo_image,
        }
      : existing.seo_settings,
    updatedAt: now,
  };

  await homeCollection.updateOne(
    { key: "default" },
    {
      $set: nextDoc,
    }
  );

  return nextDoc;
}

export async function updateToolsContent(
  patch: ToolsContentUpdateInput
): Promise<ToolsContentDoc | null> {
  await ensureContentInfrastructure();
  const toolsCollection = await getToolsCollection();
  const existing = await toolsCollection.findOne({ key: "default" });

  if (!existing) {
    return null;
  }

  const normalizedExisting = withToolsSeoDefaults(
    stripMongoId(existing as ToolsContentDoc & { _id?: unknown })
  );
  const now = new Date();
  const nextDoc: ToolsContentDoc = {
    ...normalizedExisting,
    tools_index_seo: patch.tools_index_seo
      ? sanitizeSeoSettings(patch.tools_index_seo, {
          title: normalizedExisting.tools_index_seo.seo_title,
          description: normalizedExisting.tools_index_seo.seo_description,
          keywords: normalizedExisting.tools_index_seo.seo_keywords,
          imagePermalink:
            normalizedExisting.tools_index_seo.seo_image?.permalink || "/cover.jpg",
        })
      : normalizedExisting.tools_index_seo,
    tool_pages:
      patch.tool_pages !== undefined
        ? sanitizeToolPages(patch.tool_pages, normalizedExisting.tool_pages)
        : normalizedExisting.tool_pages,
    updatedAt: now,
  };

  await toolsCollection.updateOne(
    { key: "default" },
    {
      $set: nextDoc,
    }
  );

  return withToolsSeoDefaults(nextDoc);
}

export async function createProjectContent(
  input: CreateProjectInput
): Promise<ProjectContentDoc> {
  await ensureContentInfrastructure();
  const projectsCollection = await getProjectsCollection();
  const now = new Date();
  const projectDoc = buildProjectDoc(input, now);
  await projectsCollection.insertOne(projectDoc);
  return projectDoc;
}

export async function updateProjectContent(
  id: string,
  patch: UpdateProjectInput
): Promise<ProjectContentDoc | null> {
  await ensureContentInfrastructure();
  const projectsCollection = await getProjectsCollection();
  const existing = await projectsCollection.findOne({ id });

  if (!existing) {
    return null;
  }

  const now = new Date();
  const title = (patch.title ?? existing.title).trim();
  const companyName = (patch.company_name ?? existing.company_name).trim();
  const projectDescription = (
    patch.project_description ?? existing.project_description
  ).trim();
  const imagePermalink =
    patch.project_image?.permalink?.trim() ||
    existing.project_image?.permalink ||
    "/cover.jpg";
  const projectOverview =
    patch.project_overview !== undefined
      ? patch.project_overview
      : existing.project_overview || [];
  const projectName = (
    patch.project_name ??
    existing.project_name ??
    patch.title ??
    existing.title
  ).trim();
  const projectLink = (patch.project_link ?? existing.project_link).trim();
  const skills =
    patch.skills !== undefined ? normalizeSkills(patch.skills) : existing.skills;
  const seoSettings = sanitizeSeoSettings(
    patch.seo_settings ?? existing.seo_settings,
    {
      title,
      description: projectDescription,
      imagePermalink,
      keywords: buildProjectKeywordFallback(skills, projectDescription),
    }
  );

  const nextDoc: ProjectContentDoc = {
    ...existing,
    ...patch,
    id: existing.id,
    title,
    company_name: companyName,
    project_description: projectDescription,
    project_image: {
      permalink: imagePermalink,
    },
    seo_settings: seoSettings,
    project_overview: projectOverview,
    project_name: projectName,
    project_link: projectLink,
    skills,
    updatedAt: now,
    ogAssetKey: buildProjectOgAssetKey(existing.id, now),
    ogImagePath: "",
  };

  nextDoc.ogImagePath = buildProjectOgPath(nextDoc.ogAssetKey);

  await projectsCollection.updateOne({ id }, { $set: nextDoc });
  return nextDoc;
}

export async function deleteProjectContent(id: string): Promise<boolean> {
  await ensureContentInfrastructure();
  const projectsCollection = await getProjectsCollection();
  const result = await projectsCollection.deleteOne({ id });
  return result.deletedCount > 0;
}

export async function createPostContent(
  input: CreatePostInput
): Promise<PostContentDoc> {
  await ensureContentInfrastructure();
  const postsCollection = await getPostsCollection();
  const now = new Date();
  const postDoc = buildPostDoc(input, now);
  await postsCollection.insertOne(postDoc);
  return postDoc;
}

export async function updatePostContent(
  id: string,
  patch: UpdatePostInput
): Promise<PostContentDoc | null> {
  await ensureContentInfrastructure();
  const postsCollection = await getPostsCollection();
  const existing = await postsCollection.findOne({ id });

  if (!existing) {
    return null;
  }

  const now = new Date();
  const title = (patch.title ?? existing.title).trim();
  const author = (patch.author ?? existing.author).trim();
  const postText = (patch.post_text ?? existing.post_text).trim();
  const imagePermalink =
    patch.post_image?.permalink?.trim() ||
    existing.post_image?.permalink ||
    "/cover.jpg";
  const publishDate = (patch.publish_date ?? existing.publish_date).trim();
  const permalink = (patch.permalink ?? existing.permalink).trim();
  const seoSettings = sanitizeSeoSettings(
    patch.seo_settings ?? existing.seo_settings,
    {
      title,
      description: postText.slice(0, 180),
      imagePermalink,
      keywords: buildPostKeywordFallback(title, author, postText),
    }
  );

  const nextDoc: PostContentDoc = {
    ...existing,
    ...patch,
    id: existing.id,
    title,
    author,
    post_text: postText,
    post_image: {
      permalink: imagePermalink,
    },
    seo_settings: seoSettings,
    publish_date: publishDate,
    permalink,
    updatedAt: now,
    ogAssetKey: buildPostOgAssetKey(existing.id, now),
    ogImagePath: "",
  };

  nextDoc.ogImagePath = buildPostOgPath(nextDoc.ogAssetKey);

  await postsCollection.updateOne({ id }, { $set: nextDoc });
  return nextDoc;
}

export async function deletePostContent(id: string): Promise<boolean> {
  await ensureContentInfrastructure();
  const postsCollection = await getPostsCollection();
  const result = await postsCollection.deleteOne({ id });
  return result.deletedCount > 0;
}
