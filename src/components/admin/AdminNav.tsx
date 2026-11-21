"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Posts", href: "/admin/posts" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin">
      <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
        {ITEMS.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center border-2 px-4 font-semibold ${
                  active
                    ? "border-primary bg-primary text-background"
                    : "border-transparent hover:border-primary hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
