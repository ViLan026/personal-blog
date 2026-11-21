# Vi Thi Lan — Portfolio & Blog

A small, responsive personal website with two public sections:

- **About** (`/`) — profile, education, projects, research and skills, driven by one config file.
- **Blog** (`/blog`) — technical notes organised in nested categories. Articles are written as
  Markdown files on your computer and **uploaded** by the administrator; there is no in-browser editor.

It runs entirely on free tiers: **Vercel Hobby** (hosting) + **Supabase Free** (PostgreSQL and Google
sign-in) + **GitHub Free**. No Supabase Storage is used: the Markdown text is stored in a
`TEXT` column.

| Layer         | Technology                                                |
| ------------- | --------------------------------------------------------- |
| Framework     | Next.js 16 (App Router), React 19, TypeScript             |
| Styling       | Tailwind CSS 4, three-colour design system                |
| Database/Auth | Supabase PostgreSQL + Supabase Auth (Google OAuth)        |
| Sessions      | HTTP-only cookies via `@supabase/ssr`                     |
| Markdown      | `react-markdown` + `remark-gfm` (raw HTML disabled)       |
| Validation    | Zod                                                       |

---
 
## 1. Run it locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
cp .env.example .env.local     # then fill in the values (section 2)
npm run dev                    # http://localhost:3000
```

The **About page works without any configuration**. The Blog and Admin need the Supabase
variables; until they are set, the Admin login page shows a "Setup required" message that names the
missing variables.

Add your portrait as **`public/me.png`**. Until the file exists, a block with your initials is shown
instead of a broken image.

### Useful commands

| Command             | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `npm run dev`       | Development server                             |
| `npm run lint`      | ESLint                                         |
| `npm run typecheck` | `tsc --noEmit`                                 |
| `npm test`          | Unit tests (slugs, category tree, Markdown, admin identity, redirects) |
| `npm run build`     | Production build                               |
| `npm start`         | Serve the production build                     |

---

## 2. Environment variables

Copy `.env.example` to `.env.local`. **Never commit `.env.local` or any real key.**

| Variable                               | Where to find it                                                    | Exposed to browser? |
| -------------------------------------- | ------------------------------------------------------------------- | ------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | Your site origin, no trailing slash. Local: `http://localhost:3000` | yes (not secret)    |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase → Project Settings → API → Project URL                     | yes (not secret)    |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → **Publishable** key        | yes; limited by RLS |
| `SUPABASE_SECRET_KEY`                  | Supabase → Project Settings → API Keys → **Secret** key             | **never**           |
| `ADMIN_EMAIL`                          | The one Google account allowed into `/admin`                        | **never**           |

Notes:

- `SUPABASE_SECRET_KEY` bypasses Row Level Security. It is read only in server code (`server-only`
  makes the build fail if a Client Component imports it), is never prefixed `NEXT_PUBLIC_`, and is
  never returned by any API route. A legacy `service_role` key also works in this variable if your
  project does not have the new key format yet.
- `ADMIN_EMAIL` is **not** necessarily the email on your CV. It must be the Google account you will
  actually sign in with.
- Missing or invalid variables produce a clear message that names the variable (never its value).

---

## 3. Supabase setup (manual, needs your account)

1. Create a project at <https://supabase.com> (Free plan). Save the database password somewhere safe.
2. **Create the tables.** Open **SQL Editor** and run, in this order, the contents of:
   1. `supabase/migrations/20261101000000_create_blog_schema.sql` — tables, constraints, indexes,
      `updated_at` / `published_at` / circular-category triggers.
   2. `supabase/migrations/20261101000100_enable_rls_policies.sql` — Row Level Security.

   (Or, with the Supabase CLI: `supabase link --project-ref <ref>` then `supabase db push`.)
3. **Optional starter categories.** Run `supabase/seed.sql` in the SQL Editor. It is safe to run
   more than once (rows are matched by slug) and it creates **no articles**. Everything can be
   renamed, moved or deleted later in `/admin/categories`.
4. **API keys.** Project Settings → API Keys: copy the Project URL, the Publishable key and the
   Secret key into `.env.local`.
