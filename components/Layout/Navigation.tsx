"use client";

import StaggeredMenu from "../ui/StaggeredMenu";

const menuItems = [
  { label: "Home", ariaLabel: "Go to home page", link: "/" },
  { label: "Projects", ariaLabel: "View my projects", link: "/projects" },
  { label: "Posts", ariaLabel: "Read my blog posts", link: "/posts" },
  { label: "Contact", ariaLabel: "Get in touch", link: "/contact" },
];

const socialItems = [
  { label: "Twitter", link: "https://twitter.com" },
  { label: "GitHub", link: "https://github.com" },
  { label: "LinkedIn", link: "https://linkedin.com" },
];

export function Navigation() {
  return (
    <StaggeredMenu
      position="right"
      items={menuItems}
      socialItems={socialItems}
      displaySocials={true}
      displayItemNumbering={true}
      menuButtonColor="#fff"
      openMenuButtonColor="#00F3BE"
      changeMenuColorOnOpen={true}
      colors={["#00F0A0", "#26E6E6"]}
      logoUrl="/logo.png"
      accentColor="#ff6b6b"
      isFixed={true}
      // onMenuOpen={() => ("Menu opened")}
      // onMenuClose={() => ("Menu closed")}
    />
  );
}
