"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/settings", label: "Admin Settings" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-8 flex gap-4 overflow-x-auto border-y border-[var(--line)] py-3">
      {links.map((link) => {
        const active =
          link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`text-xs font-semibold tracking-[0.16em] uppercase ${
              active ? "text-[var(--ink)]" : "text-[var(--muted)]"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
