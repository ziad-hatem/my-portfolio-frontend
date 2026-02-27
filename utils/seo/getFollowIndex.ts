export default function getFollowIndex(defaultValue = true): boolean {
  const raw = process.env.NEXT_PUBLIC_FOLLOW_INDEX;
  if (!raw) {
    return defaultValue;
  }

  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}
