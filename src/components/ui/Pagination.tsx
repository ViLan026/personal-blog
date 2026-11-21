import Link from "next/link";

/**
 * Previous / next links. `params` carries other query values (filters, search)
 * so they survive when the page changes.
 */
export function Pagination({
  basePath,
  page,
  totalPages,
  params = {},
}: {
  basePath: string;
  page: number;
  totalPages: number;
  params?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    if (target > 1) search.set("page", String(target));
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className="btn-outline">
          Previous
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      <p className="font-medium">
        Page {page} of {totalPages}
      </p>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className="btn-outline">
          Next
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
