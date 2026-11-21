-- =====================================================================
-- Row Level Security
--
--   Public visitors (anon) and ordinary signed-in users (authenticated):
--     * may READ categories and PUBLISHED posts
--     * may NOT read drafts, and may NOT insert / update / delete anything
--
--   All writes (and draft reads in /admin) go through the server-only
--   Supabase secret key (service_role), which bypasses RLS. Next.js only
--   uses that key after requireAdmin() has verified the administrator.
-- =====================================================================

alter table public.categories enable row level security;
alter table public.posts      enable row level security;

-- Belt and braces: take away table privileges that Supabase grants by
-- default, then give back SELECT only. Even if a policy were added by
-- mistake later, these roles still could not write.
revoke all on table public.categories from anon, authenticated;
revoke all on table public.posts      from anon, authenticated;
grant select on table public.categories to anon, authenticated;
grant select on table public.posts      to anon, authenticated;

-- ---------------------------------------------------------------------
-- Read policies
-- ---------------------------------------------------------------------
create policy "Public can read categories"
    on public.categories
    for select
    to anon, authenticated
    using (true);

create policy "Public can read published posts"
    on public.posts
    for select
    to anon, authenticated
    using (status = 'published');

-- ---------------------------------------------------------------------
-- Explicit write denials (RLS already denies by default; these make the
-- intent visible in the dashboard and in code review)
-- ---------------------------------------------------------------------
create policy "No public inserts on categories"
    on public.categories for insert to anon, authenticated
    with check (false);

create policy "No public updates on categories"
    on public.categories for update to anon, authenticated
    using (false) with check (false);

create policy "No public deletes on categories"
    on public.categories for delete to anon, authenticated
    using (false);

create policy "No public inserts on posts"
    on public.posts for insert to anon, authenticated
    with check (false);

create policy "No public updates on posts"
    on public.posts for update to anon, authenticated
    using (false) with check (false);

create policy "No public deletes on posts"
    on public.posts for delete to anon, authenticated
    using (false);
