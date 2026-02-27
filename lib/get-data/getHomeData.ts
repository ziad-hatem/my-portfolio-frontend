import { getHomeBundleData } from "../content-service";

const getHomeData = async () => {
  try {
    return await getHomeBundleData();
  } catch (error) {
    console.error("[Content] Failed to load home bundle:", error);
    return {
      home: null,
      projects: { data: [] },
      posts: { data: [] },
    };
  }
};

export default getHomeData;
