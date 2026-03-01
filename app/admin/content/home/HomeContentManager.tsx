"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileJson, LayoutTemplate, RotateCcw, Save } from "lucide-react";
import { HomeContentDoc } from "@/lib/content-types";
import AdminFeedbackBanner from "../_components/AdminFeedbackBanner";
import AdminPageHeader from "../_components/AdminPageHeader";
import AdminSplitLayout from "../_components/AdminSplitLayout";
import { useAdminApiKey } from "../_hooks/useAdminApiKey";
import { adminGet, adminPut } from "../_lib/admin-client";
import { EditorMode } from "../_types/admin-ui";
import FormField from "../_components/forms/FormField";
import FormImageField from "../_components/forms/FormImageField";
import FormTextarea from "../_components/forms/FormTextarea";

interface HomeGuidedState {
  name: string;
  role: string;
  description: string;
  featuredProjectsTitle: string;
  postSectionTitle: string;
  postSectionDescription: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  seoImagePermalink: string;
}

const EMPTY_GUIDED_STATE: HomeGuidedState = {
  name: "",
  role: "",
  description: "",
  featuredProjectsTitle: "",
  postSectionTitle: "",
  postSectionDescription: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  seoImagePermalink: "",
};

function buildGuidedState(doc: HomeContentDoc): HomeGuidedState {
  return {
    name: doc.name || "",
    role: doc.role || "",
    description: doc.description || "",
    featuredProjectsTitle: doc.featured_projects_section_1title || "",
    postSectionTitle: doc.post_sectiontitle || "",
    postSectionDescription: doc.post_sectiondescription || "",
    seoTitle: doc.seo_settings?.seo_title || "",
    seoDescription: doc.seo_settings?.seo_description || "",
    seoKeywords: doc.seo_settings?.seo_keywords || "",
    seoImagePermalink: doc.seo_settings?.seo_image?.permalink || "",
  };
}

function buildGuidedPatch(state: HomeGuidedState): Record<string, unknown> {
  return {
    name: state.name.trim(),
    role: state.role.trim(),
    description: state.description.trim(),
    featured_projects_section_1title: state.featuredProjectsTitle.trim(),
    post_sectiontitle: state.postSectionTitle.trim(),
    post_sectiondescription: state.postSectionDescription.trim(),
    seo_settings: {
      seo_title: state.seoTitle.trim(),
      seo_description: state.seoDescription.trim(),
      seo_keywords: state.seoKeywords.trim(),
      seo_image: {
        permalink: state.seoImagePermalink.trim() || "/cover.jpg",
      },
    },
  };
}

function toJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function formatTimestamp(value: string | Date | undefined): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString();
}

