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

export function SiteHeader() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = query.trim();
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  return (
    <header className="border-b border-[var(--line)] bg-[var(--paper)]">
      <div className="flex justify-center px-4 pt-4">
        <Link href="/" aria-label="TJAY JEWELER home" className="inline-flex">
          <Image
            src="/images/brand/logo.png"
            alt=""
            width={1024}
            height={1024}
            priority
            sizes="(min-width: 640px) 96px, 72px"
            className="h-[4.5rem] w-[4.5rem] object-contain sm:h-24 sm:w-24"
          />
        </Link>
      </div>
      <nav aria-label="Categories" className="flex flex-wrap items-center justify-center gap-1 px-3 py-3">
        {categories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="font-ui inline-flex min-h-11 items-center px-3 text-xs tracking-[0.16em] uppercase hover:opacity-70"
          >
            {category.label}
          </Link>
        ))}
      </nav>
      <div className="flex flex-col gap-3 px-4 pb-4 sm:flex-row sm:items-center">
        <form onSubmit={onSearch} className="min-w-0 flex-1">
          <label className="flex min-h-11 min-w-0 items-center gap-2 border border-[var(--line-strong)] bg-[var(--paper)] px-3 focus-within:border-white">
            <Search size={16} aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label="Search"
              className="font-ui w-full min-w-0 bg-transparent text-sm outline-none"
            />
          </label>
        </form>
        <Link
          href="/account"
          className="font-ui inline-flex min-h-11 shrink-0 items-center gap-2 self-start px-1 text-xs tracking-[0.16em] uppercase sm:self-auto"
        >
          <UserRound size={16} aria-hidden />
          Account
        </Link>
      </div>
    </header>
  );
}
