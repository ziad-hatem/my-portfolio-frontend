# Frontend Integration Guide

## Base Assumption
- All routes are same-origin Next.js APIs.
- Example base URL: `https://your-domain.com`

## Common Response Contract

Success (most JSON routes):
```json
{ "success": true, "data": {} }
```

Error:
```json
{ "success": false, "error": "Human-readable message" }
```

Notes:
- Admin auth failures return `401`.
- Some misconfiguration cases return `500` (for example missing `ADMIN_API_KEY`).
- OG routes return binary PNG, not JSON.

## Public Content APIs

### Home
`GET /api/content/home`

Response:
```json
{
  "success": true,
  "data": {
    "key": "default",
    "name": "Frontend Developer",
    "role": "Full Stack Engineer"
  }
}
```

### Projects List
`GET /api/content/projects`

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "portfolio-rebuild",
      "title": "Portfolio Rebuild",
      "ogImagePath": "/api/og/project?assetKey=project%3Aportfolio-rebuild%3A1730000000000"
    }
  ]
}
```

### Project Detail
`GET /api/content/projects/:id`

- `404` when missing.

### Posts List
`GET /api/content/posts`

### Post Detail
`GET /api/content/posts/:id`

- `404` when missing.

## Admin Content APIs

## Auth Header
All admin routes require:
```http
Authorization: Bearer <ADMIN_API_KEY>
```

### Home
- `GET /api/admin/content/home`
- `PUT /api/admin/content/home`

Example update:
```bash
curl -X PUT "https://your-domain.com/api/admin/content/home" \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ziad Hatem","role":"Full Stack Engineer"}'
```

### Projects
- `GET /api/admin/content/projects`
- `POST /api/admin/content/projects`
- `GET /api/admin/content/projects/:id`
- `PUT /api/admin/content/projects/:id`
- `DELETE /api/admin/content/projects/:id`

Create payload minimum:
```json
{
  "title": "New Project",
  "project_description": "Project summary"
}
```

### Posts
- `GET /api/admin/content/posts`
- `POST /api/admin/content/posts`
- `GET /api/admin/content/posts/:id`
- `PUT /api/admin/content/posts/:id`
- `DELETE /api/admin/content/posts/:id`

Create payload minimum:
```json
{
  "title": "New Post",
  "post_text": "<p>Body</p>"
}
```

## Contact API
`POST /api/contact`

Request body:
```json
{
  "name": "Your Name",
  "email": "name@example.com",
  "subject": "Hello",
  "message": "Message text"
}
```

Behavior:
- Validates required fields and email format.
- Rate limits by requester IP (Upstash Redis-backed when configured, in-memory fallback otherwise).
- Sends admin notification email.
- Attempts user confirmation email (non-fatal if confirmation fails).

## Revalidate API
`GET /api/revalidate?secret=<REVALIDATE_SECRET>&path=/posts&type=page`

Requirements:
- Admin bearer token
- Correct `secret` query value

Success response:
```json
{
  "success": true,
  "revalidated": true,
  "path": "/posts",
  "type": "page",
  "timestamp": "2026-02-27T00:00:00.000Z"
}
```

## OG APIs
- `GET /api/og/project?assetKey=...`
- `GET /api/og/post?assetKey=...`

Expected frontend usage:
- Use `ogImagePath` field returned in project/post APIs for metadata image URLs.
- Browser/CDN receives one-year immutable cache headers and ETag.
- On content updates, new `ogAssetKey` creates a new immutable asset path.

## Removed Domains
Frontend should not call these anymore:
- `/api/analytics/*`
- `/api/fingerprint/*`
- `/api/profile/*`
- `/api/track/*`
- `/api/congratulation/*`
- `/api/og/congratulation`

These removed routes now resolve as `404`.
