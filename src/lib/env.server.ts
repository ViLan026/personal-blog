import "server-only";

import { z } from "zod";
import { EnvError } from "@/lib/env";

const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().trim().min(1),
  ADMIN_EMAIL: z.email(),
});

/**
 * Server-only secrets. Importing this module from a Client Component fails the
 * build (`server-only`), so these values can never reach the browser bundle.
 */
export function getServerEnv() {
  const parsed = serverSchema.safeParse({
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  });
  if (!parsed.success) {
    const names = [
      ...new Set(parsed.error.issues.map((i) => String(i.path[0] ?? "unknown"))),
    ];
    throw new EnvError(names);
  }
  return {
    SUPABASE_SECRET_KEY: parsed.data.SUPABASE_SECRET_KEY,
    ADMIN_EMAIL: parsed.data.ADMIN_EMAIL.toLowerCase(),
  };
}
