import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/admin/GoogleSignInButton";
import { getAdminCheck } from "@/lib/auth/require-admin";
import { EnvError } from "@/lib/env";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized:
    "That Google account is not allowed to use the admin area. You have been signed out.",
  oauth_failed: "Google sign-in was cancelled or failed. Please try again.",
  missing_code: "Sign-in could not be completed. Please try again.",
  exchange_failed: "Sign-in could not be completed. Please try again.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? ERROR_MESSAGES[error] : undefined;

  let configError: string | null = null;
  try {
    const check = await getAdminCheck();
    if (check.ok) redirect("/admin");
  } catch (caught) {
    // redirect() works by throwing; let Next.js handle that one.
    if (!(caught instanceof EnvError)) throw caught;
    configError = caught.message;
  }

  return (
    <main id="main" className="container-page flex min-h-dvh items-center justify-center py-12">
      <div className="w-full max-w-md border-2 border-primary p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Admin sign in</h1>
        <p className="mt-2">
          This area is for the site owner. Sign in with the authorised Google account.
        </p>

        {message ? (
          <p role="alert" className="alert-error mt-6">
            <strong>Error:</strong> {message}
          </p>
        ) : null}

        {configError ? (
          <p role="alert" className="alert-error mt-6">
            <strong>Setup required:</strong> {configError}
          </p>
        ) : (
          <div className="mt-6">
            <GoogleSignInButton />
          </div>
        )}

        <p className="mt-8 border-t-2 border-ink pt-4 text-sm">
          <Link href="/" className="link">
            Back to the website
          </Link>
        </p>
      </div>
    </main>
  );
}
