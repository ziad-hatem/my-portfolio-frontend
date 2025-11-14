import { getClient } from "../clients";
import { postsQuery } from "../queries/postsQuery";

const getPostsData = async () => {
  try {
    const { data } = await getClient().query({
      query: postsQuery(),
    });
    return data;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return null;
  }
};

export default getPostsData;
