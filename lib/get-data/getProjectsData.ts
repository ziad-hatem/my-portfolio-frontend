import { getClient } from "../clients";
import { projectsQuery } from "../queries/projectsQuery";

const getProjectsData = async () => {
  try {
    const { data } = await getClient().query({
      query: projectsQuery(),
    });
    return data;
  } catch (error) {
    "Error fetching projects: " + error;
  }
};

export default getProjectsData;
