"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Edit3,
  FileJson,
  LayoutTemplate,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { ProjectContentDoc } from "@/lib/content-types";
import AdminEmptyState from "../_components/AdminEmptyState";
import AdminFeedbackBanner from "../_components/AdminFeedbackBanner";
import AdminPageHeader from "../_components/AdminPageHeader";
import AdminSearchSortBar from "../_components/AdminSearchSortBar";
import AdminSplitLayout from "../_components/AdminSplitLayout";
import FormField from "../_components/forms/FormField";
import FormImageField from "../_components/forms/FormImageField";
import FormTextarea from "../_components/forms/FormTextarea";
import { useAdminApiKey } from "../_hooks/useAdminApiKey";
import { useListQuery } from "../_hooks/useListQuery";
import { adminDelete, adminGet, adminPost, adminPut } from "../_lib/admin-client";
import { EditorMode } from "../_types/admin-ui";

interface ProjectFormState {
  id: string;
  title: string;
  companyName: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  seoImagePermalink: string;
  projectName: string;
  projectLink: string;
  imagePermalink: string;
  skillsCsv: string;
  overviewText: string;
}

interface OgGenerateApiResponse {
  permalink?: string;
}

const EMPTY_PROJECT_FORM: ProjectFormState = {
  id: "",
  title: "",
  companyName: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  seoImagePermalink: "",
  projectName: "",
  projectLink: "",
  imagePermalink: "",
  skillsCsv: "",
  overviewText: "",
};

function toJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function buildFormFromProject(project: ProjectContentDoc): ProjectFormState {
  return {
    id: project.id || "",
    title: project.title || "",
    companyName: project.company_name || "",
    description: project.project_description || "",
    seoTitle: project.seo_settings?.seo_title || "",
    seoDescription: project.seo_settings?.seo_description || "",
    seoKeywords: project.seo_settings?.seo_keywords || "",
    seoImagePermalink: project.seo_settings?.seo_image?.permalink || "",
    projectName: project.project_name || "",
    projectLink: project.project_link || "",
    imagePermalink: project.project_image?.permalink || "",
    skillsCsv: (project.skills || []).map((skill) => skill.skill_name).join(", "),
    overviewText: (project.project_overview || []).join("\n"),
  };
}

function splitByComma(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitByLines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildPayloadFromForm(form: ProjectFormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: form.title.trim(),
    project_description: form.description.trim(),
  };

  if (form.id.trim()) payload.id = form.id.trim();
  if (form.companyName.trim()) payload.company_name = form.companyName.trim();
  if (form.projectName.trim()) payload.project_name = form.projectName.trim();
  if (form.projectLink.trim()) payload.project_link = form.projectLink.trim();

  const skills = splitByComma(form.skillsCsv);
  if (skills.length > 0) payload.skills = skills;

  const overview = splitByLines(form.overviewText);
  if (overview.length > 0) payload.project_overview = overview;

  payload.seo_settings = {
    seo_title: form.seoTitle.trim() || form.title.trim(),
    seo_description: form.seoDescription.trim() || form.description.trim(),
    seo_keywords: form.seoKeywords.trim() || skills.join(", "),
    seo_image: {
      permalink:
        form.seoImagePermalink.trim() ||
        form.imagePermalink.trim() ||
        "/cover.jpg",
    },
  };

  payload.project_image = {
    permalink: form.imagePermalink.trim() || "/cover.jpg",
  };

  return payload;
}

function sortByUpdated(a: ProjectContentDoc, b: ProjectContentDoc): number {
  return new Date(a.updatedAt as unknown as string).getTime() - new Date(b.updatedAt as unknown as string).getTime();
}

function sortByTitle(a: ProjectContentDoc, b: ProjectContentDoc): number {
  return (a.title || "").localeCompare(b.title || "");
}

function formatTimestamp(value: string | Date | undefined): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
}

