/**
 * Validates whether an email string follows a broad, standard format.
 * Returns true if valid, false otherwise.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
