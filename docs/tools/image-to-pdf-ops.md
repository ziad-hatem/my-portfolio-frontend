# Image-to-PDF Ops Runbook

## Environment Variables
Required:
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `TOOLS_SHARE_TOKEN_SECRET`
- `TOOLS_CLEANUP_SECRET`

Strongly recommended for public deployment:
- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Limits:
- `TOOLS_IMAGE_PDF_TTL_SECONDS` (default `3600`)
- `TOOLS_IMAGE_PDF_MAX_FILES` (default `25`)
- `TOOLS_IMAGE_PDF_MAX_FILE_MB` (default `15`)
- `TOOLS_IMAGE_PDF_MAX_TOTAL_MB` (default `120`)
- `TOOLS_IMAGE_PDF_MAX_PAGES` (default `150`)
- `TOOLS_IMAGE_PDF_BURST_LIMIT` (default `8`)
- `TOOLS_IMAGE_PDF_HOURLY_LIMIT` (default `36`)
- `TOOLS_IMAGE_PDF_DOWNLOAD_LIMIT` (default `60` per 10 min window)

## Cleanup Endpoint
Route:
- `POST /api/tools/image-to-pdf/cleanup`

Auth:
- Header: `x-tools-cleanup-secret: <TOOLS_CLEANUP_SECRET>`
- `Authorization: Bearer <TOOLS_CLEANUP_SECRET>` is also accepted.

Recommended schedule:
- Every 5-10 minutes.

Expected response:
- `removedAssets`
- `removedChunks`
- `removedTokens`

The cleanup is idempotent and safe to call repeatedly.

## Abuse Mitigation Playbook
## 1) Baseline protections
- Keep burst/hourly limits enabled.
- Keep download limits enabled.
- Require Turnstile when burst threshold is exceeded.

## 2) If abuse spikes
1. Lower `TOOLS_IMAGE_PDF_BURST_LIMIT`.
2. Lower `TOOLS_IMAGE_PDF_HOURLY_LIMIT`.
3. Lower `TOOLS_IMAGE_PDF_DOWNLOAD_LIMIT`.
4. Ensure Upstash credentials are present (avoid in-memory fallback in production).
5. Verify `TURNSTILE_SECRET_KEY` is configured.

## 3) Incident checks
- Track `429` rate and conversion failure (`422`) rate.
- Watch Mongo collection growth around TTL boundaries.
- Verify cleanup sweep removes expired rows when TTL lag occurs.

## Troubleshooting
## `400` invalid payload
- Check `files[]` and `options` field format.
- Ensure MIME and extension match.

## `413` payload too large
- Reduce file count or file size.
- Adjust max env limits if needed.

## `422` conversion failure
- Check image integrity and extreme dimensions.

## `429` rate limited
- Wait and retry.
- If challenge required, provide valid Turnstile token.

## `410` share expired
- Expiry is hard; generate a new PDF.
