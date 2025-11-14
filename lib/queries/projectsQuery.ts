const { gql } = require("@apollo/client");

export const projectsQuery = () => {
  const query = gql`
    query projects {
      entries(site: "default", collection: "projects") {
        data {
          ... on Entry_Projects_Project {
            id
            title
            company_name
            project_description
            project_image {
              permalink
            }
            project_overview
            project_name
            project_link
            skills {
              ... on Entry_Skills_Skill {
                id
                skill_name
              }
            }
          }
        }
      }
    }
  `;
  return query;
};
