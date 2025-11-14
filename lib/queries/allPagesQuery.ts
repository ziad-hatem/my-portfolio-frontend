const { gql } = require("@apollo/client");

export const allPagesQuery = () => {
  const query = gql`
    query AllPages {
      entries(collection: "pages", site: "default") {
        data {
          title
          slug
          id
          locale
          last_modified
          blueprint
        }
      }
    }
  `;
  return query;
};
