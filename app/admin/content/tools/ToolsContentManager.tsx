"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileJson,
  LayoutTemplate,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { ToolPageSeoEntry, ToolsContentDoc } from "@/lib/content-types";
import AdminFeedbackBanner from "../_components/AdminFeedbackBanner";
import AdminPageHeader from "../_components/AdminPageHeader";
import AdminSplitLayout from "../_components/AdminSplitLayout";
import FormField from "../_components/forms/FormField";
import FormImageField from "../_components/forms/FormImageField";
import FormTextarea from "../_components/forms/FormTextarea";
import { useAdminApiKey } from "../_hooks/useAdminApiKey";
import { adminGet, adminPut } from "../_lib/admin-client";
import { EditorMode } from "../_types/admin-ui";

interface ToolSeoGuidedEntry {
  slug: string;
  label: string;
  path: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  seoImagePermalink: string;
}

interface ToolsGuidedState {
  toolsTitle: string;
  toolsDescription: string;
  toolsKeywords: string;
  toolsImagePermalink: string;
  toolPages: ToolSeoGuidedEntry[];
}

const EMPTY_TOOL_ENTRY: ToolSeoGuidedEntry = {
  slug: "",
  label: "",
  path: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  seoImagePermalink: "",
};

const EMPTY_GUIDED_STATE: ToolsGuidedState = {
  toolsTitle: "",
  toolsDescription: "",
  toolsKeywords: "",
  toolsImagePermalink: "",
  toolPages: [],
};

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

function buildToolEntry(entry: ToolPageSeoEntry): ToolSeoGuidedEntry {
  return {
    slug: entry.slug || "",
    label: entry.label || "",
    path: entry.path || "",
    seoTitle: entry.seo_settings?.seo_title || "",
    seoDescription: entry.seo_settings?.seo_description || "",
    seoKeywords: entry.seo_settings?.seo_keywords || "",
    seoImagePermalink: entry.seo_settings?.seo_image?.permalink || "",
  };
}

function buildGuidedState(doc: ToolsContentDoc): ToolsGuidedState {
  return {
    toolsTitle: doc.tools_index_seo?.seo_title || "",
    toolsDescription: doc.tools_index_seo?.seo_description || "",
    toolsKeywords: doc.tools_index_seo?.seo_keywords || "",
    toolsImagePermalink: doc.tools_index_seo?.seo_image?.permalink || "",
    toolPages: Array.isArray(doc.tool_pages)
      ? doc.tool_pages.map(buildToolEntry)
      : [],
  };
}

function buildGuidedPatch(state: ToolsGuidedState): Record<string, unknown> {
  return {
    tools_index_seo: {
      seo_title: state.toolsTitle.trim(),
      seo_description: state.toolsDescription.trim(),
      seo_keywords: state.toolsKeywords.trim(),
      seo_image: {
        permalink: state.toolsImagePermalink.trim() || "/tools/opengraph-image",
      },
    },
    tool_pages: state.toolPages.map((entry) => ({
      slug: entry.slug.trim(),
      label: entry.label.trim(),
      path: entry.path.trim(),
      seo_settings: {
        seo_title: entry.seoTitle.trim(),
        seo_description: entry.seoDescription.trim(),
        seo_keywords: entry.seoKeywords.trim(),
        seo_image: {
          permalink: entry.seoImagePermalink.trim() || "/cover.jpg",
        },
      },
    })),
  };
}

