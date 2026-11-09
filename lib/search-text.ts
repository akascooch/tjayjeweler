export const MAX_SEARCH_LENGTH = 200;

export function searchQuery(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, MAX_SEARCH_LENGTH);
}

/** Keeps `%`, `_`, and `\` literal inside a Prisma `contains` pattern. */
export function literalContains(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}
