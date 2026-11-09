"use client";

import { Menu, Search, UserRound, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState, type Ref } from "react";
import { searchQuery } from "@/lib/search-text";
import { isSiteNavActive, shouldCloseMenuOnPath, siteNavLinks } from "@/lib/site-nav";

function SearchField({
  query,
  onQuery,
  inputRef,
  onEscape,
}: {
  query: string;
  onQuery: (value: string) => void;
  inputRef?: Ref<HTMLInputElement>;
  onEscape?: () => void;
}) {
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Escape" || !onEscape) return;
    event.preventDefault();
    onEscape();
  }

  return (
    <label className="flex min-h-11 min-w-0 items-center gap-2 border border-[var(--line-strong)] bg-[var(--paper)] px-3 focus-within:border-white">
      <button type="submit" aria-label="Submit search" className="inline-flex shrink-0 items-center justify-center">
        <Search size={16} aria-hidden />
      </button>
      <input
        ref={inputRef}
        name="q"
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search"
        aria-label="Search"
        enterKeyHint="search"
        maxLength={200}
        className="font-ui w-full min-w-0 bg-transparent text-sm"
      />
    </label>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousPath = useRef<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  function closeSearch() {
    setSearchOpen(false);
    searchToggleRef.current?.focus();
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function onDialogClose() {
      setOpen(false);
    }

    dialog.addEventListener("close", onDialogClose);
    return () => dialog.removeEventListener("close", onDialogClose);
  }, []);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    if (!dialog) return;

    if (!dialog.open) dialog.showModal();
    closeRef.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
      trigger?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (shouldCloseMenuOnPath(pathname, previousPath.current)) {
      setOpen(false);
    }
    previousPath.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 640px)");
    function onChange() {
      if (wide.matches) setSearchOpen(false);
    }
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = searchQuery(query);
    setOpen(false);
    setSearchOpen(false);
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  return (
    <header className="border-b border-[var(--line)] bg-[var(--paper)]">
      <div className="relative flex min-h-[5.5rem] items-center gap-2 px-3 sm:min-h-[6.5rem] sm:px-4">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label="Open menu"
          className="relative z-20 inline-flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--line-strong)]"
        >
          <Menu size={18} aria-hidden />
        </button>
        <Link
          href="/"
          aria-label="TJAY JEWELER home"
          className="absolute top-1/2 left-1/2 z-10 inline-flex -translate-x-1/2 -translate-y-1/2"
        >
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
        <form
          action="/search"
          method="get"
          onSubmit={onSearch}
          className="relative z-20 ml-auto hidden w-[min(16rem,calc(50%-4.5rem))] min-w-0 sm:block"
        >
          <SearchField query={query} onQuery={setQuery} />
        </form>
        <button
          ref={searchToggleRef}
          type="button"
          onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
          aria-expanded={searchOpen}
          aria-controls="header-search"
          aria-label={searchOpen ? "Close search" : "Open search"}
          className="relative z-20 ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--line-strong)] sm:hidden"
        >
          {searchOpen ? <X size={18} aria-hidden /> : <Search size={18} aria-hidden />}
        </button>
      </div>

      <form
        id="header-search"
        action="/search"
        method="get"
        hidden={!searchOpen}
        onSubmit={onSearch}
        className="px-3 pb-3 sm:hidden"
      >
        <SearchField query={query} onQuery={setQuery} inputRef={searchInputRef} onEscape={closeSearch} />
      </form>

      <dialog
        ref={dialogRef}
        id="site-menu"
        aria-labelledby={titleId}
        className="site-menu m-0 h-dvh max-h-dvh w-[min(100%,22rem)] max-w-none border-0 bg-[var(--paper)] p-0 text-[var(--ink)]"
        onCancel={(event) => {
          event.preventDefault();
          closeMenu();
        }}
      >
        <div className="flex h-full min-h-0 w-full flex-col border-r border-[var(--line)] bg-[var(--paper)] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
            <p id={titleId} className="font-ui text-xs tracking-[0.2em] uppercase">
              Menu
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              className="inline-flex h-11 w-11 items-center justify-center border border-[var(--line-strong)]"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <nav aria-label="Categories" className="grid gap-1">
              {siteNavLinks.map((link) => {
                const active = isSiteNavActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`font-ui inline-flex min-h-11 items-center px-2 text-sm tracking-[0.16em] uppercase ${
                      active ? "text-white" : "text-[var(--muted)] hover:text-white"
                    }`}
                    onClick={closeMenu}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="shrink-0 border-t border-[var(--line)] px-4 py-3">
            <Link
              href="/account"
              aria-current={isSiteNavActive(pathname, "/account") ? "page" : undefined}
              className="font-ui inline-flex min-h-11 w-full items-center gap-2 px-2 text-sm tracking-[0.16em] uppercase"
              onClick={closeMenu}
            >
              <UserRound size={16} aria-hidden />
              Account
            </Link>
          </div>
        </div>
      </dialog>
    </header>
  );
}