export default function ToolsContentManager() {
  const { ready, apiKey, draftKey, setDraftKey, saveKey, clearKey, hasKey } =
    useAdminApiKey();

  const [tools, setTools] = useState<ToolsContentDoc | null>(null);
  const [mode, setMode] = useState<EditorMode>("guided");
  const [guided, setGuided] = useState<ToolsGuidedState>(EMPTY_GUIDED_STATE);
  const [guidedBaseline, setGuidedBaseline] = useState(toJson(EMPTY_GUIDED_STATE));
  const [jsonBody, setJsonBody] = useState("{}");
  const [jsonBaseline, setJsonBaseline] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [focusInputSignal, setFocusInputSignal] = useState(0);

  const canRequest = useMemo(() => ready && hasKey, [ready, hasKey]);

  const applyToolsToEditors = useCallback((doc: ToolsContentDoc) => {
    const nextGuided = buildGuidedState(doc);
    const nextGuidedBaseline = toJson(nextGuided);
    const nextJson = toJson(buildGuidedPatch(nextGuided));

    setGuided(nextGuided);
    setGuidedBaseline(nextGuidedBaseline);
    setJsonBody(nextJson);
    setJsonBaseline(nextJson);
  }, []);

  const loadTools = useCallback(async () => {
    if (!canRequest) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const response = await adminGet<ToolsContentDoc>(apiKey, "/api/admin/content/tools");

    if (!response.success) {
      setError(response.error || "Failed to load tools SEO content.");
      setLoading(false);

      if (response.unauthorized) {
        setFocusInputSignal((current) => current + 1);
      }

      return;
    }

    const doc = response.data || null;
    setTools(doc);

    if (doc) {
      applyToolsToEditors(doc);
    }

    setLoading(false);
  }, [apiKey, applyToolsToEditors, canRequest]);

  useEffect(() => {
    if (!canRequest) {
      return;
    }

    void loadTools();
  }, [canRequest, loadTools]);

  const guidedDirty = useMemo(
    () => toJson(guided) !== guidedBaseline,
    [guided, guidedBaseline]
  );

  const jsonDirty = useMemo(
    () => jsonBody.trim() !== jsonBaseline.trim(),
    [jsonBody, jsonBaseline]
  );

  const onReset = () => {
    if (!tools) {
      return;
    }

    applyToolsToEditors(tools);
    setError(null);
    setSuccess(null);
  };

  const onAddTool = () => {
    setGuided((current) => ({
      ...current,
      toolPages: [...current.toolPages, { ...EMPTY_TOOL_ENTRY }],
    }));
  };

  const onRemoveTool = (index: number) => {
    setGuided((current) => ({
      ...current,
      toolPages: current.toolPages.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const onUpdateTool = (index: number, patch: Partial<ToolSeoGuidedEntry>) => {
    setGuided((current) => ({
      ...current,
      toolPages: current.toolPages.map((entry, itemIndex) =>
        itemIndex === index ? { ...entry, ...patch } : entry
      ),
    }));
  };

  const validateGuidedState = (): string | null => {
    if (!guided.toolsTitle.trim() || !guided.toolsDescription.trim()) {
      return "Tools page SEO title and description are required.";
    }

    for (let index = 0; index < guided.toolPages.length; index += 1) {
      const entry = guided.toolPages[index];
      const row = index + 1;

      if (!entry.slug.trim()) {
        return `Tool row ${row}: slug is required.`;
      }

      if (!entry.path.trim()) {
        return `Tool row ${row}: path is required.`;
      }

      if (!entry.seoTitle.trim() || !entry.seoDescription.trim()) {
        return `Tool row ${row}: SEO title and description are required.`;
      }
    }

    return null;
  };

  const onSaveGuided = async () => {
    if (!canRequest) {
      setError("Set your admin API key first.");
      setSuccess(null);
      return;
    }

    const validationError = validateGuidedState();
    if (validationError) {
      setError(validationError);
      setSuccess(null);
      return;
    }

    const payload = buildGuidedPatch(guided);

    setSaving(true);
    setError(null);
    setSuccess(null);

    const response = await adminPut<ToolsContentDoc>(
      apiKey,
      "/api/admin/content/tools",
      payload
    );

    if (!response.success) {
      setSaving(false);
      setError(response.error || "Failed to update tools SEO content.");

      if (response.unauthorized) {
        setFocusInputSignal((current) => current + 1);
      }

      return;
    }

    const nextDoc = response.data || null;
    setTools(nextDoc);

    if (nextDoc) {
      applyToolsToEditors(nextDoc);
    }

    setSaving(false);
    setSuccess("Tools SEO content updated successfully.");
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

    const response = await adminPut<ToolsContentDoc>(
      apiKey,
      "/api/admin/content/tools",
      payload
    );

    if (!response.success) {
      setSaving(false);
      setError(response.error || "Failed to update tools SEO content.");

      if (response.unauthorized) {
        setFocusInputSignal((current) => current + 1);
      }

      return;
    }

    const nextDoc = response.data || null;
    setTools(nextDoc);

    if (nextDoc) {
      applyToolsToEditors(nextDoc);
    }

    setSaving(false);
    setSuccess("Tools SEO content updated successfully.");
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Tools SEO"
        subtitle="Control metadata for /tools and each /tools/tool-slug page."
        draftKey={draftKey}
        setDraftKey={setDraftKey}
        hasKey={hasKey}
        onSaveKey={saveKey}
        onClearKey={clearKey}
        focusInputSignal={focusInputSignal}
        onRefresh={() => void loadTools()}
        refreshing={loading}
      />

      {error ? <AdminFeedbackBanner variant="error" message={error} /> : null}
      {success ? <AdminFeedbackBanner variant="success" message={success} /> : null}

      <AdminSplitLayout
        left={
          <div className="space-y-4">
            <article className="rounded-2xl border border-border/80 bg-card/80 p-4">
              <h3 className="mb-2 text-sm uppercase tracking-wider text-muted-foreground">
                Snapshot
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Tools entries</dt>
                  <dd className="text-foreground">{guided.toolPages.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Index title</dt>
                  <dd className="max-w-[190px] truncate text-right text-foreground">
                    {guided.toolsTitle || "-"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Updated</dt>
                  <dd className="text-right text-foreground">
                    {formatTimestamp(tools?.updatedAt as unknown as string)}
                  </dd>
                </div>
              </dl>
            </article>

            <article className="rounded-2xl border border-border/80 bg-card/80 p-4">
              <h3 className="mb-2 text-sm uppercase tracking-wider text-muted-foreground">
                Tool Slugs
              </h3>
              {guided.toolPages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tool SEO entries configured.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {guided.toolPages.map((entry) => (
                    <li
                      key={`${entry.slug || "tool"}-${entry.path || "path"}`}
                      className="rounded-lg border border-border/70 bg-background/70 px-3 py-2"
                    >
                      <p className="font-medium text-foreground">{entry.slug || "untitled-tool"}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{entry.path || "/"}</p>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="rounded-2xl border border-border/80 bg-card/80 p-4">
              <h3 className="mb-2 text-sm uppercase tracking-wider text-muted-foreground">
                Preview
              </h3>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-background/70 p-3 text-xs">
                {tools
                  ? toJson({
                      tools_index_seo: tools.tools_index_seo,
                      tool_pages: tools.tool_pages,
                    })
                  : "No tools SEO document loaded."}
              </pre>
            </article>
          </div>
        }
        right={
          <article className="rounded-2xl border border-border/80 bg-card/80 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-lg border border-border/80 bg-background/60 p-1">
                <button
                  type="button"
                  onClick={() => setMode("guided")}
                  className={[
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm",
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
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm",
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
              <div className="space-y-5">
                <section className="rounded-xl border border-border/70 bg-background/45 p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    /tools Index SEO
                  </h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <FormField
                      label="SEO Title"
                      required
                      value={guided.toolsTitle}
                      onChange={(value) =>
                        setGuided((current) => ({ ...current, toolsTitle: value }))
                      }
                    />
                    <FormImageField
                      apiKey={apiKey}
                      label="SEO Image Permalink"
                      value={guided.toolsImagePermalink}
                      onChange={(value) =>
                        setGuided((current) => ({
                          ...current,
                          toolsImagePermalink: value,
                        }))
                      }
                    />
                    <div className="md:col-span-2">
                      <FormTextarea
                        label="SEO Description"
                        required
                        value={guided.toolsDescription}
                        onChange={(value) =>
                          setGuided((current) => ({
                            ...current,
                            toolsDescription: value,
                          }))
                        }
                        rows={3}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <FormField
                        label="SEO Keywords (comma separated)"
                        value={guided.toolsKeywords}
                        onChange={(value) =>
                          setGuided((current) => ({ ...current, toolsKeywords: value }))
                        }
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-border/70 bg-background/45 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      /tools/{`{toolname}`} SEO
                    </h3>
                    <button
                      type="button"
                      onClick={onAddTool}
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <Plus size={14} aria-hidden="true" />
                      Add Tool
                    </button>
                  </div>

                  <div className="space-y-4">
                    {guided.toolPages.map((entry, index) => (
                      <article
                        key={`${entry.slug || "new-tool"}-${index}`}
                        className="rounded-xl border border-border/70 bg-card/70 p-3"
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">
                            Tool #{index + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() => onRemoveTool(index)}
                            className="inline-flex items-center gap-1 rounded-md border border-red-500/35 bg-red-500/10 px-2 py-1 text-xs text-red-300"
                          >
                            <Trash2 size={12} aria-hidden="true" />
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <FormField
                            label="Slug"
                            required
                            value={entry.slug}
                            onChange={(value) => onUpdateTool(index, { slug: value })}
                            placeholder="image-to-pdf"
                          />
                          <FormField
                            label="Label"
                            value={entry.label}
                            onChange={(value) => onUpdateTool(index, { label: value })}
                            placeholder="Image to PDF"
                          />
                          <FormField
                            label="Path"
                            required
                            value={entry.path}
                            onChange={(value) => onUpdateTool(index, { path: value })}
                            placeholder="/tools/image-to-pdf"
                          />
                          <FormImageField
                            apiKey={apiKey}
                            label="SEO Image Permalink"
                            value={entry.seoImagePermalink}
                            onChange={(value) =>
                              onUpdateTool(index, { seoImagePermalink: value })
                            }
                            placeholder="/tools/image-to-pdf/opengraph-image"
                          />
                          <div className="md:col-span-2">
                            <FormField
                              label="SEO Title"
                              required
                              value={entry.seoTitle}
                              onChange={(value) => onUpdateTool(index, { seoTitle: value })}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <FormTextarea
                              label="SEO Description"
                              required
                              value={entry.seoDescription}
                              onChange={(value) =>
                                onUpdateTool(index, { seoDescription: value })
                              }
                              rows={3}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <FormField
                              label="SEO Keywords (comma separated)"
                              value={entry.seoKeywords}
                              onChange={(value) =>
                                onUpdateTool(index, { seoKeywords: value })
                              }
                            />
                          </div>
                        </div>
                      </article>
                    ))}

                    {guided.toolPages.length === 0 ? (
                      <p className="rounded-lg border border-border/70 bg-background/70 px-3 py-3 text-sm text-muted-foreground">
                        No tool entries yet. Add one to control `/tools/toolname` SEO.
                      </p>
                    ) : null}
                  </div>
                </section>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Send a direct patch object to <code>/api/admin/content/tools</code>.
                </p>
                <textarea
                  value={jsonBody}
                  onChange={(event) => setJsonBody(event.target.value)}
                  rows={22}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
                />
              </div>
            )}
          </article>
        }
      />
    </div>
  );
}
