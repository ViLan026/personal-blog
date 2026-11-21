"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Last-resort boundary. It deliberately shows no error details: stack traces,
 * SQL messages and configuration problems stay in the server logs.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="container-page flex flex-1 flex-col justify-center py-20">
      <p className="tag-solid self-start font-mono">Error</p>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-prose text-lg">
        This page could not be loaded. Please try again in a moment.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-sm">Reference: {error.digest}</p>
      ) : null}
      <p className="mt-8 flex flex-wrap gap-3">
        <button type="button" className="btn" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/" className="btn-outline">
          Go to About
        </Link>
      </p>
    </main>
  );
}
