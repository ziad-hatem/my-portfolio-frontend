import { Organization, Person, WithContext, WebSite, BlogPosting, BreadcrumbList, CreativeWork } from "schema-dts";

const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

/**
 * Generate Person structured data for the homepage
 */
export function generatePersonSchema(data: {
  name: string;
  role: string;
  description?: string;
  url?: string;
  image?: string;
  sameAs?: string[];
}): WithContext<Person> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: data.name,
    jobTitle: data.role,
    description: data.description,
    url: data.url || baseUrl,
    image: data.image,
    sameAs: data.sameAs || [],
  };
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationSchema(data: {
  name: string;
  url?: string;
  logo?: string;
  description?: string;
}): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: data.name,
    url: data.url || baseUrl,
    logo: data.logo,
    description: data.description,
  };
}

/**
 * Generate WebSite structured data
 */
export function generateWebSiteSchema(data: {
  name: string;
  description: string;
  url?: string;
}): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: data.name,
    description: data.description,
    url: data.url || baseUrl,
  };
}

/**
 * Generate BlogPosting structured data for blog posts
 */
export function generateBlogPostSchema(data: {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  image?: string;
  url: string;
}): WithContext<BlogPosting> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: data.title,
    description: data.description,
    author: {
      "@type": "Person",
      name: data.author,
    },
    datePublished: data.datePublished,
    image: data.image,
    url: data.url,
    publisher: {
      "@type": "Person",
      name: data.author,
    },
  };
}

/**
 * Generate CreativeWork structured data for projects
 */
export function generateProjectSchema(data: {
  name: string;
  description: string;
  image?: string;
  url: string;
  author?: string;
  dateCreated?: string;
  keywords?: string[];
}): WithContext<CreativeWork> {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: data.name,
    description: data.description,
    image: data.image,
    url: data.url,
    author: data.author
      ? {
          "@type": "Person",
          name: data.author,
        }
      : undefined,
    dateCreated: data.dateCreated,
    keywords: data.keywords?.join(", "),
  };
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; url: string }>
): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/**
 * Helper function to embed structured data in a script tag
 */
export function StructuredData({ data }: { data: WithContext<any> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
