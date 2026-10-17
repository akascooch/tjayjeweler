"use client";

import { Search, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const categories = [
  { href: "/rings", label: "Rings" },
  { href: "/pendants-chains", label: "Chains" },
  { href: "/cuffs-bracelets", label: "Cuffs" },
  { href: "/custom", label: "Custom" },
];

export function Sidebar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = query.trim();
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] md:sticky md:top-0 md:h-dvh md:w-64 md:border-r md:border-b-0">
      <div className="border-b border-[var(--line)] px-5 py-5">
        <Link href="/" className="inline-flex max-w-full items-center">
          <Image
            src="/images/brand/logo.png"
            alt="TJAY JEWELER"
            width={1024}
            height={1024}
            priority
            sizes="(min-width: 768px) 112px, 80px"
            className="h-20 w-20 object-contain md:h-28 md:w-28"
          />
        </Link>
      </div>
      <nav className="flex gap-4 overflow-x-auto px-5 py-4 md:flex-col md:gap-3 md:overflow-visible">
        {categories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="py-1 text-sm font-semibold tracking-[0.16em] uppercase hover:opacity-70"
          >
            {category.label}
          </Link>
        ))}
      </nav>
      <form onSubmit={onSearch} className="mt-auto border-t border-[var(--line)] px-5 py-4">
        <label className="flex items-center gap-2 border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 focus-within:border-white">
          <Search size={16} aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <Link
          href="/account"
          className="mt-3 inline-flex min-h-9 items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase"
        >
          <UserRound size={16} aria-hidden />
          Account
        </Link>
      </form>
    </aside>
  );
}
