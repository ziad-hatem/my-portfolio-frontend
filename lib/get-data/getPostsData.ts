import { getPostsEntriesData } from "../content-service";

const getPostsData = async () => {
  try {
    return await getPostsEntriesData();
  } catch (error) {
    console.error("[Content] Failed to load posts:", error);
    return {
      entries: { data: [] },
    };
  }
};

export default getPostsData;
