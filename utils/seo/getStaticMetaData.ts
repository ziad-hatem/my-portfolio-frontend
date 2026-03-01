import { stripHtml } from "@/utils/stripHtml";

const getStaticMetaData = ({
  title,
  description,
  image,
  keywords,
  isRobotFollow = true,
}: {
  title?: string;
  description?: string;
  image?: string;
  keywords?: string;
  isRobotFollow?: boolean;
}) => {
  // Convert comma-separated keywords string to array
  const keywordsArray = keywords
    ? keywords.split(",").map((keyword) => keyword.trim())
    : undefined;

  // Strip HTML from description for SEO
  const cleanDescription = description ? stripHtml(description) : undefined;
  const safeTitle = title || "Portfolio";
  return {
    title: safeTitle,
    description: cleanDescription,
    keywords: keywordsArray,
    icons: {
      icon: [
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          url: "/favicons/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          url: "/favicons/favicon-16x16.png",
        },
        { rel: "icon", url: "/favicons/favicon.ico" },
      ],
      apple: {
        rel: "apple-touch-icon",
        url: "/favicons/apple-touch-icon.png",
      },
    },

    openGraph: {
      title: safeTitle,
      siteName: safeTitle,
      description: cleanDescription,
      images: [
        {
          url: image ? image : "/cover.jpg",
          width: 1200,
          height: 628,
          alt: `${safeTitle} Cover Image`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: safeTitle,
      description: cleanDescription,
      images: [
        {
          url: image ? image : "/cover.jpg",
          width: 1200,
          height: 628,
          alt: `${safeTitle} Cover Image`,
        },
      ],
    },

    robots: {
      index: isRobotFollow,
      follow: isRobotFollow,
      nocache: false,
      googleBot: {
        index: isRobotFollow,
        follow: isRobotFollow,
        noimageindex: false,
      },
    },
  };
};

export default getStaticMetaData;
