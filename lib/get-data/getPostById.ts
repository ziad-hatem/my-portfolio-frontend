import { getClient } from "../clients";
import { postByIdQuery } from "../queries/postByIdQuery";

const getPostById = async (id: string) => {
  try {
    const { data } = await getClient().query({
      query: postByIdQuery(),
      variables: { id },
    });
    return data;
  } catch (error) {
    "Error fetching post by id: " + error;
  }
};

export default getPostById;
