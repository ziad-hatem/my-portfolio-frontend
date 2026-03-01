import React from "react";
import { getPostsEntriesData } from "../content-service";

const getPostsData = React.cache(async () => {
  try {
    return await getPostsEntriesData();
  } catch (error) {
    console.error("[Content] Failed to load posts:", error);
    return {
      entries: { data: [] },
    };
  }
});

export default getPostsData;
