const { gql } = require("@apollo/client");

export const homeQuery = () => {
  const query = gql`
    query HomePage {
      home: entry(collection: "pages", site: "default", slug: "home") {
        ...HeroSection
        ...ProjectsSection
        ...ExperienceSection
        ...TechnologiesSection
        ...PostsSection
        ...SEOSETTINGS
      }
      projects: entries(site: "default", collection: "projects", limit: 5) {
        data {
          ... on Entry_Projects_Project {
            id
            title
            project_image {
              permalink
            }
            project_name
            company_name
            project_link
            project_overview
            project_description
            skills {
              ... on Entry_Skills_Skill {
                skill_name
              }
            }
          }
        }
      }
      posts: entries(site: "default", collection: "posts", limit: 5) {
        data {
          ... on Entry_Posts_Post {
            id
            permalink
            title
            author
            publish_date(format: "d M Y")
            post_text
            post_image {
              permalink
            }
          }
        }
      }
    }

    fragment SEOSETTINGS on Entry_Pages_Page {
      seo_settings {
        seo_image {
          permalink
        }
        seo_title
        seo_description
        seo_keywords
      }
    }

    fragment HeroSection on Entry_Pages_Page {
      name
      role
      social_links {
        ... on Set_SocialLinks_NewSet {
          id
          social_icon {
            permalink
          }
          social_link
        }
      }
      buttons {
        ... on Set_Buttons_NewSet {
          id
          buttton_text
          button_link
          fill_background
        }
      }
      description
    }

    fragment ProjectsSection on Entry_Pages_Page {
      featured_projects_section_1title
      featured_projects_section_1project_description
      featured_projects_section_1project_slider {
        ... on Entry_Projects_Project {
          id
          title
          project_image {
            permalink
          }
          project_name
          company_name
          project_link
          project_overview
          project_description
          skills {
            ... on Entry_Skills_Skill {
              skill_name
            }
          }
        }
      }
    }

    fragment ExperienceSection on Entry_Pages_Page {
      experience_section_1title
      experience_section_1description
      experience_section_1replicator_field {
        ... on Set_ExperienceSection1replicatorField_NewSet {
          id
          company_name
          job_title
          job_description
          from(format: "d M Y")
          to(format: "d M Y")
          present
        }
      }
    }

    fragment TechnologiesSection on Entry_Pages_Page {
      technology_section_1section_title
      technology_section_1description
      technology_section_1skills {
        ... on Entry_Skills_Skill {
          id
          skill_name
          skill_link
          skill_image {
            permalink
          }
        }
      }
    }

    fragment PostsSection on Entry_Pages_Page {
      post_sectiontitle
      post_sectiondescription
      post_sectionposts {
        ... on Entry_Posts_Post {
          id
          permalink
          title
          author
          publish_date(format: "d M Y")
          post_text
          post_image {
            permalink
          }
        }
      }
    }
  `;
  return query;
};
