/**
 * Returns the canonical public URL of the app (no trailing slash).
 * Set NEXT_PUBLIC_APP_URL=https://mightyflights.co.za in Vercel env vars.
 * Falls back to an empty string (relative URLs) for local dev.
 */
export function appUrl(path: string = ""): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return `${base}${path}`;
}
