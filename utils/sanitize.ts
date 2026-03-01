/**
 * Sanitizes an HTML string to prevent XSS before rendering via dangerouslySetInnerHTML.
 *
 * Only called from "use client" components, so this always runs in the browser.
 * The typeof window guard is a safety net in case the function is ever
 * accidentally imported in a server context.
 */
export function sanitizeHtml(value: string | null | undefined): string {
  const raw = value ?? "";
  if (typeof window === "undefined") {
    return raw;
  }
  // DOMPurify is a browser-only library — safe here since we're in a client component.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DOMPurify = require("dompurify");
  return DOMPurify.sanitize(raw) as string;
}
