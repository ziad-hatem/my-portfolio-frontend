import React from "react";
import { getProjectEntryData } from "../content-service";

const getProjectById = React.cache(async (id: string) => {
  try {
    return await getProjectEntryData(id);
  } catch (error) {
    console.error("[Content] Failed to load project by id:", error);
    return { entry: null };
  }
});

export default getProjectById;
