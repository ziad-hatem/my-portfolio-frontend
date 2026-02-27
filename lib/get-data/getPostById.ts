import { getPostEntryData } from "../content-service";

const getPostById = async (id: string) => {
  try {
    return await getPostEntryData(id);
  } catch (error) {
    console.error("[Content] Failed to load post by id:", error);
    return { entry: null };
  }
};

export default getPostById;
