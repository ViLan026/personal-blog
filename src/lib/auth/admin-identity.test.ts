import { test } from "node:test";
import assert from "node:assert/strict";
import { isAdminUser, safeRedirectPath, type UserLike } from "@/lib/auth/admin-identity";

const ADMIN = "owner@example.com";

function googleUser(overrides: Partial<UserLike> = {}, identityEmail = ADMIN): UserLike {
  return {
    email: ADMIN,
    email_confirmed_at: "2026-01-01T00:00:00Z",
    identities: [
      { provider: "google", identity_data: { email: identityEmail, email_verified: true } },
    ],
    ...overrides,
  };
}

test("accepts the configured admin signed in with Google", () => {
  assert.equal(isAdminUser(googleUser(), ADMIN), true);
});

test("email comparison ignores case and surrounding whitespace", () => {
  assert.equal(isAdminUser(googleUser({ email: "Owner@Example.COM" }, "OWNER@example.com"), "  owner@EXAMPLE.com "), true);
});

test("rejects any other Google account", () => {
  const other = googleUser({ email: "someone@example.com" }, "someone@example.com");
  assert.equal(isAdminUser(other, ADMIN), false);
});

test("rejects the admin's email when it is not confirmed", () => {
  assert.equal(isAdminUser(googleUser({ email_confirmed_at: null }), ADMIN), false);
  assert.equal(isAdminUser(googleUser({ email_confirmed_at: undefined }), ADMIN), false);
});

test("rejects an account with the right email but no Google identity", () => {
  // e.g. someone registered with email + password using the admin's address.
  const emailOnly = googleUser({ identities: [{ provider: "email", identity_data: { email: ADMIN } }] });
  assert.equal(isAdminUser(emailOnly, ADMIN), false);
  assert.equal(isAdminUser(googleUser({ identities: [] }), ADMIN), false);
  assert.equal(isAdminUser(googleUser({ identities: null }), ADMIN), false);
});

test("rejects a Google identity whose own email differs or is unverified", () => {
  assert.equal(isAdminUser(googleUser({}, "other@example.com"), ADMIN), false);
  const unverified = googleUser({
    identities: [{ provider: "google", identity_data: { email: ADMIN, email_verified: false } }],
  });
  assert.equal(isAdminUser(unverified, ADMIN), false);
  const noData = googleUser({ identities: [{ provider: "google", identity_data: null }] });
  assert.equal(isAdminUser(noData, ADMIN), false);
});

test("rejects everyone when ADMIN_EMAIL is blank", () => {
  assert.equal(isAdminUser(googleUser(), ""), false);
  assert.equal(isAdminUser(googleUser(), "   "), false);
  assert.equal(isAdminUser({ email: "", email_confirmed_at: "x", identities: [] }, ""), false);
});

test("rejects a user with no email", () => {
  assert.equal(isAdminUser(googleUser({ email: null }), ADMIN), false);
});

test("safeRedirectPath keeps same-site /admin paths", () => {
  assert.equal(safeRedirectPath("/admin"), "/admin");
  assert.equal(safeRedirectPath("/admin/posts"), "/admin/posts");
  assert.equal(safeRedirectPath("/admin/posts?status=draft&page=2"), "/admin/posts?status=draft&page=2");
});

test("safeRedirectPath falls back for empty input", () => {
  assert.equal(safeRedirectPath(null), "/admin");
  assert.equal(safeRedirectPath(undefined), "/admin");
  assert.equal(safeRedirectPath(""), "/admin");
  assert.equal(safeRedirectPath("", "/admin/posts"), "/admin/posts");
});

test("safeRedirectPath rejects other origins and tricks", () => {
  const bad = [
    "https://evil.example/admin",
    "http://evil.example",
    "//evil.example/admin",
    "///evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "admin/posts", // not rooted
    "/admin\n/x",
    "/admin\u0000",
  ];
  for (const value of bad) assert.equal(safeRedirectPath(value), "/admin", JSON.stringify(value));
});

test("safeRedirectPath only allows paths inside /admin and never the login page", () => {
  for (const value of ["/", "/blog", "/administrator", "/api/admin/posts", "/admin/login", "/admin/login?error=x", "/admin/../blog"]) {
    assert.equal(safeRedirectPath(value), "/admin", value);
  }
});
