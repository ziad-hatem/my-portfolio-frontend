const { gql } = require("@apollo/client");

export const postByIdQuery = () => {
  const query = gql`
    query PostById($id: String!) {
      entry(id: $id) {
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
  `;
  return query;
};
