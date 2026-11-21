import { profile } from "@/config/profile";

export const siteConfig = {
  /** Exactly as written on the CV; used on the page itself. */
  name: profile.name,
  /** Title-cased for browser tabs, metadata and screen readers. */
  displayName: "Vi Thi Lan",
  description:
    "Portfolio and technical blog of a backend developer: Java, Spring Boot, databases, operating systems, networks and infrastructure notes.",
  /** The public navigation has exactly two items. */
  nav: [
    { label: "About", href: "/" },
    { label: "Blog", href: "/blog" },
  ],
  blog: {
    title: "Blog",
    description:
      "Technical notes on computer science, programming, infrastructure and English, organised by topic.",
  },
  /** Posts shown per page on blog listings and in the admin post list. */
  postsPerPage: 12,
} as const;
