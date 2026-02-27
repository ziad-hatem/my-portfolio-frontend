# Data Models

## Database
- Provider: MongoDB Atlas
- Connection envs:
  - `MONGODB_URI`
  - `MONGODB_DB_NAME` (default: `portfolio_analytics`)

## Active Collections

### 1) `content_home`
Purpose:
- Single canonical home-page content document.

Key fields:
- `key` (`default`)
- `name`, `role`, `description`
- `social_links[]`
- `buttons[]`
- experience/technology/post section fields
- `seo_settings`
- `createdAt`, `updatedAt`

Index:
- Unique: `{ key: 1 }`

Lifecycle:
- Seeded automatically if empty.
- Updated via `PUT /api/admin/content/home`.

### 2) `content_projects`
Purpose:
- Project list + detail content.

Key fields:
- `id`
- `title`, `company_name`, `project_description`
- `project_image.permalink`
- `project_overview[]`
- `project_name`, `project_link`
- `skills[]`
- `ogAssetKey`, `ogImagePath`
- `createdAt`, `updatedAt`

Index:
- Unique: `{ id: 1 }`

Lifecycle:
- Seeded with placeholder docs if empty.
- Managed through admin CRUD routes.
- `ogAssetKey` and `ogImagePath` regenerated on update.

### 3) `content_posts`
Purpose:
- Post list + detail content.

Key fields:
- `id`
- `title`, `author`, `post_text`
- `post_image.permalink`
- `publish_date`, `permalink`
- `ogAssetKey`, `ogImagePath`
- `createdAt`, `updatedAt`

Index:
- Unique: `{ id: 1 }`

Lifecycle:
- Seeded with placeholder docs if empty.
- Managed through admin CRUD routes.
- `ogAssetKey` and `ogImagePath` regenerated on update.

### 4) `og_assets`
Purpose:
- Persisted OG PNG image bytes and cache metadata.

Key fields:
- `assetKey`
- `kind` (`project` or `post`)
- `etag`
- `contentType` (`image/png`)
- `data` (Mongo `Binary`)
- `meta` (title/image/context)
- `createdAt`, `updatedAt`

Index:
- Unique: `{ assetKey: 1 }`

Lifecycle:
- Read on OG endpoint request.
- Written on first miss (or when new `assetKey` introduced by content update).

## Deprecated Collections (Drop)
These are intentionally not used by runtime and should be removed:
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

Use script:
- Dry-run: `npm run db:drop-deprecated:dry`
- Apply: `npm run db:drop-deprecated`

## Seeding Behavior
`ensureContentInfrastructure()` runs lazily from repository access and does the following:
1. Creates required unique indexes.
2. Seeds placeholder home/project/post docs if corresponding collections are empty.

Implications:
- New environment can render site routes immediately.
- Placeholder data is replaced later via admin APIs/UI.

## Type Notes
- `Date` fields are stored as Mongo dates and serialized to ISO strings in API responses.
- `skills` input accepts either plain string items or `{ id?, skill_name }` objects on create/update.
- Slug-like IDs are generated from title if ID is not provided.
