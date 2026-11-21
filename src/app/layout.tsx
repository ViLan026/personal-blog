import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { getSiteUrl } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteConfig.displayName} | Backend Developer`,
    template: `%s | ${siteConfig.displayName}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.displayName,
  authors: [{ name: siteConfig.displayName }],
  openGraph: {
    type: "website",
    siteName: siteConfig.displayName,
    title: `${siteConfig.displayName} | Backend Developer`,
    description: siteConfig.description,
    locale: "en_US",
  },
  twitter: { card: "summary" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // One of the three palette colours.
  themeColor: "#f6f9fc",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
