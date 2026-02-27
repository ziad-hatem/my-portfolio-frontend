"use client";

import { ArrowUpDown, Search } from "lucide-react";
import { SortDirection } from "../_types/admin-ui";

export interface AdminSortOption {
  value: string;
  label: string;
}

interface AdminSearchSortBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortDir: SortDirection;
  onToggleSortDir: () => void;
  sortOptions: AdminSortOption[];
  searchPlaceholder?: string;
}

export default function AdminSearchSortBar({
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortDir,
  onToggleSortDir,
  sortOptions,
  searchPlaceholder = "Search",
}: AdminSearchSortBarProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/70 p-3 space-y-3">
      <label className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
        <Search size={14} className="text-muted-foreground" aria-hidden="true" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className="flex items-center gap-2">
        <select
          value={sortBy}
          onChange={(event) => onSortByChange(event.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onToggleSortDir}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm"
        >
          <ArrowUpDown size={14} aria-hidden="true" />
          {sortDir === "asc" ? "Asc" : "Desc"}
        </button>
      </div>
    </div>
  );
}
