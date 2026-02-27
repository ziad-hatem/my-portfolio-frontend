# Backend Architecture

## Overview
- Runtime: Next.js App Router API route handlers under `app/api/*`.
- Database: MongoDB Atlas via native MongoDB driver (`mongodb`).
- Data access: central repository layer in `lib/content-repository.ts`.
- Auth: static admin bearer token (`ADMIN_API_KEY`) validated in `lib/admin-auth.ts`.
- OG images: generated via `ImageResponse`, persisted in MongoDB (`og_assets`), served with immutable cache headers.

## Module Map
- `lib/mongodb.ts`
  - Creates shared MongoDB client from `MONGODB_URI`.
  - Uses `MONGODB_DB_NAME` (default `portfolio_analytics`).
- `lib/content-types.ts`
  - Type definitions for home, projects, posts.
- `lib/content-repository.ts`
  - Infrastructure bootstrap:
    - Ensures indexes:
      - `content_home.key` unique
      - `content_projects.id` unique
      - `content_posts.id` unique
      - `og_assets.assetKey` unique
    - Seeds placeholder docs when collections are empty.
  - CRUD for home/projects/posts.
  - Regenerates `ogAssetKey` and `ogImagePath` on post/project updates.
- `lib/content-service.ts`
  - Compatibility layer for frontend data-shape expectations (`entries`, `entry`, home bundle).
- `lib/og-assets.tsx`
  - Renders project/post OG PNGs.
  - Stores and reads image bytes + ETag in `og_assets`.
- `lib/admin-auth.ts`
  - Validates `Authorization: Bearer <ADMIN_API_KEY>`.
- `lib/rate-limit.ts`
  - Upstash Redis-backed rate limiting when configured.
  - Automatic in-memory fallback when Upstash env is not configured.

## Route Groups
- Public content read APIs:
  - `GET /api/content/home`
  - `GET /api/content/projects`
  - `GET /api/content/projects/:id`
  - `GET /api/content/posts`
  - `GET /api/content/posts/:id`
- Admin content CRUD APIs (bearer-protected):
  - `GET, PUT /api/admin/content/home`
  - `GET, POST /api/admin/content/projects`
  - `GET, PUT, DELETE /api/admin/content/projects/:id`
  - `GET, POST /api/admin/content/posts`
  - `GET, PUT, DELETE /api/admin/content/posts/:id`
- Shared operational APIs:
  - `POST /api/contact`
  - `GET /api/revalidate`
- OG APIs:
  - `GET /api/og/project`
  - `GET /api/og/post`

## Auth Flow
1. Client calls admin route with `Authorization: Bearer <token>`.
2. `validateAdminApiKey()` compares `<token>` with `ADMIN_API_KEY`.
3. Behavior:
   - Missing/invalid token -> `401 { success: false, error: ... }`.
   - Missing `ADMIN_API_KEY` env -> `500 { success: false, error: ... }`.
4. Authorized request proceeds to route logic.

## Revalidate Flow
1. Request must pass admin bearer auth.
2. `secret` query param must equal `REVALIDATE_SECRET`.
3. Optional `path` (default `/`) and `type` (`page` or `layout`) are parsed.
4. `revalidatePath(path, type)` executes and returns `{ success: true, revalidated: true, ... }`.

## OG Caching Flow
1. Route receives `assetKey` (preferred) or legacy query params (`title`, `image`, `author/company`).
2. `getOgAssetByKey()` checks `og_assets`.
3. If found:
   - Return stored bytes with headers:
     - `Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable`
     - `CDN-Cache-Control`, `Vercel-CDN-Cache-Control`, `ETag`
   - Return `304` when `if-none-match` equals stored ETag.
4. If missing:
   - Render image with `ImageResponse`.
   - Persist bytes + metadata + ETag in `og_assets`.
   - Return generated image with same cache headers.
5. Admin create/update for posts/projects triggers `ensurePostOgAsset` / `ensureProjectOgAsset` to warm cache.

## Collection Map
- Active:
  - `content_home`
  - `content_projects`
  - `content_posts`
  - `og_assets`
- Deprecated and removed from runtime usage:
  - `events`, `views`, `view_details`, `users`, `fingerprints`, `user_profiles`, `near_users`, `forms`, `submissions`, `congratulations`

## Environment Variables
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `ADMIN_API_KEY`
- `REVALIDATE_SECRET`
- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`
- `CONTACT_CONFIRMATION_FROM_EMAIL`
- `NEXT_PUBLIC_FRONTEND_URL`
- `UPSTASH_REDIS_REST_URL` (optional but recommended for production)
- `UPSTASH_REDIS_REST_TOKEN` (optional but recommended for production)
- `RATE_LIMIT_PREFIX` (optional)
