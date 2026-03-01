/**
 * Strips all HTML tags from a string, collapses whitespace, and trims.
 * Use this for plain-text excerpts where HTML is not desired.
 */
export function stripHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