export default function HomeContentManager() {
  const { ready, apiKey, draftKey, setDraftKey, saveKey, clearKey, hasKey } =
    useAdminApiKey();

  const [home, setHome] = useState<HomeContentDoc | null>(null);
  const [mode, setMode] = useState<EditorMode>("guided");
  const [guided, setGuided] = useState<HomeGuidedState>(EMPTY_GUIDED_STATE);
  const [guidedBaseline, setGuidedBaseline] = useState(toJson(EMPTY_GUIDED_STATE));
  const [jsonBody, setJsonBody] = useState("{}");
  const [jsonBaseline, setJsonBaseline] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [focusInputSignal, setFocusInputSignal] = useState(0);

  const canRequest = useMemo(() => ready && hasKey, [ready, hasKey]);

  const applyHomeToEditors = useCallback((doc: HomeContentDoc) => {
    const nextGuided = buildGuidedState(doc);
    const nextGuidedBaseline = toJson(nextGuided);
    const nextJson = toJson(buildGuidedPatch(nextGuided));

    setGuided(nextGuided);
    setGuidedBaseline(nextGuidedBaseline);
    setJsonBody(nextJson);
    setJsonBaseline(nextJson);
  }, []);

  const loadHome = useCallback(async () => {
    if (!canRequest) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const response = await adminGet<HomeContentDoc>(apiKey, "/api/admin/content/home");

    if (!response.success) {
      setError(response.error || "Failed to load home content.");
      setLoading(false);

      if (response.unauthorized) {
        setFocusInputSignal((current) => current + 1);
      }

      return;
    }

    const doc = response.data || null;
    setHome(doc);

    if (doc) {
      applyHomeToEditors(doc);
    }

    setLoading(false);
  }, [apiKey, applyHomeToEditors, canRequest]);

  useEffect(() => {
    if (!canRequest) {
      return;
    }

    void loadHome();
  }, [canRequest, loadHome]);

  const guidedDirty = useMemo(
    () => toJson(guided) !== guidedBaseline,
    [guided, guidedBaseline]
  );

  const jsonDirty = useMemo(
    () => jsonBody.trim() !== jsonBaseline.trim(),
    [jsonBody, jsonBaseline]
  );

  const onReset = () => {
    if (!home) {
      return;
    }

    applyHomeToEditors(home);
    setError(null);
    setSuccess(null);
  };

  const onSaveGuided = async () => {
    if (!canRequest) {
      setError("Set your admin API key first.");
      setSuccess(null);
      return;
    }

    if (!guided.name.trim() || !guided.role.trim() || !guided.description.trim()) {
      setError("Name, role, and description are required.");
      setSuccess(null);
      return;
    }

    const payload = buildGuidedPatch(guided);

    setSaving(true);
    setError(null);
    setSuccess(null);

    const response = await adminPut<HomeContentDoc>(
      apiKey,
      "/api/admin/content/home",
      payload
    );

    if (!response.success) {
      setSaving(false);
      setError(response.error || "Failed to update home content.");

      if (response.unauthorized) {
        setFocusInputSignal((current) => current + 1);
      }

      return;
    }

    const nextHome = response.data || null;
    setHome(nextHome);

    if (nextHome) {
      applyHomeToEditors(nextHome);
    }

    setSaving(false);
    setSuccess("Home content updated successfully.");
  };

  const onSaveJson = async () => {
    if (!canRequest) {
      setError("Set your admin API key first.");
      setSuccess(null);
      return;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(jsonBody);
    } catch {
      setError("Advanced JSON is invalid.");
      setSuccess(null);
      return;
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      setError("Advanced JSON must be an object.");
      setSuccess(null);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const response = await adminPut<HomeContentDoc>(
      apiKey,
      "/api/admin/content/home",
      payload
    );

    if (!response.success) {
      setSaving(false);
      setError(response.error || "Failed to update home content.");

      if (response.unauthorized) {
        setFocusInputSignal((current) => current + 1);
      }

      return;
    }

    const nextHome = response.data || null;
    setHome(nextHome);

    if (nextHome) {
      applyHomeToEditors(nextHome);
    }

    setSaving(false);
    setSuccess("Home content updated successfully.");
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Home Content"
        subtitle="Edit hero copy and core SEO settings with guided controls or JSON patches."
        draftKey={draftKey}
        setDraftKey={setDraftKey}
        hasKey={hasKey}
        onSaveKey={saveKey}
        onClearKey={clearKey}
        focusInputSignal={focusInputSignal}
        onRefresh={() => void loadHome()}
        refreshing={loading}
      />

      {error ? <AdminFeedbackBanner variant="error" message={error} /> : null}
      {success ? <AdminFeedbackBanner variant="success" message={success} /> : null}

      <AdminSplitLayout
        left={
          <div className="space-y-4">
            <article className="rounded-2xl border border-border/80 bg-card/80 p-4">
              <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
                Snapshot
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="text-foreground text-right">{home?.name || "-"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Role</dt>
                  <dd className="text-foreground text-right">{home?.role || "-"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Updated</dt>
                  <dd className="text-foreground text-right">
                    {formatTimestamp(home?.updatedAt as unknown as string)}
                  </dd>
                </div>
              </dl>
            </article>

            <article className="rounded-2xl border border-border/80 bg-card/80 p-4">
              <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
                Preview
              </h3>
              <pre className="rounded-lg border border-border bg-background/70 p-3 text-xs whitespace-pre-wrap overflow-x-auto">
                {home
                  ? toJson({
                      name: home.name,
                      role: home.role,
                      description: home.description,
                      seo: home.seo_settings,
                    })
                  : "No home document loaded."}
              </pre>
            </article>
          </div>
        }
        right={
          <article className="rounded-2xl border border-border/80 bg-card/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="inline-flex rounded-lg border border-border/80 bg-background/60 p-1">
                <button
                  type="button"
                  onClick={() => setMode("guided")}
                  className={[
                    "px-3 py-2 rounded-md text-sm inline-flex items-center gap-2",
                    mode === "guided"
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                  ].join(" ")}
                >
                  <LayoutTemplate size={14} aria-hidden="true" />
                  Guided
                </button>
                <button
                  type="button"
                  onClick={() => setMode("json")}
                  className={[
                    "px-3 py-2 rounded-md text-sm inline-flex items-center gap-2",
                    mode === "json"
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                  ].join(" ")}
                >
                  <FileJson size={14} aria-hidden="true" />
                  Advanced JSON
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onReset}
                  disabled={saving || (!guidedDirty && !jsonDirty)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-60"
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  Reset
                </button>

                <button
                  type="button"
                  onClick={() =>
                    mode === "guided" ? void onSaveGuided() : void onSaveJson()
                  }
                  disabled={saving || (mode === "guided" ? !guidedDirty : !jsonDirty)}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
                >
                  <Save size={14} aria-hidden="true" />
                  {saving ? "Saving" : "Save"}
                </button>
              </div>
            </div>

            {mode === "guided" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Name"
                  required
                  value={guided.name}
                  onChange={(value) => setGuided((prev) => ({ ...prev, name: value }))}
                />
                <FormField
                  label="Role"
                  required
                  value={guided.role}
                  onChange={(value) => setGuided((prev) => ({ ...prev, role: value }))}
                />
                <div className="md:col-span-2">
                  <FormTextarea
                    label="Description"
                    required
                    value={guided.description}
                    onChange={(value) =>
                      setGuided((prev) => ({ ...prev, description: value }))
                    }
                    rows={4}
                  />
                </div>
                <FormField
                  label="Featured Projects Title"
                  value={guided.featuredProjectsTitle}
                  onChange={(value) =>
                    setGuided((prev) => ({ ...prev, featuredProjectsTitle: value }))
                  }
                />
                <FormField
                  label="Post Section Title"
                  value={guided.postSectionTitle}
                  onChange={(value) =>
                    setGuided((prev) => ({ ...prev, postSectionTitle: value }))
                  }
                />
                <div className="md:col-span-2">
                  <FormTextarea
                    label="Post Section Description"
                    value={guided.postSectionDescription}
                    onChange={(value) =>
                      setGuided((prev) => ({ ...prev, postSectionDescription: value }))
                    }
                    rows={3}
                  />
                </div>
                <FormField
                  label="SEO Title"
                  value={guided.seoTitle}
                  onChange={(value) => setGuided((prev) => ({ ...prev, seoTitle: value }))}
                />
                <FormImageField
                  apiKey={apiKey}
                  label="SEO Image Permalink"
                  value={guided.seoImagePermalink}
                  onChange={(value) =>
                    setGuided((prev) => ({ ...prev, seoImagePermalink: value }))
                  }
                  placeholder="/cover.jpg"
                />
                <div className="md:col-span-2">
                  <FormTextarea
                    label="SEO Description"
                    value={guided.seoDescription}
                    onChange={(value) =>
                      setGuided((prev) => ({ ...prev, seoDescription: value }))
                    }
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <FormField
                    label="SEO Keywords"
                    value={guided.seoKeywords}
                    onChange={(value) =>
                      setGuided((prev) => ({ ...prev, seoKeywords: value }))
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Send a direct patch object to <code>/api/admin/content/home</code>.
                </p>
                <textarea
                  value={jsonBody}
                  onChange={(event) => setJsonBody(event.target.value)}
                  rows={18}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono"
                />
              </div>
            )}
          </article>
        }
      />
    </div>
  );
}
