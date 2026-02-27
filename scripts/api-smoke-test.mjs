#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_BASE_URL = "http://localhost:3000";

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function getArgValue(name) {
  const index = process.argv.findIndex((item) => item === name);
  if (index === -1 || index === process.argv.length - 1) {
    return null;
  }
  return process.argv[index + 1];
}

function normalizeBaseUrl(raw) {
  return raw.replace(/\/+$/, "");
}

function buildUrl(baseUrl, path) {
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function makeAdminHeaders(apiKey, extra = {}) {
  return {
    Authorization: `Bearer ${apiKey}`,
    ...extra,
  };
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(baseUrl, path, init = {}) {
  const response = await fetch(buildUrl(baseUrl, path), {
    cache: "no-store",
    ...init,
  });

  const contentType = response.headers.get("content-type") || "";
  let json = null;

  if (contentType.includes("application/json")) {
    try {
      json = await response.json();
    } catch {
      json = null;
    }
  }

  return { response, json };
}

function logStep(message) {
  console.log(`\n[step] ${message}`);
}

function logPass(message) {
  console.log(`[ok] ${message}`);
}

function createId(prefix) {
  const stamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${stamp}-${random}`;
}

async function ensureDeleted(baseUrl, apiKey, path, label) {
  const { response } = await request(baseUrl, path, {
    method: "DELETE",
    headers: makeAdminHeaders(apiKey),
  });

  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    console.warn(
      `[warn] cleanup failed for ${label}: ${response.status} ${response.statusText}`
    );
    return;
  }

  console.log(`[cleanup] deleted ${label}`);
}

async function run() {
  loadDotEnv();

  const baseUrl = normalizeBaseUrl(
    getArgValue("--base-url") ||
      process.env.SMOKE_BASE_URL ||
      process.env.NEXT_PUBLIC_FRONTEND_URL ||
      DEFAULT_BASE_URL
  );

  const adminApiKey = getArgValue("--api-key") || process.env.ADMIN_API_KEY;
  if (!adminApiKey) {
    throw new Error("Missing ADMIN_API_KEY (env/.env) or --api-key argument");
  }

  const projectId = createId("smoke-project");
  const postId = createId("smoke-post");

  let createdProject = false;
  let createdPost = false;

  console.log(`[info] Base URL: ${baseUrl}`);
  console.log("[info] Running API smoke checks...");

  try {
    logStep("admin unauthorized check");
    {
      const { response, json } = await request(baseUrl, "/api/admin/content/projects");
      assertCondition(response.status === 401, "Expected 401 without bearer token");
      assertCondition(json?.success === false, "Expected success=false response");
      logPass("unauthorized check returned 401");
    }

    logStep("admin authorized list checks");
    {
      const { response, json } = await request(baseUrl, "/api/admin/content/projects", {
        headers: makeAdminHeaders(adminApiKey),
      });
      assertCondition(response.status === 200, "Expected 200 for authorized list");
      assertCondition(json?.success === true, "Expected success=true");
      assertCondition(Array.isArray(json?.data), "Expected array data for projects");
      logPass("authorized projects list returned 200");
    }

    {
      const { response, json } = await request(baseUrl, "/api/admin/content/posts", {
        headers: makeAdminHeaders(adminApiKey),
      });
      assertCondition(response.status === 200, "Expected 200 for authorized posts list");
      assertCondition(json?.success === true, "Expected success=true");
      assertCondition(Array.isArray(json?.data), "Expected array data for posts");
      logPass("authorized posts list returned 200");
    }

    {
      const { response, json } = await request(baseUrl, "/api/admin/content/tools", {
        headers: makeAdminHeaders(adminApiKey),
      });
      assertCondition(response.status === 200, "Expected 200 for authorized tools SEO");
      assertCondition(json?.success === true, "Expected success=true");
      assertCondition(
        Array.isArray(json?.data?.tool_pages),
        "Expected tool_pages array for tools SEO document"
      );
      logPass("authorized tools SEO returned 200");
    }

    logStep("project CRUD + OG cache checks");
    let projectAssetKey = "";
    {
      const createPayload = {
        id: projectId,
        title: `Smoke Project ${projectId}`,
        company_name: "Smoke Runner",
        project_description: "API smoke test project",
        project_overview: ["create", "update", "delete"],
        skills: ["smoke", "api"],
      };

      const { response, json } = await request(baseUrl, "/api/admin/content/projects", {
        method: "POST",
        headers: makeAdminHeaders(adminApiKey, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(createPayload),
      });

      assertCondition(response.status === 201, "Expected 201 on project create");
      assertCondition(json?.success === true, "Expected project create success=true");
      assertCondition(json?.data?.id === projectId, "Expected created project id match");
      assertCondition(
        typeof json?.data?.ogAssetKey === "string" && json.data.ogAssetKey.length > 0,
        "Expected project ogAssetKey"
      );

      projectAssetKey = json.data.ogAssetKey;
      createdProject = true;
      logPass("project created");
    }

    {
      const { response, json } = await request(
        baseUrl,
        `/api/admin/content/projects/${encodeURIComponent(projectId)}`,
        {
          method: "PUT",
          headers: makeAdminHeaders(adminApiKey, {
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            title: `Smoke Project Updated ${projectId}`,
          }),
        }
      );

      assertCondition(response.status === 200, "Expected 200 on project update");
      assertCondition(json?.success === true, "Expected project update success=true");
      assertCondition(
        typeof json?.data?.ogAssetKey === "string" && json.data.ogAssetKey.length > 0,
        "Expected updated project ogAssetKey"
      );
      projectAssetKey = json.data.ogAssetKey;
      logPass("project updated");
    }

    {
      const first = await request(
        baseUrl,
        `/api/og/project?assetKey=${encodeURIComponent(projectAssetKey)}`
      );
      const firstEtag = first.response.headers.get("etag");
      const firstContentType = first.response.headers.get("content-type") || "";

      assertCondition(first.response.status === 200, "Expected 200 on first OG project request");
      assertCondition(
        firstContentType.includes("image/png"),
        "Expected image/png content type for OG project"
      );
      assertCondition(Boolean(firstEtag), "Expected ETag on OG project response");

      const second = await request(
        baseUrl,
        `/api/og/project?assetKey=${encodeURIComponent(projectAssetKey)}`,
        {
          headers: {
            "if-none-match": firstEtag,
          },
        }
      );

      assertCondition(second.response.status === 304, "Expected 304 on OG project cache recheck");
      logPass("project OG cache check passed (200 then 304)");
    }

    {
      const { response, json } = await request(
        baseUrl,
        `/api/admin/content/projects/${encodeURIComponent(projectId)}`,
        {
          method: "DELETE",
          headers: makeAdminHeaders(adminApiKey),
        }
      );

      assertCondition(response.status === 200, "Expected 200 on project delete");
      assertCondition(json?.success === true, "Expected delete success=true");
      createdProject = false;
      logPass("project deleted");
    }

    {
      const { response } = await request(
        baseUrl,
        `/api/content/projects/${encodeURIComponent(projectId)}`
      );
      assertCondition(response.status === 404, "Expected 404 after project deletion");
      logPass("project delete verified by public 404");
    }

    logStep("post CRUD + OG cache checks");
    let postAssetKey = "";
    {
      const createPayload = {
        id: postId,
        title: `Smoke Post ${postId}`,
        author: "Smoke Runner",
        post_text: "<p>Smoke test post body</p>",
        publish_date: "2026",
        permalink: `/posts/${postId}`,
      };

      const { response, json } = await request(baseUrl, "/api/admin/content/posts", {
        method: "POST",
        headers: makeAdminHeaders(adminApiKey, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(createPayload),
      });

      assertCondition(response.status === 201, "Expected 201 on post create");
      assertCondition(json?.success === true, "Expected post create success=true");
      assertCondition(json?.data?.id === postId, "Expected created post id match");
      assertCondition(
        typeof json?.data?.ogAssetKey === "string" && json.data.ogAssetKey.length > 0,
        "Expected post ogAssetKey"
      );

      postAssetKey = json.data.ogAssetKey;
      createdPost = true;
      logPass("post created");
    }

    {
      const { response, json } = await request(
        baseUrl,
        `/api/admin/content/posts/${encodeURIComponent(postId)}`,
        {
          method: "PUT",
          headers: makeAdminHeaders(adminApiKey, {
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            title: `Smoke Post Updated ${postId}`,
          }),
        }
      );

      assertCondition(response.status === 200, "Expected 200 on post update");
      assertCondition(json?.success === true, "Expected post update success=true");
      assertCondition(
        typeof json?.data?.ogAssetKey === "string" && json.data.ogAssetKey.length > 0,
        "Expected updated post ogAssetKey"
      );
      postAssetKey = json.data.ogAssetKey;
      logPass("post updated");
    }

    {
      const first = await request(
        baseUrl,
        `/api/og/post?assetKey=${encodeURIComponent(postAssetKey)}`
      );
      const firstEtag = first.response.headers.get("etag");
      const firstContentType = first.response.headers.get("content-type") || "";

      assertCondition(first.response.status === 200, "Expected 200 on first OG post request");
      assertCondition(
        firstContentType.includes("image/png"),
        "Expected image/png content type for OG post"
      );
      assertCondition(Boolean(firstEtag), "Expected ETag on OG post response");

      const second = await request(
        baseUrl,
        `/api/og/post?assetKey=${encodeURIComponent(postAssetKey)}`,
        {
          headers: {
            "if-none-match": firstEtag,
          },
        }
      );

      assertCondition(second.response.status === 304, "Expected 304 on OG post cache recheck");
      logPass("post OG cache check passed (200 then 304)");
    }

    {
      const { response, json } = await request(
        baseUrl,
        `/api/admin/content/posts/${encodeURIComponent(postId)}`,
        {
          method: "DELETE",
          headers: makeAdminHeaders(adminApiKey),
        }
      );

      assertCondition(response.status === 200, "Expected 200 on post delete");
      assertCondition(json?.success === true, "Expected delete success=true");
      createdPost = false;
      logPass("post deleted");
    }

    {
      const { response } = await request(
        baseUrl,
        `/api/content/posts/${encodeURIComponent(postId)}`
      );
      assertCondition(response.status === 404, "Expected 404 after post deletion");
      logPass("post delete verified by public 404");
    }

    console.log("\n[done] API smoke checks passed.");
  } finally {
    if (createdProject) {
      await ensureDeleted(
        baseUrl,
        adminApiKey,
        `/api/admin/content/projects/${encodeURIComponent(projectId)}`,
        `project ${projectId}`
      );
    }
    if (createdPost) {
      await ensureDeleted(
        baseUrl,
        adminApiKey,
        `/api/admin/content/posts/${encodeURIComponent(postId)}`,
        `post ${postId}`
      );
    }
  }
}

run().catch((error) => {
  console.error(`\n[failed] ${error.message}`);
  process.exit(1);
});
