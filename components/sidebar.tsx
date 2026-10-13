"use client";

import { Moon, Search, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { FormEvent, useEffect, useState } from "react";

const categories = [
  { href: "/rings", label: "Rings" },
  { href: "/pendants-chains", label: "Chains" },
  { href: "/cuffs-bracelets", label: "Cuffs" },
  { href: "/custom", label: "Custom" },
];

export function Sidebar() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = query.trim();
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <aside className="flex w-full shrink-0 flex-col border-[var(--line)] bg-[var(--sidebar)] text-[var(--ink)] md:sticky md:top-0 md:h-dvh md:w-64 md:border-r">
      <div className="border-b border-[var(--line)] px-5 py-5">
        <Link href="/" className="inline-flex max-w-full items-center">
          {/* Brand file is a static public asset, not a remote CMS URL. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/brand/logo.webp"
            alt="TJAY JEWELER"
            width={1024}
            height={1024}
            className="h-16 w-16 bg-black object-contain md:h-24 md:w-24"
          />
        </Link>
      </div>
      <nav className="flex gap-4 overflow-x-auto px-5 py-4 md:flex-col md:gap-3 md:overflow-visible">
        {categories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="text-sm font-semibold tracking-[0.16em] uppercase hover:opacity-70"
          >
            {category.label}
          </Link>
        ))}
      </nav>
      <form onSubmit={onSearch} className="mt-auto border-t border-[var(--line)] px-5 py-4">
        <label className="flex items-center gap-2 border border-[var(--line)] bg-[var(--paper)] px-3 py-2">
          <Search size={16} aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <div className="mt-3 flex items-center justify-between">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase"
          >
            <UserRound size={16} aria-hidden />
            Account
          </Link>
          <button
            type="button"
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="inline-flex h-9 w-9 items-center justify-center border border-[var(--line)]"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </form>
    </aside>
  );
}
