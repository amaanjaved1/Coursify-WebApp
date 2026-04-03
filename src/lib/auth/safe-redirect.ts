/**
 * Validates a post-auth redirect target so we only navigate to same-origin relative paths.
 */
export function getSafeRedirectPath(
  raw: string | null | undefined,
  fallback: string = "/"
): string {
  if (!raw || typeof raw !== "string") return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  try {
    const decoded = decodeURIComponent(trimmed);
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return fallback;
  } catch {
    return fallback;
  }
  if (trimmed.length > 2048) return fallback;
  return trimmed;
}

/** Avoid redirect loops back into auth pages */
export function isAuthRoutePath(path: string): boolean {
  return (
    path === "/sign-in" ||
    path === "/sign-up" ||
    path.startsWith("/sign-in?") ||
    path.startsWith("/sign-up?")
  );
}

export function buildAuthHref(
  base: "/sign-in" | "/sign-up",
  redirectPath: string
): string {
  let safe = getSafeRedirectPath(redirectPath, "/");
  if (isAuthRoutePath(safe)) {
    safe = "/";
  }
  const params = new URLSearchParams();
  if (safe && safe !== "/") {
    params.set("redirect", safe);
  }
  return params.toString() ? `${base}?${params}` : base;
}
