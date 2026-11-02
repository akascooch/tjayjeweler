"use client";

import { Menu, Search, UserRound, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { isSiteNavActive, shouldCloseMenuOnPath, siteNavLinks } from "@/lib/site-nav";

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousPath = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  function closeMenu() {
    setOpen(false);
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

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = query.trim();
    setOpen(false);
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  return (
    <header className="border-b border-[var(--line)] bg-[var(--paper)]">
      <div className="relative grid min-h-[5.5rem] grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 px-3 pt-3 pb-3 sm:min-h-[6.5rem] sm:px-4">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label="Open menu"
          className="inline-flex h-11 w-11 items-center justify-center border border-[var(--line-strong)]"
        >
          <Menu size={18} aria-hidden />
        </button>
        <div className="flex justify-center">
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
        <span aria-hidden className="h-11 w-11" />
      </div>

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

            <form onSubmit={onSearch} className="mt-6">
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