export default function ProjectsContentManager() {
  const { ready, apiKey, draftKey, setDraftKey, saveKey, clearKey, hasKey } =
    useAdminApiKey();

  const [projects, setProjects] = useState<ProjectContentDoc[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>("guided");
  const [form, setForm] = useState<ProjectFormState>(EMPTY_PROJECT_FORM);
  const [formBaseline, setFormBaseline] = useState(toJson(EMPTY_PROJECT_FORM));
  const [jsonBody, setJsonBody] = useState(toJson(buildPayloadFromForm(EMPTY_PROJECT_FORM)));
  const [jsonBaseline, setJsonBaseline] = useState(toJson(buildPayloadFromForm(EMPTY_PROJECT_FORM)));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingSeoImage, setGeneratingSeoImage] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [focusInputSignal, setFocusInputSignal] = useState(0);

  const canRequest = useMemo(() => ready && hasKey, [ready, hasKey]);

  const {
    query,
    filteredItems,
    setSearch,
    setSortBy,
    toggleSortDir,
  } = useListQuery<ProjectContentDoc>({
    items: projects,
    searchFields: (item) => [item.id || "", item.title || "", item.company_name || ""],
    sorters: {
      updated: sortByUpdated,
      title: sortByTitle,
    },
    defaultSortBy: "updated",
    defaultSortDir: "desc",
  });

  const selectedProject = useMemo(
    () => projects.find((item) => item.id === selectedId) || null,
    [projects, selectedId]
  );

  const applyEditorState = useCallback((nextForm: ProjectFormState) => {
    const nextFormBaseline = toJson(nextForm);
    const nextJson = toJson(buildPayloadFromForm(nextForm));

    setForm(nextForm);
    setFormBaseline(nextFormBaseline);
    setJsonBody(nextJson);
    setJsonBaseline(nextJson);
  }, []);

  const beginCreateMode = useCallback(() => {
    setSelectedId(null);
    setMode("guided");
    applyEditorState(EMPTY_PROJECT_FORM);
    setError(null);
    setSuccess(null);
  }, [applyEditorState]);

  const selectProject = useCallback(
    (project: ProjectContentDoc) => {
      setSelectedId(project.id);
      setMode("guided");
      applyEditorState(buildFormFromProject(project));
      setError(null);
      setSuccess(null);
    },
    [applyEditorState]
  );

  const loadProjects = useCallback(
    async (preferredSelectionId?: string | null) => {
      if (!canRequest) {
        return;
      }

      setLoading(true);
      setError(null);

      const response = await adminGet<ProjectContentDoc[]>(apiKey, "/api/admin/content/projects");
      if (!response.success) {
        setLoading(false);
        setError(response.error || "Failed to load projects.");

        if (response.unauthorized) {
          setFocusInputSignal((current) => current + 1);
        }

        return;
      }

      const data = Array.isArray(response.data) ? response.data : [];
      setProjects(data);
      setLoading(false);

      const hasExplicitSelection = preferredSelectionId !== undefined;
      const nextSelectionId = hasExplicitSelection ? preferredSelectionId : selectedId;
      if (nextSelectionId) {
        const matched = data.find((item) => item.id === nextSelectionId);
        if (matched) {
          selectProject(matched);
          return;
        }
      }

      if (data.length > 0) {
        selectProject(data[0]);
        return;
      }

      beginCreateMode();
    },
    [apiKey, beginCreateMode, canRequest, selectProject, selectedId]
  );

  useEffect(() => {
    if (!canRequest) {
      return;
    }

    void loadProjects();
  }, [canRequest, loadProjects]);

  const guidedDirty = useMemo(() => toJson(form) !== formBaseline, [form, formBaseline]);
  const jsonDirty = useMemo(() => jsonBody.trim() !== jsonBaseline.trim(), [jsonBody, jsonBaseline]);

  const onReset = () => {
    if (selectedProject) {
      selectProject(selectedProject);
      return;
    }

    beginCreateMode();
  };

  const onSaveGuided = async () => {
    if (!canRequest) {
      setError("Set your admin API key first.");
      setSuccess(null);
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      setSuccess(null);
      return;
    }

    const payload = buildPayloadFromForm(form);

    setSaving(true);
    setError(null);
    setSuccess(null);

    const response = selectedId
      ? await adminPut<ProjectContentDoc>(
          apiKey,
          `/api/admin/content/projects/${encodeURIComponent(selectedId)}`,
          payload
        )
      : await adminPost<ProjectContentDoc>(apiKey, "/api/admin/content/projects", payload);

    if (!response.success) {
      setSaving(false);
      setError(response.error || "Failed to save project.");

      if (response.unauthorized) {
        setFocusInputSignal((current) => current + 1);
      }

      return;
    }

    const saved = response.data || null;
    const nextSelectedId = saved?.id || null;

    setSaving(false);
    setSuccess(selectedId ? "Project updated successfully." : "Project created successfully.");

    await loadProjects(nextSelectedId);
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

    const response = selectedId
      ? await adminPut<ProjectContentDoc>(
          apiKey,
          `/api/admin/content/projects/${encodeURIComponent(selectedId)}`,
          payload
        )
      : await adminPost<ProjectContentDoc>(apiKey, "/api/admin/content/projects", payload);

    if (!response.success) {
      setSaving(false);
      setError(response.error || "Failed to save project.");

      if (response.unauthorized) {
        setFocusInputSignal((current) => current + 1);
      }

      return;
    }

    const saved = response.data || null;
    const nextSelectedId = saved?.id || null;

    setSaving(false);
    setSuccess(selectedId ? "Project updated successfully." : "Project created successfully.");

    await loadProjects(nextSelectedId);
  };

  const onDelete = async (id: string) => {
    if (!canRequest) {
      setError("Set your admin API key first.");
      return;
    }

    if (!window.confirm(`Delete project '${id}'?`)) {
      return;
    }

    setDeletingId(id);
    setError(null);
    setSuccess(null);

    const response = await adminDelete(apiKey, `/api/admin/content/projects/${encodeURIComponent(id)}`);
    if (!response.success) {
      setDeletingId(null);
      setError(response.error || "Failed to delete project.");

      if (response.unauthorized) {
        setFocusInputSignal((current) => current + 1);
      }

      return;
    }

    setDeletingId(null);
    setSuccess("Project deleted.");

    if (id === selectedId) {
      beginCreateMode();
    }

    await loadProjects(id === selectedId ? null : selectedId);
  };

  const onGenerateSeoImage = async () => {
    if (!canRequest) {
      setError("Set your admin API key first.");
      setSuccess(null);
      return;
    }

    const title = form.title.trim();
    if (!title) {
      setError("Title is required to generate SEO image.");
      setSuccess(null);
      return;
    }

    setGeneratingSeoImage(true);
    setError(null);
    setSuccess(null);

    const response = await adminPost<OgGenerateApiResponse>(
      apiKey,
      "/api/admin/og/generate",
      {
        kind: "project",
        title,
        image: form.imagePermalink.trim() || null,
        company: form.companyName.trim() || null,
      }
    );

    if (!response.success || !response.data?.permalink) {
      setGeneratingSeoImage(false);
      setError(response.error || "Failed to generate SEO image permalink.");
      return;
    }

    const permalink = response.data.permalink;
    setForm((prev) => ({ ...prev, seoImagePermalink: permalink }));
    setGeneratingSeoImage(false);
    const warning =
      typeof response.warning === "string" ? response.warning : null;
    setSuccess(
      warning
        ? `SEO OG image generated. ${warning}`
        : "SEO OG image generated and permalink updated."
    );
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Projects"
        subtitle="Search, sort, and edit projects with a split workspace optimized for fast CRUD."
        draftKey={draftKey}
        setDraftKey={setDraftKey}
        hasKey={hasKey}
        onSaveKey={saveKey}
        onClearKey={clearKey}
        focusInputSignal={focusInputSignal}
        onRefresh={() => void loadProjects()}
        refreshing={loading}
      />

      {ready && !hasKey ? (
        <AdminFeedbackBanner
          variant="info"
          message="Save your admin API key above to load and manage all projects."
        />
      ) : null}
      {error ? <AdminFeedbackBanner variant="error" message={error} /> : null}
      {success ? <AdminFeedbackBanner variant="success" message={success} /> : null}

      <AdminSplitLayout
        left={
          <div className="space-y-4">
            <AdminSearchSortBar
              search={query.search}
              onSearchChange={setSearch}
              sortBy={query.sortBy}
              onSortByChange={setSortBy}
              sortDir={query.sortDir}
              onToggleSortDir={toggleSortDir}
              sortOptions={[
                { value: "updated", label: "Updated Time" },
                { value: "title", label: "Title" },
              ]}
              searchPlaceholder="Search by title, id, or company"
            />

            <article className="rounded-2xl border border-border/80 bg-card/80 p-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">Results ({filteredItems.length})</p>
                <button
                  type="button"
                  onClick={beginCreateMode}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"
                >
                  <Plus size={12} aria-hidden="true" />
                  New
                </button>
              </div>

              <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                {filteredItems.length === 0 ? (
                  <AdminEmptyState
                    title="No projects found"
                    description="Try a different search term or create a new project."
                  />
                ) : (
                  filteredItems.map((project) => {
                    const selected = selectedId === project.id;

                    return (
                      <article
                        key={project.id}
                        className={[
                          "rounded-xl border p-3 transition-all",
                          selected
                            ? "border-accent/60 bg-accent/10"
                            : "border-border/80 bg-background/50",
                        ].join(" ")}
                      >
                        <button
                          type="button"
                          onClick={() => selectProject(project)}
                          className="w-full text-left"
                        >
                          <p className="text-sm font-semibold text-foreground line-clamp-1">
                            {project.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {project.company_name || "No company"}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-2">
                            Updated {formatTimestamp(project.updatedAt as unknown as string)}
                          </p>
                        </button>

                        <div className="flex items-center gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => selectProject(project)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px]"
                          >
                            <Edit3 size={11} aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDelete(project.id)}
                            disabled={deletingId === project.id}
                            className="inline-flex items-center gap-1 rounded-md border border-destructive/60 px-2 py-1 text-[11px] text-destructive disabled:opacity-60"
                          >
                            <Trash2 size={11} aria-hidden="true" />
                            {deletingId === project.id ? "Deleting" : "Delete"}
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </article>
          </div>
        }
        right={
          <article className="rounded-2xl border border-border/80 bg-card/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Editor</p>
                <p className="text-sm text-foreground">
                  {selectedProject ? `Editing ${selectedProject.id}` : "Creating new project"}
                </p>
              </div>

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
                  JSON
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                type="button"
                onClick={beginCreateMode}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <Plus size={14} aria-hidden="true" />
                New Project
              </button>
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
                onClick={() => (mode === "guided" ? void onSaveGuided() : void onSaveJson())}
                disabled={saving || (mode === "guided" ? !guidedDirty : !jsonDirty)}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
              >
                <Save size={14} aria-hidden="true" />
                {saving ? "Saving" : selectedProject ? "Update" : "Create"}
              </button>
              {selectedProject ? (
                <button
                  type="button"
                  onClick={() => void onDelete(selectedProject.id)}
                  disabled={deletingId === selectedProject.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-destructive/60 px-3 py-2 text-sm text-destructive disabled:opacity-60"
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Delete
                </button>
              ) : null}
            </div>

            {mode === "guided" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Project ID"
                  value={form.id}
                  onChange={(value) => setForm((prev) => ({ ...prev, id: value }))}
                  placeholder={selectedProject ? selectedProject.id : "optional-custom-id"}
                />
                <FormField
                  label="Title"
                  required
                  value={form.title}
                  onChange={(value) => setForm((prev) => ({ ...prev, title: value }))}
                />
                <FormField
                  label="Company"
                  value={form.companyName}
                  onChange={(value) => setForm((prev) => ({ ...prev, companyName: value }))}
                />
                <FormField
                  label="Project Name"
                  value={form.projectName}
                  onChange={(value) => setForm((prev) => ({ ...prev, projectName: value }))}
                />
                <FormField
                  label="Project Link"
                  value={form.projectLink}
                  onChange={(value) => setForm((prev) => ({ ...prev, projectLink: value }))}
                />
                <FormImageField
                  apiKey={apiKey}
                  label="Image Permalink"
                  value={form.imagePermalink}
                  onChange={(value) => setForm((prev) => ({ ...prev, imagePermalink: value }))}
                  placeholder="/cover.jpg"
                  previewAspect="16:9"
                  previewFit="contain"
                />
                <FormField
                  label="SEO Title"
                  value={form.seoTitle}
                  onChange={(value) => setForm((prev) => ({ ...prev, seoTitle: value }))}
                />
                <div className="flex flex-col gap-2">
                  <FormImageField
                    apiKey={apiKey}
                    label="SEO Image Permalink"
                    value={form.seoImagePermalink}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, seoImagePermalink: value }))
                    }
                    placeholder="/cover.jpg"
                    previewAspect="16:9"
                    previewFit="contain"
                  />
                  <button
                    type="button"
                    onClick={() => void onGenerateSeoImage()}
                    disabled={generatingSeoImage}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-foreground disabled:opacity-60"
                  >
                    <Sparkles size={12} aria-hidden="true" />
                    {generatingSeoImage ? "Generating..." : "Generate SEO OG Image"}
                  </button>
                </div>
                <div className="md:col-span-2">
                  <FormTextarea
                    label="Description"
                    required
                    value={form.description}
                    onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
                    rows={4}
                  />
                </div>
                <div className="md:col-span-2">
                  <FormTextarea
                    label="SEO Description"
                    value={form.seoDescription}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, seoDescription: value }))
                    }
                    rows={3}
                  />
                </div>
                <FormField
                  label="Skills (comma separated)"
                  value={form.skillsCsv}
                  onChange={(value) => setForm((prev) => ({ ...prev, skillsCsv: value }))}
                  placeholder="Next.js, TypeScript, MongoDB"
                />
                <FormField
                  label="SEO Keywords"
                  value={form.seoKeywords}
                  onChange={(value) => setForm((prev) => ({ ...prev, seoKeywords: value }))}
                  placeholder="next.js, frontend, portfolio"
                />
                <div className="md:col-span-2">
                  <FormTextarea
                    label="Overview (one line per bullet)"
                    value={form.overviewText}
                    onChange={(value) => setForm((prev) => ({ ...prev, overviewText: value }))}
                    rows={4}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {selectedProject
                    ? "Send a patch object to update the selected project."
                    : "Send a create payload object for a new project."}
                </p>
                <textarea
                  value={jsonBody}
                  onChange={(event) => setJsonBody(event.target.value)}
                  rows={20}
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
