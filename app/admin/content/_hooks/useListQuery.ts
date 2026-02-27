"use client";

import { useMemo, useState } from "react";
import { ListQueryState, SortDirection } from "../_types/admin-ui";

interface UseListQueryOptions<T> {
  items: T[];
  searchFields: (item: T) => string[];
  sorters: Record<string, (a: T, b: T) => number>;
  defaultSortBy: string;
  defaultSortDir?: SortDirection;
}

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

export function useListQuery<T>({
  items,
  searchFields,
  sorters,
  defaultSortBy,
  defaultSortDir = "desc",
}: UseListQueryOptions<T>) {
  const [query, setQuery] = useState<ListQueryState>({
    search: "",
    sortBy: defaultSortBy,
    sortDir: defaultSortDir,
  });

  const filteredItems = useMemo(() => {
    const searchTerm = normalizeSearchValue(query.search);

    const filtered = items.filter((item) => {
      if (!searchTerm) {
        return true;
      }

      const haystack = searchFields(item)
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchTerm);
    });

    const sorter = sorters[query.sortBy] || sorters[defaultSortBy];
    const sorted = [...filtered].sort(sorter);

    if (query.sortDir === "asc") {
      return sorted;
    }

    return sorted.reverse();
  }, [items, query.search, query.sortBy, query.sortDir, searchFields, sorters, defaultSortBy]);

  const setSearch = (search: string) => {
    setQuery((prev) => ({
      ...prev,
      search,
    }));
  };

  const setSortBy = (sortBy: string) => {
    setQuery((prev) => ({
      ...prev,
      sortBy,
    }));
  };

  const setSortDir = (sortDir: SortDirection) => {
    setQuery((prev) => ({
      ...prev,
      sortDir,
    }));
  };

  const toggleSortDir = () => {
    setQuery((prev) => ({
      ...prev,
      sortDir: prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  return {
    query,
    filteredItems,
    setSearch,
    setSortBy,
    setSortDir,
    toggleSortDir,
  };
}
