import Link from "next/link";

export interface Crumb {
  label: string;
  /** Omit for the current page. */
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? (
              <Link href={item.href} className="link link-target">
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={index === items.length - 1 ? "page" : undefined}
                className="inline-flex min-h-11 items-center font-semibold xl:min-h-0"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
