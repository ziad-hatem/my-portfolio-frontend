const getStaticMetaData = ({
  title,
  description,
  isRobotFollow = true,
}: {
  title?: string;
  description?: string;
  isRobotFollow?: boolean;
}) => {
  return {
    title,
    description,

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
      title,
      siteName: title,
      description,
      images: [
        {
          url: "/cover.jpg",
          width: 1200,
          height: 628,
          alt: `${title} Cover Image`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: "/cover.jpg",
          width: 1200,
          height: 628,
          alt: `${title} Cover Image`,
        },
      ],
    },

    viewport: {
      width: "device-width",
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
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
