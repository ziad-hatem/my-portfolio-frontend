"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Edit3,
  FileJson,
  LayoutTemplate,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { PostContentDoc } from "@/lib/content-types";
import AdminEmptyState from "../_components/AdminEmptyState";
import AdminFeedbackBanner from "../_components/AdminFeedbackBanner";
import AdminPageHeader from "../_components/AdminPageHeader";
import AdminSearchSortBar from "../_components/AdminSearchSortBar";
import AdminSplitLayout from "../_components/AdminSplitLayout";
import FormField from "../_components/forms/FormField";
import FormTextarea from "../_components/forms/FormTextarea";
import { useAdminApiKey } from "../_hooks/useAdminApiKey";
import { useListQuery } from "../_hooks/useListQuery";
import { adminDelete, adminGet, adminPost, adminPut } from "../_lib/admin-client";
import { EditorMode } from "../_types/admin-ui";

interface PostFormState {
  id: string;
  title: string;
  author: string;
  postText: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  seoImagePermalink: string;
  publishDate: string;
  permalink: string;
  imagePermalink: string;
}

const EMPTY_POST_FORM: PostFormState = {
  id: "",
  title: "",
  author: "",
  postText: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  seoImagePermalink: "",
  publishDate: "",
  permalink: "",
  imagePermalink: "",
};

function toJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function buildFormFromPost(post: PostContentDoc): PostFormState {
  return {
    id: post.id || "",
    title: post.title || "",
    author: post.author || "",
    postText: post.post_text || "",
    seoTitle: post.seo_settings?.seo_title || "",
    seoDescription: post.seo_settings?.seo_description || "",
    seoKeywords: post.seo_settings?.seo_keywords || "",
    seoImagePermalink: post.seo_settings?.seo_image?.permalink || "",
    publishDate: post.publish_date || "",
    permalink: post.permalink || "",
    imagePermalink: post.post_image?.permalink || "",
  };
}

function buildPayloadFromForm(form: PostFormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: form.title.trim(),
    post_text: form.postText.trim(),
  };

  if (form.id.trim()) payload.id = form.id.trim();
  if (form.author.trim()) payload.author = form.author.trim();
  if (form.publishDate.trim()) payload.publish_date = form.publishDate.trim();
  if (form.permalink.trim()) payload.permalink = form.permalink.trim();

  payload.seo_settings = {
    seo_title: form.seoTitle.trim() || form.title.trim(),
    seo_description: form.seoDescription.trim() || form.postText.trim().slice(0, 180),
    seo_keywords:
      form.seoKeywords.trim() ||
      [form.title.trim(), form.author.trim()].filter(Boolean).join(", "),
    seo_image: {
      permalink:
        form.seoImagePermalink.trim() ||
        form.imagePermalink.trim() ||
        "/cover.jpg",
    },
  };

  payload.post_image = {
    permalink: form.imagePermalink.trim() || "/cover.jpg",
  };

  return payload;
}

function sortByUpdated(a: PostContentDoc, b: PostContentDoc): number {
  return new Date(a.updatedAt as unknown as string).getTime() - new Date(b.updatedAt as unknown as string).getTime();
}

