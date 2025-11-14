import { ContactPage } from "@/Cpages/ContactPage/ContactPage";
import getStaticMetaData from "@/utils/seo/getStaticMetaData";
export async function generateMetadata() {
  const followIndex = process.env.NEXT_PUBLIC_FOLLOW_INDEX || false;

  try {
    const metadata = getStaticMetaData({
      title: "Contact Me | Ziad Hatem - Frontend Developer",
      description:
        "Get in touch with me for web development opportunities, collaborations, or project inquiries. Front-end developer skilled in React, Next.js, TypeScript, Tailwind CSS, and Redux.",
      keywords:
        "contact, hire frontend developer, web development, React developer, Next.js developer, freelance, collaboration",
      isRobotFollow: followIndex as boolean,
    });

    return {
      ...metadata,
      metadataBase: new URL(
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"
      ),
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Contact | Frontend Developer",
      description: "Get in touch for web development opportunities.",
      metadataBase: new URL(
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"
      ),
    };
  }
}

export default function Contact() {
  return <ContactPage />;
}
