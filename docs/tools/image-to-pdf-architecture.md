# Image-to-PDF Architecture

## Overview
The Image-to-PDF tool now runs in a **server-first** architecture with **local fallback** on the client.

- Frontend route: `/tools/image-to-pdf`
- Core convert API: `POST /api/tools/image-to-pdf/convert`
- Share metadata API: `GET /api/tools/image-to-pdf/share/{token}`
- Share download API: `GET /api/tools/image-to-pdf/share/{token}/download`
- Revoke API: `DELETE /api/tools/image-to-pdf/share/{token}`
- Cleanup API: `POST /api/tools/image-to-pdf/cleanup`

## Data Flow
1. User uploads images and sets conversion options.
2. Frontend sends `multipart/form-data` to convert endpoint with:
   - `files[]`
   - `options` JSON string
   - optional `turnstileToken`
3. Server validates files/options and enforces abuse controls.
4. Server normalizes images using `sharp` and composes PDF using `pdf-lib`.
5. OCR execution is currently disabled for reliability (option is ignored server-side).
6. PDF output is chunked and stored in Mongo temporary collections.
7. Signed share token is generated; DB stores only token hash.
8. Response returns `shareUrl`, `downloadUrl`, and hard `expiresAt`.

## Core Modules
- `lib/tools/image-to-pdf-types.ts`
  - Option contracts, parse/sanitize logic, limits from env.
- `lib/tools/image-to-pdf-security.ts`
  - Signed token generation/verification.
  - Hashing for token storage + IP/fingerprint storage fields.
- `lib/tools/image-to-pdf-abuse.ts`
  - Burst/hourly convert guards.
  - Download guard.
  - Turnstile verification hook.
- `lib/tools/image-to-pdf-converter.ts`
  - MIME + extension checks.
  - Image normalization.
  - PDF generation pipeline (OCR disabled in current release).
- `lib/tools/image-to-pdf-storage.ts`
  - Mongo collections, indexes, chunk persistence, token lookups, cleanup.

## Mongo Collections and Lifecycle
### `tool_pdf_assets`
- Metadata only:
  - `assetId`, `filename`, `pageCount`, `fileSizeBytes`, `ocrApplied`
  - `status`, `createdAt`, `expiresAt`
  - `clientFingerprintHash`, `ipHash`
- Indexes:
  - unique `assetId`
  - TTL `expiresAt`
  - `createdAt` desc
  - `status`

### `tool_pdf_asset_chunks`
- Binary chunks of final PDF:
  - `assetId`, `chunkIndex`, `data`, `expiresAt`
- Indexes:
  - unique (`assetId`, `chunkIndex`)
  - TTL `expiresAt`
  - `assetId`

### `tool_pdf_share_tokens`
- Token record:
  - `tokenHash`, `assetId`, `createdAt`, `expiresAt`, `revokedAt`
- Indexes:
  - unique `tokenHash`
  - TTL `expiresAt`
  - `assetId`

## OCR Status
OCR processing is intentionally disabled right now to keep conversion stable.
The option field is accepted for compatibility but ignored by the converter.

## Share Token Flow
1. Server creates payload: `assetId`, `exp`, random `nonce`.
2. Payload is HMAC-signed using `TOOLS_SHARE_TOKEN_SECRET`.
3. Raw token is returned in URL path; DB stores only token hash.
4. Share/read/download routes verify signature + payload + DB state.
5. Expired/revoked tokens return `410`; invalid tokens return `404`.

## Retention and Deletion Guarantees
- Source uploads are processed in memory and not persisted.
- Only generated output + minimal metadata are retained.
- Hard expiry is enforced by:
  - token payload expiration
  - DB record expiration fields
  - TTL indexes
- Backup sweep endpoint (`/cleanup`) deletes expired/revoked records idempotently.
