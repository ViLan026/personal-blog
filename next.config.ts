import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is intentionally disabled: this is a small site whose
  // public pages read Supabase per request (`dynamic = "force-dynamic"`), and
  // the admin area is cookie/session based.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  poweredByHeader: false,
};

export default nextConfig;
