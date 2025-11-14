import { getClient } from "../clients";
import { projectByIdQuery } from "../queries/projectByIdQuery";

const getProjectById = async (id: string) => {
  try {
    const { data } = await getClient().query({
      query: projectByIdQuery(),
      variables: { id },
    });
    return data;
  } catch (error) {
    "Error fetching project by id: " + error;
  }
};

export default getProjectById;