5. **Auth URLs.** Authentication → URL Configuration:
   - Site URL: your production URL (use `http://localhost:3000` while developing).
   - Redirect URLs: add `http://localhost:3000/auth/callback` and
     `https://<your-site>.vercel.app/auth/callback`.
6. **Google provider.** See section 4.
7. **Recommended hardening.** After you have signed in once as the administrator, switch off
   *Allow new users to sign up* (Authentication → Sign In / Providers → User Signups; the label may
   differ slightly by dashboard version). The application already rejects every other Google
   account, but this also stops Supabase from creating records for them. Leave email/password
   sign-in off: the app only supports Google.

### What the database enforces

- `categories` is a self-referencing tree (`parent_id`, `ON DELETE RESTRICT`); `slug` is globally
  unique. A trigger **forbids circular hierarchies** (a category can never become its own descendant's child).
- `posts.category_id` is `ON DELETE RESTRICT`: a category that still has posts or subcategories
  cannot be deleted.
- Slugs must match `^[a-z0-9]+(-[a-z0-9]+)*$`; titles and Markdown must not be blank.
- `status` is `draft` or `published`. A published post always has `published_at`; it is filled
  automatically the first time a post is published and kept if you later unpublish it.
- **RLS:** `anon` and `authenticated` may `SELECT` categories and **published** posts only. All
  insert/update/delete policies are explicit denials and the table privileges are revoked, so even
  the browser-visible publishable key cannot write or read drafts.

---

## 4. Google OAuth setup (manual, needs your account)

1. In the [Google Cloud Console](https://console.cloud.google.com/) create (or choose) a project.
2. Configure the **OAuth consent screen** (Google Auth Platform): app name, support email, and the
   default scopes (`openid`, `email`, `profile`). While the app is in *Testing*, add your Google
   account under **Test users**.
3. **Credentials → Create credentials → OAuth client ID → Web application.**
   - Authorised JavaScript origins: `http://localhost:3000` and your Vercel URL.
   - Authorised redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
     (copy it from Supabase → Authentication → Sign In / Providers → Google).
4. Copy the **Client ID** and **Client secret** into Supabase → Authentication → Sign In / Providers
   → **Google**, enable it, and save. The secret lives only in Supabase, never in this repository.
5. Set `ADMIN_EMAIL` to the Google account you will use, then open `/admin/login`.

---

## 5. Using the Admin

Sign in at `/admin/login` (there is deliberately no link to it from the public site).

- **Categories** — view the tree, create root and nested categories, edit name / slug /
  description / sort order, change the parent, delete. Deleting is refused with a clear message while
  a category still has subcategories or posts (drafts count).
- **Posts → Add new post** — fill in title (slug is generated and editable), description, category,
  **upload a `.md` / `.markdown` file** (max 1 MB, UTF-8), check the preview, then save as *Draft* or
  *Published*. The file's first `# Heading` pre-fills the title if it is empty.
- **Editing** — change metadata at any time. To change the article body, upload a replacement file;
  the body can never be edited as text in the browser.
- **Publish / Change to Draft / Delete** — from the post list. Changing to Draft removes the article
  from every public page, listing and the sitemap immediately. Deleting asks for confirmation.

Markdown notes: YAML front matter at the very top of a file is ignored; a leading `# Title` that
repeats the post title is not shown twice; `##` and `###` headings feed the table of contents.
Code blocks are black and white (no syntax colours) and scroll sideways; wide tables scroll inside
their own frame.

Two things in an article are **not** under the site's three-colour system because they come from the
file you upload, not from the interface: **colour emoji** (drawn by the visitor's own emoji font) and
**images hosted elsewhere** (an image whose address no longer works shows the browser's own
"broken image" icon). Raw HTML, `<script>`, `javascript:` and `data:` links/images inside Markdown are
always dropped.

---

## 6. Editing the About page

All About content comes from **`src/config/profile.ts`** (summary, graduation status, projects, skills,
contact links). Edit that file; no component needs to change. The navigation is defined in
`src/config/site.ts` and intentionally has only **About** and **Blog**.

---

## 7. Deploy to Vercel (manual, needs your accounts)

1. Push this repository to GitHub (check `git status`: `.env.local` must not appear).
2. In Vercel: **Add New → Project → Import** the repository. The Next.js preset is detected
   automatically; no build settings need to change.
3. Add the five environment variables from section 2 under **Settings → Environment Variables**
   (Production, and Preview if you use preview deployments). Set `NEXT_PUBLIC_SITE_URL` to the
   production URL, e.g. `https://your-site.vercel.app`.
4. Deploy. Then go back to Supabase and Google and make sure the production
   `…/auth/callback` and origin are listed (sections 3 and 4).
5. Visit `/admin/login` on the live site and sign in once to confirm everything works.

---

## 8. Security model

| Concern                | How it is handled                                                                 |
| ---------------------- | --------------------------------------------------------------------------------- |
| Who is the admin       | `requireAdmin()` verifies the session with Supabase (`getUser()`), then requires `ADMIN_EMAIL` **and** a verified Google identity with that email |
| Where it is enforced   | Every `/api/admin/*` handler is wrapped by `adminApi()`, which runs `requireAdmin()` before the handler body; every admin page and the admin layout call `requireAdminPage()`. `src/proxy.ts` only refreshes the session and redirects early, it is **not** the security boundary |
| Wrong Google account   | Signed out immediately, error shown, no admin data returned                       |
| Session                | Supabase SSR cookies: `httpOnly`, `sameSite=lax`, `secure` in production. No `localStorage`, no hand-made login cookie |
| Redirects              | The OAuth `next` parameter must be a same-site path inside `/admin`; everything else becomes `/admin` |
| CSRF                   | `SameSite=Lax` plus an `Origin` check on every state-changing admin request       |
| Database writes        | Only through the server-only secret key after `requireAdmin()`; browsers cannot write |
| Drafts                 | Hidden by RLS, not only by query filters                                          |
| Markdown               | Untrusted: no raw HTML (`skipHtml`), no `rehype-raw`, no `dangerouslySetInnerHTML`; only `http`, `https`, `mailto`, anchors and relative links survive |
| Errors                 | Safe JSON messages; raw SQL errors and stack traces stay in server logs           |

---

## 9. Free-tier limitations

Free plans change. Treat this list as a reminder to check the current terms, not as a guarantee:

- **Supabase Free** — the database has a size cap, and projects can be **paused after a period of
  inactivity** (you restore them from the dashboard; a paused project makes the site's Blog and Admin
  fail until then). Bandwidth and monthly active users are limited, and automatic backups and
  point-in-time recovery are not something to rely on at this tier. See <https://supabase.com/pricing>.
- **Vercel Hobby** — intended for personal, non-commercial projects, with limits on bandwidth,
  build minutes and function execution. See <https://vercel.com/pricing>.
- **Default `*.vercel.app` domain** — no custom domain is required or assumed.
- Nothing here is "unlimited", and free usage is not guaranteed to stay free. A personal blog of
  Markdown text is far below the typical limits, but you remain responsible for watching your usage.

---

## 10. Backing up PostgreSQL

Because the free tier is not a backup strategy, take a manual backup regularly (for example after
publishing a batch of articles).

**Option A — `pg_dump` (full copy of schema and data)**

1. Supabase → **Connect** → copy the **Session pooler** connection string (it works over IPv4) and
   insert your database password.
2. Run (PostgreSQL client tools required):

   ```bash
   pg_dump "postgresql://postgres.<project-ref>:<DB_PASSWORD>@<pooler-host>:5432/postgres" \
     --schema=public --no-owner --no-privileges \
     --file="backups/blog-$(date +%F).sql"
   ```

3. **Restore** into an empty project's database:
   `psql "<connection-string-of-new-project>" -f backups/blog-YYYY-MM-DD.sql`.
   If you would rather start from the migrations, run those first and dump with `--data-only`.

**Option B — Supabase CLI:** `supabase db dump --linked -f backups/blog.sql` (add `--data-only` for data).

**Option C — quick copy from the dashboard:** Table Editor → choose `posts` / `categories` → export
as CSV. This includes the Markdown (`content_md`).

Keep backups **out of Git** (`/backups` is already in `.gitignore`); they contain your drafts. Also
keep the original `.md` files you upload: they are the easiest way to rebuild an article.

---

## 11. Project structure

```text
src/
├── app/
│   ├── (site)/                 Public pages with header/footer
│   │   ├── page.tsx            About
│   │   └── blog/               Blog home, category/[...path], post/[slug]
│   ├── admin/                  /admin/login + (panel)/ dashboard, categories, posts
│   ├── api/admin/              Protected Route Handlers (categories, posts)
│   ├── auth/                   callback (OAuth code → session) and signout
│   ├── robots.ts, sitemap.ts   SEO (drafts never included)
│   └── globals.css             The three colour variables + Markdown styles
├── components/                 about/, blog/, admin/, layout/, ui/
├── config/                     profile.ts (About content), site.ts
├── lib/
│   ├── auth/                   requireAdmin, admin identity + safe redirects
│   ├── categories/             tree building, cycle checks
│   ├── data/                   public.ts (anon client) and admin.ts (privileged)
│   ├── posts/                  Markdown parsing and upload validation
│   ├── supabase/               browser, server, proxy and admin clients
│   └── validations/            Zod schemas
├── proxy.ts                    Session refresh (Next.js 16 "proxy", formerly middleware)
└── types/
supabase/
├── migrations/                 Schema and RLS
└── seed.sql                    Optional starter categories
```

Design system: only three colours exist — background `#F6F9FC`, primary `#710014`, text `#000000` —
defined as CSS variables in `globals.css`. Tailwind's default palette and shadows are removed, so
other colours cannot be used by accident. States are never conveyed by colour alone (messages carry
an "Error:" / "Done:" prefix and differ by fill versus outline).

Public blog pages are rendered per request (`dynamic = "force-dynamic"`), so publishing or
unpublishing a post takes effect immediately without a redeploy.

---

## 12. Testing

`npm run lint`, `npm run typecheck`, `npm test` (unit tests) and `npm run build` must all pass before
you deploy.

What was verified for this project, against a real PostgreSQL with Supabase-style roles and Row Level
Security, a production build, and a stand-in for the Supabase API and Google sign-in:

- **Database** — migrations apply cleanly; the seed can run twice without duplicates; visitors and
  ordinary signed-in users can read published posts only and can never write or read drafts; circular
  categories, deleting a category that is in use, duplicate or malformed slugs and bad statuses are
  all rejected by the database itself.
- **Admin and API** — every `/api/admin/*` route returns 401 without a session (also with a forged
  cookie); another Google account, or the admin email without a verified Google identity, is signed out
  and gets nothing; cross-site requests are refused; sessions survive refresh and expired access
  tokens are refreshed; logout clears the cookies. Category and post CRUD, the whole
  Draft → Published → edit → replace file → Draft → delete cycle, and every rejected upload
  (`.mdx`, `.txt`, empty, blank, invalid UTF-8, binary, over 1 MB) behave as described above.
- **Interface** — at 1440, 1280, 1024, 768, 390 and 360 px wide: no sideways page scroll, a
  single `<h1>` per page, touch targets of at least 40 px on phones, the category sidebar collapsing
  into a button below 1280 px, working keyboard focus, and only the three palette colours (checked
  on computed styles and again on the rendered pixels, in light and dark browser modes).

What only **you** can verify, because it needs your own accounts and credentials: the real Google
sign-in with your Supabase project, the production Vercel deployment, and the free-tier limits that
apply to your accounts on the day you deploy.

---

## 13. Troubleshooting

- **"Missing or invalid environment variable(s)"** — a variable from section 2 is empty or
  malformed. Restart `npm run dev` after editing `.env.local`.
- **Google sign-in returns to the login page with an error** — check the redirect URLs in Supabase
  (section 3) and the redirect URI in Google (section 4).
- **"That Google account is not allowed…"** — you signed in with an account other than `ADMIN_EMAIL`.
- **Blog/Admin fail but About works** — usually a paused Supabase project or wrong keys.
- **Upload rejected** — only `.md` / `.markdown`, UTF-8 text, not empty, at most 1 MB.
