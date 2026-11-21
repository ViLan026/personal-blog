import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="container-page flex-1 py-20">
        <p className="tag-solid font-mono">404</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">Page not found</h1>
        <p className="mt-4 max-w-prose text-lg">
          The page you are looking for does not exist, or it is not published.
        </p>
        <p className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn">
            Go to About
          </Link>
          <Link href="/blog" className="btn-outline">
            Browse the Blog
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
