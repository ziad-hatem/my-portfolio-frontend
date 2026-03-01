import { cache } from "react";
import { getHomeBundleData } from "../content-service";

/**
 * Fetches all data needed for the home page.
 * Wrapped with React.cache() to deduplicate calls within the same render cycle
 * (e.g. generateMetadata + the page component both calling it).
 */
const getHomeData = cache(async () => {
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
});

export default getHomeData;
