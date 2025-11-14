const { gql } = require("@apollo/client");

export const postsQuery = () => {
  const query = gql`
    query AllPosts {
      entries(collection: "posts") {
        data {
          ... on Entry_Posts_Post {
            id
            author
            post_image {
              permalink
            }
            post_text
            publish_date(format: "Y")
            title
          }
        }
      }
    }
  `;
  return query;
};