function sortByTitle(a: PostContentDoc, b: PostContentDoc): number {
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

export default function PostsContentManager() {
  const { ready, apiKey, draftKey, setDraftKey, saveKey, clearKey, hasKey } =
    useAdminApiKey();

  const [posts, setPosts] = useState<PostContentDoc[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>("guided");
  const [form, setForm] = useState<PostFormState>(EMPTY_POST_FORM);
  const [formBaseline, setFormBaseline] = useState(toJson(EMPTY_POST_FORM));
  const [jsonBody, setJsonBody] = useState(toJson(buildPayloadFromForm(EMPTY_POST_FORM)));
  const [jsonBaseline, setJsonBaseline] = useState(toJson(buildPayloadFromForm(EMPTY_POST_FORM)));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
  } = useListQuery<PostContentDoc>({
    items: posts,
    searchFields: (item) => [item.id || "", item.title || "", item.author || ""],
    sorters: {
      updated: sortByUpdated,
      title: sortByTitle,
    },
    defaultSortBy: "updated",
    defaultSortDir: "desc",
  });

  const selectedPost = useMemo(
    () => posts.find((item) => item.id === selectedId) || null,
    [posts, selectedId]
  );

  const applyEditorState = useCallback((nextForm: PostFormState) => {
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
    applyEditorState(EMPTY_POST_FORM);
    setError(null);
    setSuccess(null);
  }, [applyEditorState]);

  const selectPost = useCallback(
    (post: PostContentDoc) => {
      setSelectedId(post.id);
      setMode("guided");
      applyEditorState(buildFormFromPost(post));
      setError(null);
      setSuccess(null);
    },
    [applyEditorState]
  );

  const loadPosts = useCallback(
    async (preferredSelectionId?: string | null) => {
      if (!canRequest) {
        return;
      }

      setLoading(true);
      setError(null);

      const response = await adminGet<PostContentDoc[]>(apiKey, "/api/admin/content/posts");
      if (!response.success) {
        setLoading(false);
        setError(response.error || "Failed to load posts.");

        if (response.unauthorized) {
          setFocusInputSignal((current) => current + 1);
        }

        return;
      }

      const data = Array.isArray(response.data) ? response.data : [];
      setPosts(data);
      setLoading(false);

      const nextSelectionId = preferredSelectionId ?? selectedId;
      if (!nextSelectionId) {
        return;
      }

      const matched = data.find((item) => item.id === nextSelectionId);
      if (matched) {
        selectPost(matched);
      } else {
        beginCreateMode();
      }
    },
    [apiKey, beginCreateMode, canRequest, selectPost, selectedId]
  );

  useEffect(() => {
    if (!canRequest) {
      return;
    }

    void loadPosts();
  }, [canRequest, loadPosts]);

  const guidedDirty = useMemo(() => toJson(form) !== formBaseline, [form, formBaseline]);
  const jsonDirty = useMemo(() => jsonBody.trim() !== jsonBaseline.trim(), [jsonBody, jsonBaseline]);

  const onReset = () => {
    if (selectedPost) {
      selectPost(selectedPost);
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

    if (!form.title.trim() || !form.postText.trim()) {
      setError("Title and post text are required.");
      setSuccess(null);
      return;
    }

    const payload = buildPayloadFromForm(form);

    setSaving(true);
    setError(null);
    setSuccess(null);

    const response = selectedId
      ? await adminPut<PostContentDoc>(
          apiKey,
          `/api/admin/content/posts/${encodeURIComponent(selectedId)}`,
          payload
        )
      : await adminPost<PostContentDoc>(apiKey, "/api/admin/content/posts", payload);

    if (!response.success) {
      setSaving(false);
      setError(response.error || "Failed to save post.");

      if (response.unauthorized) {
        setFocusInputSignal((current) => current + 1);
      }

      return;
    }

    const saved = response.data || null;
    const nextSelectedId = saved?.id || null;

    setSaving(false);
    setSuccess(selectedId ? "Post updated successfully." : "Post created successfully.");

    await loadPosts(nextSelectedId);
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
      ? await adminPut<PostContentDoc>(
          apiKey,
          `/api/admin/content/posts/${encodeURIComponent(selectedId)}`,
          payload
        )
      : await adminPost<PostContentDoc>(apiKey, "/api/admin/content/posts", payload);

    if (!response.success) {
      setSaving(false);
      setError(response.error || "Failed to save post.");

      if (response.unauthorized) {
        setFocusInputSignal((current) => current + 1);
      }

      return;
    }

    const saved = response.data || null;
    const nextSelectedId = saved?.id || null;

    setSaving(false);
    setSuccess(selectedId ? "Post updated successfully." : "Post created successfully.");

    await loadPosts(nextSelectedId);
  };

  const onDelete = async (id: string) => {
    if (!canRequest) {
      setError("Set your admin API key first.");
      return;
    }

    if (!window.confirm(`Delete post '${id}'?`)) {
      return;
    }

    setDeletingId(id);
    setError(null);
    setSuccess(null);

    const response = await adminDelete(apiKey, `/api/admin/content/posts/${encodeURIComponent(id)}`);
    if (!response.success) {
      setDeletingId(null);
      setError(response.error || "Failed to delete post.");

      if (response.unauthorized) {
        setFocusInputSignal((current) => current + 1);
      }

      return;
    }

    setDeletingId(null);
    setSuccess("Post deleted.");

    if (id === selectedId) {
      beginCreateMode();
    }

    await loadPosts(id === selectedId ? null : selectedId);
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Posts"
        subtitle="Manage blog entries with guided fields and advanced JSON payload control."
        draftKey={draftKey}
        setDraftKey={setDraftKey}
        hasKey={hasKey}
        onSaveKey={saveKey}
        onClearKey={clearKey}
        focusInputSignal={focusInputSignal}
        onRefresh={() => void loadPosts()}
        refreshing={loading}
      />

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
              searchPlaceholder="Search by title, id, or author"
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
                    title="No posts found"
                    description="Try another search or create a new post."
                  />
                ) : (
                  filteredItems.map((post) => {
                    const selected = selectedId === post.id;

                    return (
                      <article
                        key={post.id}
                        className={[
                          "rounded-xl border p-3 transition-all",
                          selected
                            ? "border-accent/60 bg-accent/10"
                            : "border-border/80 bg-background/50",
                        ].join(" ")}
                      >
                        <button
                          type="button"
                          onClick={() => selectPost(post)}
                          className="w-full text-left"
                        >
                          <p className="text-sm font-semibold text-foreground line-clamp-1">
                            {post.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {post.author || "No author"}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-2">
                            Updated {formatTimestamp(post.updatedAt as unknown as string)}
                          </p>
                        </button>

                        <div className="flex items-center gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => selectPost(post)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px]"
                          >
                            <Edit3 size={11} aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDelete(post.id)}
                            disabled={deletingId === post.id}
                            className="inline-flex items-center gap-1 rounded-md border border-destructive/60 px-2 py-1 text-[11px] text-destructive disabled:opacity-60"
                          >
                            <Trash2 size={11} aria-hidden="true" />
                            {deletingId === post.id ? "Deleting" : "Delete"}
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
                  {selectedPost ? `Editing ${selectedPost.id}` : "Creating new post"}
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
                New Post
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
                {saving ? "Saving" : selectedPost ? "Update" : "Create"}
              </button>
              {selectedPost ? (
                <button
                  type="button"
                  onClick={() => void onDelete(selectedPost.id)}
                  disabled={deletingId === selectedPost.id}
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
                  label="Post ID"
                  value={form.id}
                  onChange={(value) => setForm((prev) => ({ ...prev, id: value }))}
                  placeholder={selectedPost ? selectedPost.id : "optional-custom-id"}
                />
                <FormField
                  label="Title"
                  required
                  value={form.title}
                  onChange={(value) => setForm((prev) => ({ ...prev, title: value }))}
                />
                <FormField
                  label="Author"
                  value={form.author}
                  onChange={(value) => setForm((prev) => ({ ...prev, author: value }))}
                />
                <FormField
                  label="Publish Date"
                  value={form.publishDate}
                  onChange={(value) => setForm((prev) => ({ ...prev, publishDate: value }))}
                  placeholder="2026"
                />
                <FormField
                  label="Permalink"
                  value={form.permalink}
                  onChange={(value) => setForm((prev) => ({ ...prev, permalink: value }))}
                  placeholder="/posts/post-id"
                />
                <FormField
                  label="Image Permalink"
                  value={form.imagePermalink}
                  onChange={(value) => setForm((prev) => ({ ...prev, imagePermalink: value }))}
                  placeholder="/cover.jpg"
                />
                <FormField
                  label="SEO Title"
                  value={form.seoTitle}
                  onChange={(value) => setForm((prev) => ({ ...prev, seoTitle: value }))}
                />
                <FormField
                  label="SEO Image Permalink"
                  value={form.seoImagePermalink}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, seoImagePermalink: value }))
                  }
                  placeholder="/cover.jpg"
                />
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
                  label="SEO Keywords"
                  value={form.seoKeywords}
                  onChange={(value) => setForm((prev) => ({ ...prev, seoKeywords: value }))}
                  placeholder="next.js, web development, frontend"
                />
                <div className="md:col-span-2">
                  <FormTextarea
                    label="Post Body (HTML allowed)"
                    required
                    mono
                    value={form.postText}
                    onChange={(value) => setForm((prev) => ({ ...prev, postText: value }))}
                    rows={10}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {selectedPost
                    ? "Send a patch object to update the selected post."
                    : "Send a create payload object for a new post."}
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
