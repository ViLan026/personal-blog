-- =====================================================================
-- OPTIONAL starter categories (the example tree from the project brief).
-- Safe to run more than once: rows are matched by slug and never
-- duplicated, and existing categories are left untouched, so anything you
-- renamed or moved in /admin is preserved. No articles are created.
--
-- Run it in the Supabase SQL Editor (or `supabase db reset` locally).
-- You can delete or rearrange every category later from /admin/categories.
-- =====================================================================

do $$
declare
    item record;
begin
    -- Parents must be inserted before children, hence ORDER BY depth.
    for item in
        select *
        from (values
            -- depth, name, slug, parent_slug, sort_order
            (0, 'Computer Science',      'computer-science',     null,                   10),
            (0, 'Programming',           'programming',          null,                   20),
            (0, 'Infrastructure',        'infrastructure',       null,                   30),
            (0, 'English',               'english',              null,                   40),

            (1, 'Operating Systems',     'operating-systems',    'computer-science',     10),
            (1, 'Computer Networks',     'computer-networks',    'computer-science',     20),
            (1, 'Database',              'database',             'computer-science',     30),
            (1, 'Java',                  'java',                 'programming',          10),
            (1, 'Linux',                 'linux',                'infrastructure',       10),
            (1, 'Docker',                'docker',               'infrastructure',       20),
            (1, 'CI/CD',                 'ci-cd',                'infrastructure',       30),
            (1, 'Grammar',               'grammar',              'english',              10),
            (1, 'IT Vocabulary',         'it-vocabulary',        'english',              20),
            (1, 'Interview Preparation', 'interview-preparation','english',              30),

            (2, 'Process and Thread',    'process-and-thread',   'operating-systems',    10),
            (2, 'Memory Management',     'memory-management',    'operating-systems',    20),
            (2, 'CPU Scheduling',        'cpu-scheduling',       'operating-systems',    30),
            (2, 'TCP/IP',                'tcp-ip',               'computer-networks',    10),
            (2, 'HTTP',                  'http',                 'computer-networks',    20),
            (2, 'DNS',                   'dns',                  'computer-networks',    30),
            (2, 'SQL',                   'sql',                  'database',             10),
            (2, 'Indexing',              'indexing',             'database',             20),
            (2, 'Transactions',          'transactions',         'database',             30),
            (2, 'OOP',                   'oop',                  'java',                 10),
            (2, 'Collections',           'collections',          'java',                 20),
            (2, 'JVM',                   'jvm',                  'java',                 30),
            (2, 'Spring Boot',           'spring-boot',          'java',                 40)
        ) as t (depth, name, slug, parent_slug, sort_order)
        order by depth, sort_order
    loop
        insert into public.categories (name, slug, parent_id, sort_order)
        values (
            item.name,
            item.slug,
            (select c.id from public.categories c where c.slug = item.parent_slug),
            item.sort_order
        )
        on conflict (slug) do nothing;
    end loop;
end;
$$;
