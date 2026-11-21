"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

interface NavItem {
  label: string;
  href: string;
}

function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

/** Horizontal links from 768px up; a compact menu button below that. */
export function MainNavigation({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (active: boolean) =>
    `inline-flex min-h-11 items-center border-2 px-4 font-semibold ${
      active
        ? "border-background bg-background text-primary"
        : "border-transparent text-ink hover:text-background"
    }`;

  return (
    <>
      <nav aria-label="Main" className="hidden md:block">
        <ul className="flex items-center gap-2">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={linkClass(active)}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        type="button"
        className="btn-outline btn-sm md:hidden"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name={open ? "close" : "menu"} />
        <span>{open ? "Close" : "Menu"}</span>
      </button>

      {open ? (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="absolute inset-x-0 top-full border-b-2 border-primary bg-background md:hidden"
        >
          <ul className="container-page flex flex-col gap-1 py-3">
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`${linkClass(active)} w-full`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </>
  );
}
