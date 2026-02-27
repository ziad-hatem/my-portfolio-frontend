# Migration Runbook

## Scope
Rebuild backend to Next.js APIs on MongoDB Atlas, remove deprecated domains (tracking/fingerprint/profile/forms/congratulation/analytics), and remove GraphQL runtime dependency for site content.

## Preconditions
1. Configure env vars:
   - `MONGODB_URI`
   - `MONGODB_DB_NAME`
   - `ADMIN_API_KEY`
   - `REVALIDATE_SECRET`
   - `RESEND_API_KEY`
   - `CONTACT_TO_EMAIL`
   - `CONTACT_FROM_EMAIL`
   - `CONTACT_CONFIRMATION_FROM_EMAIL`
   - `NEXT_PUBLIC_FRONTEND_URL`
   - `UPSTASH_REDIS_REST_URL` (recommended for production rate limiting)
   - `UPSTASH_REDIS_REST_TOKEN` (recommended for production rate limiting)
   - `RATE_LIMIT_PREFIX` (optional)
2. Install dependencies: `npm install`
3. Validate baseline build: `npm run build`

## Phase Order (Implemented)

### Phase 1: Core Infrastructure + Public Content APIs
1. Replace hardcoded Mongo config with env-based client (`lib/mongodb.ts`).
2. Introduce content repository/models (`lib/content-types.ts`, `lib/content-repository.ts`).
3. Add public content endpoints:
   - `/api/content/home`
   - `/api/content/projects`
   - `/api/content/projects/:id`
   - `/api/content/posts`
   - `/api/content/posts/:id`
4. Replace GraphQL-dependent read flow with internal repository/service:
   - `lib/get-data/*`
   - `app/sitemap.ts`
5. Enable placeholder seed docs via `ensureContentInfrastructure()`.

Verification gate:
- `npm run build` succeeds.
- Home/projects/posts pages render without `NEXT_PUBLIC_BACKEND_URL`.

Rollback notes:
- Revert files changed in this phase.
- Restore previous data-fetching implementation if needed.
- No collection drops happen in this phase, so data rollback is code-level.

### Phase 2: Admin CRUD + Security Hardening
1. Add admin bearer auth (`lib/admin-auth.ts`).
2. Implement admin CRUD routes for home/projects/posts under `/api/admin/content/*`.
3. Harden `/api/revalidate` with admin bearer auth + `REVALIDATE_SECRET`.
4. Harden `/api/contact` with:
   - env-driven email config
   - payload validation
   - rate limiting

Verification gate:
- Unauthorized admin calls return `401`.
- Authorized CRUD requests succeed.
- Revalidate fails with wrong secret and succeeds with valid secret.

Rollback notes:
- Revert admin route files and auth helper.
- Restore prior contact/revalidate handlers.

### Phase 3: OG Persistence + Immutable Caching
1. Add OG asset persistence service (`lib/og-assets.tsx`).
2. Rewrite:
   - `/api/og/project`
   - `/api/og/post`
3. Behavior:
   - cached asset served when present
   - generated once when missing
   - stored in `og_assets`
   - immutable one-year cache headers + ETag
4. Warm OG asset generation on admin create/update for posts/projects.

Verification gate:
- First request generates/stores asset.
- Subsequent requests use cached asset and return stable ETag behavior.

Rollback notes:
- Revert OG route/service changes.
- Keep `og_assets` documents (safe to retain); optional manual cleanup.

### Phase 4: Deprecated Domain Removal + Cleanup
1. Remove deprecated API route groups:
   - `/api/analytics/*`
   - `/api/fingerprint/*`
   - `/api/profile/*`
   - `/api/track/*`
   - `/api/congratulation/*`
   - `/api/og/congratulation`
2. Remove related frontend integrations:
   - tracker scripts from layout
   - cookie/privacy tracking component usage
   - analytics helper calls
3. Remove forms/congratulation/profile admin/frontend pages and obsolete libs/types.
4. Remove legacy `functions/server/*`.
5. Drop deprecated Mongo collections (script provided below).

Verification gate:
- `npm run build` succeeds.
- No source references remain to removed endpoint domains.

Rollback notes:
- File-level rollback by restoring removed directories from VCS.
- Collection rollback requires backup/restore (drops are destructive).

## Collection Cleanup (Destructive)
Script: `scripts/drop-deprecated-collections.mjs`

Safe dry-run:
- `npm run db:drop-deprecated:dry`

Execute drop:
- `npm run db:drop-deprecated`

Collections dropped when present:
- `events`
- `views`
- `view_details`
- `users`
- `fingerprints`
- `user_profiles`
- `near_users`
- `forms`
- `submissions`
- `congratulations`

Rollback for dropped collections:
- Restore from Atlas backup snapshot or point-in-time recovery.

## Final Smoke Checklist
1. Build: `npm run build`
2. API smoke script:
   - Default base URL: `npm run smoke:api`
   - Custom base URL: `npm run smoke:api -- --base-url https://your-domain.com`
   - API key options:
     - env: `ADMIN_API_KEY=... npm run smoke:api`
     - arg: `npm run smoke:api -- --api-key your_key`
3. Public content routes return `200` and valid JSON.
4. Admin routes require bearer token.
5. Contact route validates payload and rate limit.
6. Revalidate route enforces bearer token + secret.
7. OG endpoints return image bytes with immutable cache headers.
8. Removed route families return `404`.
