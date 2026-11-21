-- =====================================================================
-- Blog schema: nested categories + Markdown posts.
-- Markdown lives in posts.content_md (TEXT). No Supabase Storage needed.
-- =====================================================================

-- ---------------------------------------------------------------------
-- categories (self-referencing tree)
-- ---------------------------------------------------------------------
create table public.categories (
    id          uuid primary key default gen_random_uuid(),
    name        varchar(150) not null,
    -- Globally unique so a category can be found from the last URL segment.
    slug        varchar(180) not null unique,
    description text,
    parent_id   uuid references public.categories (id) on delete restrict,
    sort_order  integer not null default 0,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),

    -- `~ '\S'` means "contains a non-whitespace character". btrim() alone only
    -- strips spaces, so a value of only tabs/newlines would slip through.
    constraint categories_name_not_blank check (name ~ '\S'),
    constraint categories_slug_format
        check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    constraint categories_not_own_parent
        check (parent_id is null or parent_id <> id)
);

comment on table public.categories is
    'Blog categories. parent_id points at another row of this table (unlimited nesting).';

-- ---------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------
create table public.posts (
    id                uuid primary key default gen_random_uuid(),
    title             varchar(255) not null,
    slug              varchar(255) not null unique,
    excerpt           text,
    category_id       uuid not null references public.categories (id) on delete restrict,
    content_md        text not null,
    original_filename varchar(255),
    status            varchar(20) not null default 'draft'
                          check (status in ('draft', 'published')),
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now(),
    published_at      timestamptz,

    constraint posts_title_not_blank check (title ~ '\S'),
    constraint posts_slug_format
        check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    constraint posts_content_not_blank check (content_md ~ '\S'),
    -- A published post must always carry a publication timestamp.
    constraint posts_published_has_date
        check (status <> 'published' or published_at is not null)
);

comment on table public.posts is
    'Blog posts. The Markdown body is stored as text in content_md.';

-- ---------------------------------------------------------------------
-- Indexes (the UNIQUE constraints above already index categories.slug and
-- posts.slug)
-- ---------------------------------------------------------------------
create index categories_parent_id_idx  on public.categories (parent_id);
create index posts_category_id_idx     on public.posts (category_id);
create index posts_status_idx          on public.posts (status);
create index posts_published_at_idx    on public.posts (published_at desc);

-- ---------------------------------------------------------------------
-- Trigger: keep updated_at current
-- ---------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

create trigger categories_set_updated_at
    before update on public.categories
    for each row execute function public.set_updated_at();

create trigger posts_set_updated_at
    before update on public.posts
    for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Trigger: fill published_at the first time a post is published.
-- Runs before the CHECK constraint is evaluated. Un-publishing keeps the
-- original date, so re-publishing preserves the first publication date.
-- ---------------------------------------------------------------------
create function public.set_post_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if new.status = 'published' and new.published_at is null then
        new.published_at := now();
    end if;
    return new;
end;
$$;

create trigger posts_set_published_at
    before insert or update on public.posts
    for each row execute function public.set_post_published_at();

-- ---------------------------------------------------------------------
-- Trigger: forbid circular category hierarchies.
-- Defence in depth: the app checks this too, but the database is the
-- last line. UNION (not UNION ALL) keeps the walk finite.
-- ---------------------------------------------------------------------
create function public.prevent_category_cycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if new.parent_id is null then
        return new;
    end if;

    if new.parent_id = new.id then
        raise exception 'A category cannot be its own parent'
            using errcode = 'check_violation';
    end if;

    if exists (
        with recursive ancestors as (
            select c.id, c.parent_id
            from public.categories c
            where c.id = new.parent_id
            union
            select c.id, c.parent_id
            from public.categories c
            join ancestors a on c.id = a.parent_id
        )
        select 1 from ancestors where id = new.id
    ) then
        raise exception 'Circular category hierarchy is not allowed'
            using errcode = 'check_violation';
    end if;

    return new;
end;
$$;

create trigger categories_prevent_cycle
    before insert or update of parent_id on public.categories
    for each row execute function public.prevent_category_cycle();

-- Trigger functions are never meant to be called directly (e.g. over RPC).
revoke all on function public.set_updated_at()          from public, anon, authenticated;
revoke all on function public.set_post_published_at()   from public, anon, authenticated;
revoke all on function public.prevent_category_cycle()  from public, anon, authenticated;
