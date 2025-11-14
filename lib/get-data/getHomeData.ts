import { getClient } from "../clients";
import { homeQuery } from "../queries/homeQuery";

const getHomeData = async () => {
  try {
    const { data } = await getClient().query({
      query: homeQuery(),
    });
    return data;
  } catch (error) {
    "errrror:: " + error;
  }
};

export default getHomeData;
