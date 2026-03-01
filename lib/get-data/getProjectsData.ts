import React from "react";
import { getProjectsEntriesData } from "../content-service";

const getProjectsData = React.cache(async () => {
  try {
    return await getProjectsEntriesData();
  } catch (error) {
    console.error("[Content] Failed to load projects:", error);
    return {
      entries: { data: [] },
    };
  }
});

export default getProjectsData;
