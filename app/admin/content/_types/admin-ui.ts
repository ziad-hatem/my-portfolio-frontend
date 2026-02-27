export type SortDirection = "asc" | "desc";

export type EditorMode = "guided" | "json";

export interface ListQueryState {
  search: string;
  sortBy: string;
  sortDir: SortDirection;
}

export interface DashboardHomeStatVM {
  exists: boolean;
  updatedAt: string | null;
}

export interface DashboardCollectionStatVM {
  count: number;
  latestUpdatedAt: string | null;
}

export interface DashboardStatsVM {
  home: DashboardHomeStatVM;
  projects: DashboardCollectionStatVM;
  posts: DashboardCollectionStatVM;
  checkedAt: string;
}
