import { z } from "zod";

/**
 * Environment validation with clear, secret-free error messages.
 *
 * NEXT_PUBLIC_* values MUST be read with a literal `process.env.NEXT_PUBLIC_X`
 * expression so Next.js can inline them into the browser bundle, which is why
 * they are listed one by one below instead of being read dynamically.
 */

const requiredString = z.string().trim().min(1);

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: requiredString,
});

export class EnvError extends Error {
  constructor(public readonly variables: string[]) {
    super(
      `Missing or invalid environment variable(s): ${variables.join(", ")}. ` +
        "Copy .env.example to .env.local and fill them in (see README.md). " +
        "On Vercel, add them under Project Settings → Environment Variables.",
    );
    this.name = "EnvError";
  }
}

function failWith(error: z.ZodError): never {
  const names = [
    ...new Set(error.issues.map((issue) => String(issue.path[0] ?? "unknown"))),
  ];
  throw new EnvError(names);
}

/** Variables that are safe to expose to the browser. */
export function getPublicEnv() {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!parsed.success) failWith(parsed.error);
  return parsed.data;
}

/**
 * Canonical origin of the site, without a trailing slash.
 * Optional: falls back to the Vercel production URL, then localhost.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const url = explicit || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return url.replace(/\/+$/, "");
}
