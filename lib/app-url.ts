import { headers } from "next/headers";

/**
 * Returns the canonical public URL for the given path (no trailing slash on base).
 * Prefers NEXT_PUBLIC_APP_URL env var; falls back to deriving base from request headers.
 * Must be called from a server component or server action.
 */
export async function appUrl(path: string = ""): Promise<string> {
  const configured = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (configured) return `${configured}${path}`;
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}${path}`;
}
