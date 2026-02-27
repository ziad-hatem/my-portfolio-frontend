"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock3,
  FileText,
  FolderKanban,
  House,
  Plus,
  TerminalSquare,
  Wrench,
} from "lucide-react";
import { HomeContentDoc, PostContentDoc, ProjectContentDoc } from "@/lib/content-types";
import AdminFeedbackBanner from "../content/_components/AdminFeedbackBanner";
import AdminPageHeader from "../content/_components/AdminPageHeader";
import AdminStatCard from "../content/_components/AdminStatCard";
import { useAdminApiKey } from "../content/_hooks/useAdminApiKey";
import { adminGet } from "../content/_lib/admin-client";
import { DashboardStatsVM } from "../content/_types/admin-ui";

function parseDateValue(value: string | Date | undefined): number {
  if (!value) {
    return 0;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString();
}

function getLatestUpdatedAt(items: Array<{ updatedAt: string | Date }>): string | null {
  if (items.length === 0) {
    return null;
  }

  let latest = items[0].updatedAt;
  let latestMs = parseDateValue(latest);

  for (const item of items) {
    const currentMs = parseDateValue(item.updatedAt);
    if (currentMs > latestMs) {
      latest = item.updatedAt;
      latestMs = currentMs;
    }
  }

  if (latest instanceof Date) {
    return latest.toISOString();
  }

  return latest;
}

export default function AdminDashboard() {
  const { ready, apiKey, draftKey, setDraftKey, saveKey, clearKey, hasKey } =
    useAdminApiKey();

  const [stats, setStats] = useState<DashboardStatsVM | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectivity, setConnectivity] = useState<"idle" | "checking" | "online" | "offline">("idle");
  const [focusInputSignal, setFocusInputSignal] = useState(0);

  const loadStats = useCallback(async () => {
    if (!hasKey) {
      setStats(null);
      setConnectivity("idle");
      setError("Add your admin key to load dashboard metrics.");
      return;
    }

    setLoading(true);
    setConnectivity("checking");
    setError(null);

    const [homeRes, projectsRes, postsRes] = await Promise.all([
      adminGet<HomeContentDoc>(apiKey, "/api/admin/content/home"),
      adminGet<ProjectContentDoc[]>(apiKey, "/api/admin/content/projects"),
      adminGet<PostContentDoc[]>(apiKey, "/api/admin/content/posts"),
    ]);

    const failed = [homeRes, projectsRes, postsRes].find((result) => !result.success);
    if (failed) {
      setConnectivity("offline");
      setError(failed.error || "Failed to load dashboard stats.");
      setLoading(false);

      if (failed.unauthorized) {
        setFocusInputSignal((current) => current + 1);
      }

      return;
    }

    const projectData = Array.isArray(projectsRes.data) ? projectsRes.data : [];
    const postData = Array.isArray(postsRes.data) ? postsRes.data : [];

    const nextStats: DashboardStatsVM = {
      home: {
        exists: Boolean(homeRes.data),
        updatedAt: homeRes.data?.updatedAt
          ? new Date(homeRes.data.updatedAt as unknown as string).toISOString()
          : null,
      },
      projects: {
        count: projectData.length,
        latestUpdatedAt: getLatestUpdatedAt(
          projectData.map((item) => ({ updatedAt: item.updatedAt }))
        ),
      },
      posts: {
        count: postData.length,
        latestUpdatedAt: getLatestUpdatedAt(postData.map((item) => ({ updatedAt: item.updatedAt }))),
      },
      checkedAt: new Date().toISOString(),
    };

    setStats(nextStats);
    setConnectivity("online");
    setLoading(false);
  }, [apiKey, hasKey]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    void loadStats();
  }, [ready, loadStats]);

  const connectivityLabel = useMemo(() => {
    if (connectivity === "online") {
      return "Connected";
    }

    if (connectivity === "offline") {
      return "Connection failed";
    }

    if (connectivity === "checking") {
      return "Checking";
    }

    return "Waiting for key";
  }, [connectivity]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Admin Dashboard"
        subtitle="Monitor content health and jump into common content operations."
        draftKey={draftKey}
        setDraftKey={setDraftKey}
        hasKey={hasKey}
        onSaveKey={saveKey}
        onClearKey={clearKey}
        focusInputSignal={focusInputSignal}
        onRefresh={() => void loadStats()}
        refreshing={loading}
      />

      {error ? <AdminFeedbackBanner variant="warning" message={error} /> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <AdminStatCard
          title="Home Content"
          value={stats?.home.exists ? "Ready" : "Missing"}
          subtitle={`Updated: ${formatTimestamp(stats?.home.updatedAt || null)}`}
          icon={<House size={16} />}
        />
        <AdminStatCard
          title="Projects"
          value={(stats?.projects.count ?? 0).toString()}
          subtitle={`Latest update: ${formatTimestamp(stats?.projects.latestUpdatedAt || null)}`}
          icon={<FolderKanban size={16} />}
        />
        <AdminStatCard
          title="Posts"
          value={(stats?.posts.count ?? 0).toString()}
          subtitle={`Latest update: ${formatTimestamp(stats?.posts.latestUpdatedAt || null)}`}
          icon={<FileText size={16} />}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-border/80 bg-card/80 p-5 lg:col-span-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Plus size={14} aria-hidden="true" />
            <span>Quick Actions</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/admin/content/home"
              className="rounded-xl border border-border/80 bg-background/60 p-4 hover:border-accent/60 transition-colors"
            >
              <p className="text-sm font-semibold text-foreground mb-1">Edit Home</p>
              <p className="text-xs text-muted-foreground">Update headline copy and SEO quickly.</p>
            </Link>
            <Link
              href="/admin/content/projects"
              className="rounded-xl border border-border/80 bg-background/60 p-4 hover:border-accent/60 transition-colors"
            >
              <p className="text-sm font-semibold text-foreground mb-1">Create Project</p>
              <p className="text-xs text-muted-foreground">Add a new project and generate OG assets.</p>
            </Link>
            <Link
              href="/admin/content/posts"
              className="rounded-xl border border-border/80 bg-background/60 p-4 hover:border-accent/60 transition-colors"
            >
              <p className="text-sm font-semibold text-foreground mb-1">Create Post</p>
              <p className="text-xs text-muted-foreground">Publish a new post entry with metadata fields.</p>
            </Link>
            <Link
              href="/admin/content/tools"
              className="rounded-xl border border-border/80 bg-background/60 p-4 hover:border-accent/60 transition-colors"
            >
              <p className="text-sm font-semibold text-foreground mb-1 inline-flex items-center gap-2">
                <Wrench size={14} aria-hidden="true" />
                Tools SEO
              </p>
              <p className="text-xs text-muted-foreground">
                Control metadata for /tools and /tools/toolname pages.
              </p>
            </Link>
            <article className="rounded-xl border border-border/80 bg-background/60 p-4">
              <p className="text-sm font-semibold text-foreground mb-1">Re-run API Smoke</p>
              <p className="text-xs text-muted-foreground mb-2">Run this command from your terminal:</p>
              <code className="block rounded-md border border-border bg-background px-2 py-2 text-[11px] break-all text-muted-foreground">
                npm run smoke:api -- --api-key &lt;ADMIN_API_KEY&gt; --base-url &lt;URL&gt;
              </code>
            </article>
          </div>
        </article>

        <article className="rounded-2xl border border-border/80 bg-card/80 p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Activity size={14} aria-hidden="true" />
            <span>System Status</span>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Session Key</dt>
              <dd className={hasKey ? "text-emerald-300" : "text-amber-300"}>
                {hasKey ? "Active" : "Missing"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">API Connectivity</dt>
              <dd
                className={
                  connectivity === "online"
                    ? "text-emerald-300"
                    : connectivity === "offline"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }
              >
                {connectivityLabel}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Last Refresh</dt>
              <dd className="text-foreground inline-flex items-center gap-1">
                <Clock3 size={12} aria-hidden="true" />
                {formatTimestamp(stats?.checkedAt || null)}
              </dd>
            </div>
          </dl>

          <div className="rounded-lg border border-border/70 bg-background/60 p-3 mt-4">
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <TerminalSquare size={12} aria-hidden="true" />
              Keep your key session-only and rotate it regularly.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
