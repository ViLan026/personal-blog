"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Starts the Google OAuth (PKCE) flow. Supabase redirects the browser to
 * Google, then back to /auth/callback, where the server exchanges the code for
 * a session and stores it in httpOnly cookies. Nothing is kept in localStorage.
 */
export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) throw oauthError;
      // Success: the browser is now navigating to Google.
    } catch {
      setError(
        "Could not start Google sign-in. Check the Supabase environment variables and the Google provider settings, then try again.",
      );
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={signIn}
        disabled={loading}
        aria-busy={loading}
        className="btn w-full"
      >
        {loading ? "Redirecting to Google…" : "Continue with Google"}
      </button>
      {error ? (
        <p role="alert" className="alert-error mt-4">
          <strong>Error:</strong> {error}
        </p>
      ) : null}
    </div>
  );
}
